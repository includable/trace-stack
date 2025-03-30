import invoker from "@laconia/test";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

export const invoke = async (lambda = "main", action = "") => {
  try {
    await invoker(`trace-e2e-testing-${lambda}`).requestResponse({ action });
  } catch (error) {}
};

const Bucket = `trace-stack-traces-devaedeaeb5ce5f55f43c9c032eff16f778`;

export const truncate = () => {
  const s3 = new S3Client();
  const params = { Bucket };
  return s3.send(new ListObjectsV2Command(params)).then(({ Contents }) => {
    if (!Contents) return;
    const deleteParams = {
      Bucket,
      Delete: {
        Objects: Contents.map((item) => ({ Key: item.Key })),
      },
    };
    return s3.send(new DeleteObjectsCommand(deleteParams));
  });
};

const listByPrefix = async (prefix) => {
  const s3 = new S3Client();
  const output = [];
  let pageToken = undefined;

  do {
    const params = {
      Bucket,
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

export const get = async (key) => {
  const s3 = new S3Client();
  const params = {
    Bucket,
    Key: key,
  };

  const { Body } = await s3.send(new GetObjectCommand(params));
  const string = await Body?.transformToString();
  return string && JSON.parse(string);
};

const listAndRead = async (prefix) => {
  const keys = await listByPrefix(prefix);
  const data = await Promise.all(keys.map(async (key) => get(key)));

  return data;
};

export const getErrors = async () => {
  return listAndRead("errors/");
};
