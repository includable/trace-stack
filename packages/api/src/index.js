import fs from "fs";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "@hono/node-server/serve-static";

import collectorRoute from "./routes/collector";
import exploreRoute from "./routes/explore";
import autoTraceRoute from "./routes/auto-trace";
import authRoute from "./routes/auth";
import usersRoute from "./routes/users";

import { autoTrace } from "./events/auto-trace";
import { auth } from "./routes/auth/middleware";

const app = new Hono();
app.use(secureHeaders());

app.route("/api/auth", authRoute);
app.route("/api/spans", collectorRoute);
app.route("/api/auto-trace", autoTraceRoute);

app.use("/api/explore/*", auth);
app.route("/api/explore", exploreRoute);
app.use("/api/users/*", auth);
app.route("/api/users", usersRoute);

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
