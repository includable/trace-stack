import { bearerAuth } from "hono/bearer-auth";
import { query, update } from "../../lib/database";

const sessionCache = [];

export const auth = bearerAuth({
  async verifyToken(token) {
    if (sessionCache.includes(token)) {
      return true;
    }

    const { Items } = await query({
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `access-token#${token}`,
      },
    });

    if (!Items?.length) {
      return false;
    }

    await update({
      Key: {
        pk: Items[0].sk,
        sk: "user",
      },
      UpdateExpression: `SET #lastSeen = :lastSeen`,
      ExpressionAttributeValues: {
        ":lastSeen": new Date().toISOString(),
      },
      ExpressionAttributeNames: {
        "#lastSeen": "lastSeen",
      },
    });

    sessionCache.push(token);
    return true;
  },
});
