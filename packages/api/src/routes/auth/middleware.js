import { bearerAuth } from "hono/bearer-auth";
import { query } from "../../lib/database";

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

    sessionCache.push(token);
    return true;
  },
});
