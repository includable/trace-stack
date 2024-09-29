import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

import { put, query } from "../../lib/database";

const app = new Hono();

app.post("/login", async (c) => {
  const body = await c.req.json();

  const { Items } = await query({
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: {
      ":pk": `user#${body.username}`,
    },
  });

  if (!Items?.length) {
    c.status(401);
    return c.json({ error: { message: "invalid authentication" } });
  }

  const user = Items[0];
  const isValid = bcrypt.compareSync(body.password, user.passwordHash);
  if (!isValid) {
    c.status(401);
    return c.json({ error: { message: "invalid authentication" } });
  }

  const id = `${uuid()}.${new Date().valueOf()}`;

  await put(
    {
      pk: `access-token#${id}`,
      sk: user.pk,
      accessTokenType: "dashboard",
    },
    true,
  );

  return c.json({ accessToken: id });
});

export default app;
