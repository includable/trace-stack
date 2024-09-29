import invoker from "@laconia/test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const translateConfig = {
  marshallOptions: {
    convertEmptyValues: false,
  },
};

export const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient(),
  translateConfig,
);

export const invoke = async (lambda = "main", action = "") => {
  try {
    await invoker(`trace-e2e-testing-${lambda}`).requestResponse({ action });
  } catch (error) {}
};

export const truncate = () => {
  return dynamo
    .send(
      new ScanCommand({
        TableName: "trace-stack-dev",
      }),
    )
    .then(async ({ Items, LastEvaluatedKey }) => {
      for (const item of Items || []) {
        await dynamo.send(
          new DeleteCommand({
            TableName: "trace-stack-dev",
            Key: {
              pk: item.pk,
              sk: item.sk,
            },
          }),
        );
      }
      if (LastEvaluatedKey) {
        await truncate();
      }
    });
};

export const query = async (
  /** @type {Omit<import("@aws-sdk/lib-dynamodb").QueryCommandInput, "TableName">} */ params,
) => {
  return await dynamo.send(
    new QueryCommand({
      TableName: "trace-stack-dev",
      ...params,
    }),
  );
};

export const getErrors = async () => {
  const { Items } = await query({
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":type": "error",
    },
    IndexName: "type-lastSeen",
    Limit: 50,
    ScanIndexForward: false,
  });

  return Items;
};
