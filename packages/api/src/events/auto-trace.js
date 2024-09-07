import {
  LambdaClient,
  ListFunctionsCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  ApiGatewayV2Client,
  GetApisCommand,
} from "@aws-sdk/client-apigatewayv2";

const supportedRuntimes = ["nodejs16.x", "nodejs18.x", "nodejs20.x"];
const lambdaExecWrapper = "/opt/nodejs/tracer_wrapper";

const getAccountLambdas = async () => {
  const lambdaClient = new LambdaClient();

  let nextToken = null;
  let lambdas = [];

  do {
    const listFunctionsCommand = new ListFunctionsCommand({
      Marker: nextToken,
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

export const autoTrace = async () => {
  // Check if we know our Lambda Layer ARN
  const arn = process.env.LAMBDA_LAYER_ARN;
  const arnBase = arn?.substring(0, arn?.lastIndexOf(":") + 1);
  if (!arn || !arnBase) {
    throw new Error("LAMBDA_LAYER_ARN is not defined");
  }

  // Get our API Gateway endpoint for the collector
  const edgeEndpoint = await getApiEndpoint();

  // List all the lambda functions in the AWS account
  const lambdas = await getAccountLambdas();

  // Find all lambdas that need a layer added
  let lambdasWithoutLayer = lambdas.filter((lambda) => {
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

    return (
      (!hasLayer || hasUpdate) &&
      !hasDisableEnvVar &&
      !hasOtherWrapper &&
      !isUpdating &&
      !isTraceStack &&
      hasSupportedRuntime
    );
  });

  console.log(`Found ${lambdasWithoutLayer.length} lambdas to update`);

  for (const lambda of lambdasWithoutLayer) {
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

    const res = await new LambdaClient().send(
      updateFunctionConfigurationCommand,
    );
    console.log(res);

    console.log(`✓ Updated ${lambda.FunctionName}`);

    // TODO: save function info in DynamoDB
  }
};
