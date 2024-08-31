import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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

export const put = async (item, expires = false) => {
  item = {
    ...item,
    _created: time(),
    ...(expires
      ? {
          _expires: time() + 86400 * Number(process.env.DATA_RETENTION_DAYS),
        }
      : {}),
  };

  console.log(item);

  return await dynamo.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    }),
  );
};
