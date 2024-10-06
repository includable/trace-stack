import { Hono } from "hono";
import bcrypt from "bcryptjs";

import { deleteItem, put, query, queryAll, update } from "../../lib/database";

const app = new Hono();

const getUser = async (username) => {
  const { Items } = await query({
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: {
      ":pk": `user#${username}`,
    },
  });

  return Items?.[0];
};

const getAllUsers = async () =>
  queryAll({
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":type": "user",
    },
    IndexName: "type-sk",
  });

const getAllAccessTokens = (username) =>
  queryAll({
    KeyConditionExpression: "#type = :type AND #sk = :sk",
    ExpressionAttributeNames: {
      "#type": "type",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":type": "access-token",
      ":sk": `user#${username}`,
    },
    IndexName: "type-sk",
  });

app.get("/", async (c) => {
  const items = await getAllUsers();

  return c.json(
    items.map((item) => ({
      ...item,
      name: item.pk.split("#")[1],
      passwordHash: undefined,
    })),
  );
});

app.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.username) {
    return c.json({ error: "Username is required" }, 400);
  }
  if (!body.password) {
    return c.json({ error: "Password is required" }, 400);
  }
  if (body.password.length < 5) {
    return c.json({ error: "Password must be at least 5 characters" }, 400);
  }

  const existingUser = await getUser(body.username);
  if (existingUser) {
    return c.json({ error: "A user with this username already exists" }, 400);
  }

  await put({
    pk: `user#${body.username}`,
    sk: "user",
    type: "user",
    name: body.username,
    passwordHash: bcrypt.hashSync(body.password),
  });

  return c.json({ ok: true }, 201);
});

app.post("/:userId", async (c) => {
  const body = await c.req.json();

  const existingUser = await getUser(body.username);
  if (!existingUser) {
    return c.json({ error: "User not found" }, 400);
  }

  if (!body.password) {
    return c.json({ error: "Password is required" }, 400);
  }
  if (body.password.length < 5) {
    return c.json({ error: "Password must be at least 5 characters" }, 400);
  }

  await update({
    Key: {
      pk: existingUser.pk,
      sk: existingUser.sk,
    },
    UpdateExpression: "SET #passwordHash = :passwordHash",
    ExpressionAttributeValues: {
      ":passwordHash": bcrypt.hashSync(body.password),
    },
    ExpressionAttributeNames: {
      "#passwordHash": "passwordHash",
    },
  });

  return c.json({ ok: true });
});

app.delete("/:userId", async (c) => {
  const existingUser = await getUser(c.req.param("userId"));
  if (!existingUser) {
    return c.json({ error: "This user does not exist" }, 404);
  }

  const allUsers = await getAllUsers();
  if (allUsers.length < 2) {
    return c.json({ error: "You cannot delete the last user" }, 400);
  }

  // Delete user
  await deleteItem({
    pk: existingUser.pk,
    sk: existingUser.sk,
  });

  // Delete their access tokens
  const accessTokens = await getAllAccessTokens(existingUser.name);
  console.log("accessTokens", accessTokens);

  for (const token of accessTokens) {
    await deleteItem({
      pk: token.pk,
      sk: token.sk,
    });
  }

  return c.json({ ok: true });
});

export default app;
