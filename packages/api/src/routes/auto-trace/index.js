import { Hono } from "hono";
import { autoTrace } from "../../events/auto-trace";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();
  if (body.token !== process.env.TRACER_TOKEN) {
    return c.json({ error: "Invalid token" }, 401);
  }

  await autoTrace();

  return c.json({ success: true });
});

export default app;
