import slug from "slug";

const removeUniqueIds = (str) => {
  // uuids
  str = str.replace(/[a-f0-9]([a-f0-9-]{24,34})[a-f0-9]/g, "{value}");

  // unix and epoch timestamps
  str = str.replace(/[0-9]{6,20}/g, "{value}");

  return str;
};

export const getErrorKey = (error) => {
  let key = `${error.type} ${error.message}`.trim() || "unknown";

  key = removeUniqueIds(key);
  key = key.substring(0, 200);

  return slug(key);
};
