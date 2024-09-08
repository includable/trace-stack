import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";

import collector from "./routes/collector";
import explore from "./routes/explore";
import autoTraceRoute from "./routes/auto-trace";
import { autoTrace } from "./events/auto-trace";

const app = new Hono();
app.route("/api/spans", collector);
app.route("/api/explore", explore);
app.route("/api/auto-trace", autoTraceRoute);

let html = "";
app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("/images/*", serveStatic({ root: "./dist" }));
app.use("/icon.svg", serveStatic({ root: "./dist" }));
app.get("/*", async (c) => {
  if (!html) html = fs.readFileSync("./dist/index.html", "utf8");
  return c.html(html);
});

export const httpApp = handle(app);

export const handler = (event, context) => {
  if (event.action === "auto-trace") {
    return autoTrace();
  }

  return httpApp(event, context);
};
