import {
  GetFunctionCommand,
  LambdaClient,
  ListFunctionsCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import pLimit from "p-limit";

import Logger from "../lib/logger";

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

const updateLambda = async (lambda, arnBase) => {
  const command = new UpdateFunctionConfigurationCommand({
    FunctionName: lambda.FunctionName,
    Layers: [
      ...(lambda.Layers || [])
        .map((layer) => layer.Arn)
        .filter((arn) => !arn.startsWith(arnBase)),
    ],
    Environment: {
      ...(lambda.Environment || {}),
      Variables: {
        ...(lambda.Environment?.Variables || {}),
        AUTO_TRACE_QUEUE_URL: undefined,
        AUTO_TRACE_QUEUE_REGION: undefined,
        AWS_LAMBDA_EXEC_WRAPPER: undefined,
      },
    },
  });

  await new LambdaClient().send(command);
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

export const unTrace = async () => {
  // Check if we know our Lambda Layer ARN
  const arn = process.env.LAMBDA_LAYER_ARN;
  const arnBase = arn?.substring(0, arn?.lastIndexOf(":") + 1);
  if (!arn || !arnBase) {
    throw new Error("LAMBDA_LAYER_ARN is not defined");
  }

  // List all the lambda functions in the AWS account
  let lambdas = await getAccountLambdas();
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
        const hasLayer = layers.find(({ Arn }) => Arn.startsWith(arnBase));
        const hasOtherWrapper =
          envVars.AWS_LAMBDA_EXEC_WRAPPER &&
          envVars.AWS_LAMBDA_EXEC_WRAPPER !== lambdaExecWrapper;

        if (hasLayer && !isTraceStack && !isUpdating && !hasOtherWrapper) {
          try {
            await updateLambda(lambda, arnBase);
            logger.info(`✓ Removed layer from ${lambda.FunctionName}`);
          } catch (e) {
            logger.warn(`✗ Failed to update ${lambda.FunctionName}`, e);
          }
        }
      }),
    ),
  );
};
