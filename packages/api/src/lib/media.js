import { getSignedUrl as s3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({ useAccelerateEndpoint: true });

const illegalRe = /[\/?<>\\:*|"]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const windowsTrailingRe = /[. ]+$/;

export const sanitizeFilename = (input) =>
  input
    .replace(illegalRe, "-")
    .replace(controlRe, "-")
    .replace(reservedRe, "-")
    .replace(windowsReservedRe, "-")
    .replace(windowsTrailingRe, "-")
    .replace(/ /g, "-");

export async function getSignedUrl(key, contentType, metadata = {}) {
  const command = new PutObjectCommand({
    Key: key,
    Bucket: process.env.S3_BUCKET,
    ContentType: contentType,
    ACL: "public-read",
    Metadata: metadata,
  });

  return s3SignedUrl(client, command, { expiresIn: 3600 });
}
