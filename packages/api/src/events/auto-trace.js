import {
  GetFunctionCommand,
  LambdaClient,
  ListFunctionsCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  ApiGatewayV2Client,
  GetApisCommand,
} from "@aws-sdk/client-apigatewayv2";
import pLimit from "p-limit";

import { acquireLock, releaseLock } from "../lib/locks";
import Logger from "../lib/logger";
import { put } from "../lib/database";

const supportedRuntimes = ["nodejs16.x", "nodejs18.x", "nodejs20.x"];
const lambdaExecWrapper = "/opt/nodejs/tracer_wrapper";

const logger = new Logger("auto-trace");

const getAccountLambdas = async () => {
  const lambdaClient = new LambdaClient();

  let nextToken = null;
  let lambdas = [];

  do {
    const listFunctionsCommand = new ListFunctionsCommand({
      Marker: nextToken,
      MaxItems: 50,
    });
    const { Functions, NextMarker } =
      await lambdaClient.send(listFunctionsCommand);
    lambdas = lambdas.concat(Functions);
    nextToken = NextMarker;
  } while (nextToken);

  return lambdas;
};

const getApiEndpoint = async () => {
  const apiGatewayV2Client = new ApiGatewayV2Client();

  const getApisCommand = new GetApisCommand({
    MaxResults: "1000",
  });
  const { Items } = await apiGatewayV2Client.send(getApisCommand);
  const item = Items.find((item) => item.Name === process.env.API_GATEWAY_NAME);

  if (!item) {
    throw new Error(`API Gateway ${process.env.API_GATEWAY_NAME} not found`);
  }

  return item.ApiEndpoint?.replace("https://", "");
};

const updateLambda = async (lambda, arnBase, edgeEndpoint) => {
  const updateFunctionConfigurationCommand =
    new UpdateFunctionConfigurationCommand({
      FunctionName: lambda.FunctionName,
      Layers: [
        ...(lambda.Layers || [])
          .map((layer) => layer.Arn)
          .filter((arn) => !arn.startsWith(arnBase)),
        process.env.LAMBDA_LAYER_ARN,
      ],
      Environment: {
        ...(lambda.Environment || {}),
        Variables: {
          ...(lambda.Environment?.Variables || {}),
          AUTO_TRACE_HOST: edgeEndpoint,
          AWS_LAMBDA_EXEC_WRAPPER: lambdaExecWrapper,
        },
      },
    });

  const res = await new LambdaClient().send(updateFunctionConfigurationCommand);
  logger.info(res);
};

const getLambdaTags = async (lambda) => {
  // try not to run into the 100 requests per second limit
  await new Promise((resolve) => setTimeout(resolve, 250));
  const lambdaClient = new LambdaClient();
  const { Tags } = await lambdaClient.send(
    new GetFunctionCommand({
      FunctionName: lambda.FunctionName,
    }),
  );

  return Tags;
};

const saveFunctionInfo = async (lambda, traceStatus) => {
  let tags;
  try {
    tags = await getLambdaTags(lambda);
  } catch (e) {
    logger.warn(`Failed to get tags for ${lambda.FunctionName}`, e);
  }

  await put(
    {
      pk: `function#${process.env.AWS_REGION}#${lambda.FunctionName}`,
      sk: `function#${process.env.AWS_REGION}`,
      name: lambda.FunctionName,
      type: "function",
      runtime: lambda.Runtime,
      region: process.env.AWS_REGION,
      arn: lambda.FunctionArn,
      memoryAllocated: lambda.MemorySize,
      timeout: lambda.Timeout * 1000,
      traceStatus,
      tags: tags || {},
    },
    true,
  );
};

export const autoTrace = async () => {
  // Check if we know our Lambda Layer ARN
  const arn = process.env.LAMBDA_LAYER_ARN;
  const arnBase = arn?.substring(0, arn?.lastIndexOf(":") + 1);
  if (!arn || !arnBase) {
    throw new Error("LAMBDA_LAYER_ARN is not defined");
  }

  // Get our API Gateway endpoint for the collector
  const edgeEndpoint = await getApiEndpoint();

  // Make sure we lock so that only one process is updating lambdas
  const lockAcquired = await acquireLock("auto-trace");
  if (!lockAcquired) {
    logger.info("Lock not acquired, skipping");
    return;
  }

  // List all the lambda functions in the AWS account
  const lambdas = await getAccountLambdas();
  logger.info(`Found ${lambdas.length} lambdas in the account`);

  // Update qualifying lambdas
  const limit = pLimit(4);
  await Promise.all(
    lambdas.map((lambda) =>
      limit(async () => {
        const layers = lambda.Layers || [];
        const envVars = lambda.Environment?.Variables || {};

        const isTraceStack = envVars.LAMBDA_LAYER_ARN === arn;
        const isUpdating = lambda.LastUpdateStatus === "InProgress";
        const hasDisableEnvVar = envVars.AUTO_TRACE_EXCLUDE;
        const hasOtherWrapper =
          envVars.AWS_LAMBDA_EXEC_WRAPPER &&
          envVars.AWS_LAMBDA_EXEC_WRAPPER !== lambdaExecWrapper;
        const hasSupportedRuntime = supportedRuntimes.includes(lambda.Runtime);
        const hasLayer = layers.find(({ Arn }) => Arn.startsWith(arnBase));
        const hasUpdate = layers.find(
          ({ Arn }) => Arn.startsWith(arnBase) && Arn !== arn,
        );

        if (hasLayer && !hasUpdate) {
          logger.info(`- ${lambda.FunctionName} already has the latest layer`);
          await saveFunctionInfo(lambda, "enabled");
          return;
        }
        if (hasDisableEnvVar) {
          logger.info(`- ${lambda.FunctionName} has AUTO_TRACE_EXCLUDE`);
          await saveFunctionInfo(lambda, "excluded");
          return;
        }
        if (hasOtherWrapper) {
          logger.info(`- ${lambda.FunctionName} has a custom wrapper`);
          await saveFunctionInfo(lambda, "custom_wrapper");
          return;
        }
        if (isUpdating) {
          logger.info(`- ${lambda.FunctionName} is already updating`);
          await saveFunctionInfo(lambda, "update_in_progress");
          return;
        }
        if (isTraceStack) {
          logger.info(`- ${lambda.FunctionName} is part of TraceStack`);
          return;
        }
        if (!hasSupportedRuntime) {
          logger.info(`- ${lambda.FunctionName} has an unsupported runtime`);
          await saveFunctionInfo(lambda, "unsupported_runtime");
          return;
        }

        try {
          await updateLambda(lambda, arnBase, edgeEndpoint);

          logger.info(`✓ Updated ${lambda.FunctionName}`);
          await saveFunctionInfo(lambda, "enabled");
        } catch (e) {
          logger.warn(`✗ Failed to update ${lambda.FunctionName}`, e);
          await saveFunctionInfo(lambda, "error");
        }
      }),
    ),
  );

  await releaseLock("auto-trace");
};
