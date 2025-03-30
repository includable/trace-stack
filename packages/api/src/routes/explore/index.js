import { Hono } from "hono";

import { query, queryAll } from "../../lib/database";
import { get, listAndRead } from "../../lib/storage";
import { filterByDates, getDates } from "./utils";
import { getErrorKey } from "../../lib/errors";

import statsRoute from "./stats";
import logsRoute from "./logs";

const app = new Hono();

app.route("stats", statsRoute);
app.route("logs", logsRoute);

app.get("/functions", async (c) => {
  const items = await queryAll({
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":type": "function",
    },
    IndexName: "type-sk",
  });

  return c.json(items);
});

app.get("/functions/:region", async (c) => {
  const items = await queryAll({
    KeyConditionExpression: "#type = :type AND #sk = :sk",
    ExpressionAttributeNames: {
      "#type": "type",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":type": "function",
      ":sk": `function#${c.req.param("region")}`,
    },
    IndexName: "type-sk",
  });

  return c.json(items);
});

app.get("/functions/:region/:name", async (c) => {
  const { Items } = await query({
    KeyConditionExpression: "#pk = :pk AND #sk = :sk",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":sk": `function#${c.req.param("region")}`,
    },
  });

  return c.json(Items?.[0]);
});

app.get("/functions/:region/:name/invocation-summaries", async (c) => {
  const [start, end] = getDates(c);
  const region = c.req.param("region");
  const name = c.req.param("name");

  const result = await listAndRead(
    start,
    end,
    `invocations/${region}/${name}/`,
  );

  return c.json(
    Array.from(new Set(result.map((item) => item.resultSummary))).filter(
      Boolean,
    ),
  );
});

app.get("/functions/:region/:name/invocations", async (c) => {
  const [start, end] = getDates(c);
  const startKey = Number(c.req.query("startKey") || 0) || 0;
  const region = c.req.param("region");
  const name = c.req.param("name");

  let result = await listAndRead(start, end, `invocations/${region}/${name}/`);
  result = filterByDates(start, end, result, "started");

  const resultSummaryFilters = c.req.query("resultSummaryFilters")?.split(",");

  const output = result
    .map((item) => {
      const { spans, envs, info, event, return_value, ...result } = item; // we don't need the full spans in the response
      return result;
    })
    .filter(
      (item) =>
        !resultSummaryFilters?.length ||
        resultSummaryFilters.includes(item.resultSummary),
    );

  return c.json({
    invocations: output.slice(startKey, startKey + 100),
    nextStartKey: output.length > startKey + 100 ? startKey + 100 : false,
  });
});

app.get("/functions/:region/:name/invocations/:ts/:id", async (c) => {
  const region = c.req.param("region");
  const name = c.req.param("name");
  const ts = c.req.param("ts");
  const id = c.req.param("id");

  const date = new Date(Number(ts)).toISOString().split("T")[0];
  const item = await get(`${date}/invocations/${region}/${name}/${ts}/${id}`);

  return c.json(item);
});

app.get("/errors", async (c) => {
  const [start, end] = getDates(c);
  const startKey = Number(c.req.query("startKey") || 0) || 0;

  let result = await listAndRead(start, end, `errors/`);
  result = filterByDates(start, end, result, "lastSeen");

  const output = Object.values(
    result
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
      .reduce((acc, item) => {
        const id = getErrorKey(item.error);
        if (!acc[id]) acc[id] = { id, occurrences: 0, ...item };
        acc[id].occurrences += 1;
        return acc;
      }, {}),
  );

  return c.json({
    errors: output.slice(startKey, startKey + 100),
    nextStartKey: output.length > startKey + 100 ? startKey + 100 : false,
  });
});

export default app;
