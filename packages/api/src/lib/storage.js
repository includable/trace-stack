import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const s3 = new S3Client();

export const store = async (key, data) => {
  const datePrefix = new Date().toISOString().split("T")[0];
  const bucketName = process.env.STORAGE_BUCKET_NAME;

  if (Array.isArray(key)) key = key.join("/");

  const params = {
    Bucket: bucketName,
    Key: `${datePrefix}/${key}`,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  };

  return s3.send(new PutObjectCommand(params));
};

export const listByPrefix = async (prefix) => {
  const output = [];
  let pageToken = undefined;

  do {
    const params = {
      Bucket: process.env.STORAGE_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: pageToken,
    };

    const command = new ListObjectsV2Command(params);
    const { Contents, NextContinuationToken } = await s3.send(command);

    output.push(...(Contents?.map((item) => item.Key) || []));
    pageToken = NextContinuationToken;
  } while (pageToken && output.length < 10000);

  return output;
};

export const list = async (startDate, endDate, prefix) => {
  // Get a list of all days between startDate and endDate
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateList.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get all keys for each date, and flatten the array
  const allKeys = await Promise.all(
    dateList.map((date) => listByPrefix(`${date}/${prefix}`)),
  );

  return allKeys.flat();
};

export const get = async (key) => {
  const params = {
    Bucket: process.env.STORAGE_BUCKET_NAME,
    Key: key,
  };

  const { Body } = await s3.send(new GetObjectCommand(params));
  const string = await Body?.transformToString();
  return string && JSON.parse(string);
};

export const listAndRead = async (startDate, endDate, prefix) => {
  const keys = await list(startDate, endDate, prefix);
  const data = await Promise.all(keys.map(async (key) => get(key)));

  return data;
};
