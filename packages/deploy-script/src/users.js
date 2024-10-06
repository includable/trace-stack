import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import bcryptjs from "bcryptjs";

const translateConfig = {
  marshallOptions: {
    convertEmptyValues: false,
  },
};

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient(),
  translateConfig,
);

export const checkHasUsers = async () => {
  const { Items } = await dynamo.send(
    new QueryCommand({
      TableName: "trace-stack-dev",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":type": "user",
      },
      IndexName: "type-sk",
    }),
  );

  return !!Items?.length;
};

export const createAdminUser = async () => {
  const randomPassword = crypto.randomBytes(20).toString("hex");
  await dynamo.send(
    new PutCommand({
      TableName: "trace-stack-dev",
      Item: {
        pk: "user#admin",
        sk: "user#admin",
        type: "user",
        name: "admin",
        passwordHash: bcryptjs.hashSync(randomPassword),
      },
    }),
  );

  return randomPassword;
};
