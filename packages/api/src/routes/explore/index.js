import { Hono } from "hono";

import { query, queryAll } from "../../lib/database";
import { getDates } from "./utils";

import statsRoute from "./stats";

const app = new Hono();

app.route("stats", statsRoute);

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

app.get("/functions/:region/:name/invocations", async (c) => {
  const [start, end] = getDates(c);
  const startTs = start.getTime();
  const endTs = end.getTime();

  const startKey = c.req.query("startKey");
  const { Items, LastEvaluatedKey } = await query({
    KeyConditionExpression: "#pk = :pk AND #sk BETWEEN :skStart AND :skEnd",
    ExclusiveStartKey: startKey ? JSON.parse(startKey) : undefined,
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
      "#type": "type",
      "#error": "error",
      "#id": "id",
      "#region": "region",
      "#name": "name",
      "#statusCode": "statusCode",
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":skStart": `invocation#${startTs}`,
      ":skEnd": `invocation#${endTs}`,
    },
    ProjectionExpression:
      "#pk, #sk, #type, #error, #id, #region, #name, #statusCode, transactionId, started, ended, readiness, memoryAllocated",
    Limit: 50,
    ScanIndexForward: false,
  });

  return c.json({
    invocations: Items,
    nextStartKey: LastEvaluatedKey ? JSON.stringify(LastEvaluatedKey) : false,
  });
});

app.get("/functions/:region/:name/invocations/:ts/:id", async (c) => {
  const { Items } = await query({
    KeyConditionExpression: "#pk = :pk AND #sk = :sk",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":sk": `invocation#${c.req.param("ts")}#${c.req.param("id")}`,
    },
  });

  return c.json(Items?.[0]);
});

app.get("/errors", async (c) => {
  const [start, end] = getDates(c);
  const startTs = start.toISOString();
  const endTs = end.toISOString();

  const startKey = c.req.query("startKey");

  const { Items, LastEvaluatedKey } = await query({
    KeyConditionExpression:
      "#type = :type AND #lastSeen BETWEEN :skStart AND :skEnd",
    ExclusiveStartKey: startKey ? JSON.parse(startKey) : undefined,
    ExpressionAttributeNames: {
      "#type": "type",
      "#lastSeen": "lastSeen",
    },
    ExpressionAttributeValues: {
      ":type": "error",
      ":skStart": startTs,
      ":skEnd": endTs,
    },
    IndexName: "type-lastSeen",
    Limit: 50,
    ScanIndexForward: false,
  });

  return c.json({
    errors: Items,
    nextStartKey: LastEvaluatedKey ? JSON.stringify(LastEvaluatedKey) : false,
  });
});

app.get("/transactions/:id", async (c) => {
  const items = await queryAll({
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": `transaction#${c.req.param("id")}`,
    },
  });

  return c.json(items);
});

export default app;
