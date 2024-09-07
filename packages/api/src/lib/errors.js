import slug from "slug";

const removeUniqueIds = (str) => {
  // uuids
  str = str.replace(/[a-f0-9]([a-f0-9-]{24,34})[a-f0-9]/g, "{id}");

  // unix and epoch timestamps
  str = str.replace(/[0-9]{13}/g, "{timestamp}");
  str = str.replace(/[0-9]{10}/g, "{timestamp}");

  return str;
};

export const getErrorKey = (error) => {
  let key = `${error.type} ${error.message}`.trim() || "unknown";

  key = removeUniqueIds(key);
  key = key.substring(0, 200);

  return slug(key);
};
