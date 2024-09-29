import { Hono } from "hono";
import { queryAll } from "../../lib/database";

const app = new Hono();

app.get("/", async (c) => {
  const items = await queryAll({
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":type": "user",
    },
    IndexName: "type-sk",
  });

  return c.json(
    items.map((item) => ({
      ...item,
      name: item.pk.split("#")[1],
      passwordHash: undefined,
    })),
  );
});

app.post("/", async (c) => {
  return c.json({ message: "Hello, World!" });
});

app.post("/:userId", async (c) => {
  return c.json({ message: "Hello, World!" });
});

app.delete("/:userId", async (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
