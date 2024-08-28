import { Table } from "dynamodb-toolbox";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const translateConfig = {
  marshallOptions: {
    convertEmptyValues: false,
  },
};

export const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient(),
  translateConfig,
);

export const table = new Table({
  name: process.env.TABLE_NAME,
  partitionKey: "pk",
  sortKey: "sk",
  entityField: "type",
  indexes: {
    "type-sk": {
      partitionKey: "type",
      sortKey: "sk",
    },
  },
  DocumentClient: dynamo,
});

export const date = () => new Date().toISOString();
export const time = (date = null) =>
  Math.floor((date || new Date()).valueOf() / 1000);
