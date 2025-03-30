import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
