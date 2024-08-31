import { middleware, auth } from "@includable/serverless-middleware";
import { v4 as uuid } from "uuid";

import { getSignedUrl, sanitizeFilename } from "../../../lib/media";

const dependencies = () => ({
  getSignedUrl,
  uuid,
});

const defaultParams = {
  type: "avatar",
  filename: "image.jpg",
  contentType: "image/jpeg",
};

export const app = async (
  { query = {} },
  { currentUser, getSignedUrl, uuid },
) => {
  const { filename, type, contentType } = { ...defaultParams, ...query };
  const safeFilename = sanitizeFilename(filename);
  const safeType = sanitizeFilename(type);
  const key = `${safeType}/${currentUser.id}/${uuid()}/${safeFilename}`;

  const uploadUrl = await getSignedUrl(key, contentType, {
    "x-upload-user": currentUser.id,
    "x-upload-category": safeType,
    "x-upload-filename": filename,
  });

  return {
    uploadUrl,
    publicUrl: `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`,
  };
};

export const handler = middleware(app, [auth]).register(dependencies);
