import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

import collector from "./routes/collector";
import explore from "./routes/explore";

const app = new Hono();
app.route("/api/spans", collector);
app.route('/api/explore', explore);

export const handler = handle(app);
