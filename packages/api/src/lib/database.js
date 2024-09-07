import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
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

export const time = () => Math.floor(Date.now() / 1000);

export const getExpiryTime = () =>
  time() + 86400 * Number(process.env.DATA_RETENTION_DAYS);

export const put = async (item, expires = false, options = {}) => {
  item = {
    ...item,
    _created: time(),
    ...(expires
      ? {
          _expires: getExpiryTime(),
        }
      : {}),
  };

  return await dynamo.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
      ...options
    }),
  );
};

export const query = async (
  /** @type {Omit<import("@aws-sdk/lib-dynamodb").QueryCommandInput, "TableName">} */ params,
) => {
  return await dynamo.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      ...params,
    }),
  );
};

export const update = async (
  /** @type {Omit<import("@aws-sdk/lib-dynamodb").UpdateCommandInput, "TableName">} */ params,
) => {
  return await dynamo.send(
    new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      ...params,
    }),
  );
};

export const deleteItem = async (Key) => {
  return await dynamo.send(
    new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key,
    }),
  );
}

export const queryAll = async (
  /** @type {Omit<import("@aws-sdk/lib-dynamodb").QueryCommandInput, "TableName">} */ params,
) => {
  let allItems = [];
  while (true) {
    const { Items, LastEvaluatedKey } = await query(params);
    allItems = allItems.concat(Items);
    if (!LastEvaluatedKey) {
      break;
    }
  }
  return allItems;
};
