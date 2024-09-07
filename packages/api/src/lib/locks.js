import { deleteItem, put } from "./database";

export const acquireLock = async (key, ttl = 900) => {
  const lockKey = `lock#${key}`;
  const expires = Math.floor(Date.now() / 1000) + ttl;

  try {
    await put(
      {
        pk: lockKey,
        sk: lockKey,
        _expires: expires,
      },
      false,
      {
        ConditionExpression: "attribute_not_exists(pk) OR #expires < :now",
        ExpressionAttributeNames: {
          "#expires": "_expires",
        },
        ExpressionAttributeValues: {
          ":now": Math.floor(Date.now() / 1000),
        },
      },
    );
    return true;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }
};

export const releaseLock = async (key) => {
  const lockKey = `lock#${key}`;
  try {
    await deleteItem({
      pk: lockKey,
      sk: lockKey,
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
