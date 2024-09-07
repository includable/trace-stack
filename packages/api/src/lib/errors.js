import slug from "slug";

const removeUniqueIds = (str) => {
  return str.replace(/[a-f0-9]([a-f0-9-]{24,34})[a-f0-9]/g, "{id}");
};

export const getErrorKey = (error) => {
  let key = `${error.type} ${error.message}`.trim() || "unknown";

  key = removeUniqueIds(key);
  key = key.substring(0, 200);

  return slug(key);
};
