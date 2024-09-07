import { Hono } from "hono";
import { query, queryAll } from "../../lib/database";
import { getHourlyValues } from "../../lib/stats";
import {
  addDays,
  addHours,
  differenceInDays,
  eachDayOfInterval,
  eachHourOfInterval,
  subDays,
} from "date-fns";

const app = new Hono();

const getDates = (c) => {
  const start = new Date(c.req.query("startDate") || subDays(new Date(), 7));
  const end = new Date(c.req.query("endDate") || new Date());
  return [start, end];
};

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
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":skStart": `invocation#${startTs}`,
      ":skEnd": `invocation#${endTs}`,
    },
    ProjectionExpression:
      "#pk, #sk, #type, #error, #id, #region, #name, transactionId, started, ended, memoryAllocated",
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

app.get("/stats/:region/:name", async (c) => {
  const [start, end] = getDates(c);

  const useDaily = differenceInDays(end, start) > 3;
  const ticks = useDaily
    ? eachDayOfInterval({ start, end })
    : eachHourOfInterval({ start, end });

  const duration = useDaily ? "1d" : "1h";

  const values = await getHourlyValues(
    c.req.param("region"),
    c.req.param("name"),
  );

  const periods = ticks.map((tick) => {
    const items = values.filter(
      (value) => value.date.getTime() === tick.getTime(),
    );
    const numerator = items.reduce((sum, item) => sum + item.numerator, 0);
    const denominator = items.reduce((sum, item) => sum + item.denominator, 0);

    return {
      date: tick,
      startDate: tick,
      endDate: useDaily ? addDays(tick, 1) : addHours(tick, 1),
      duration,
      average: denominator ? numerator / denominator : 0,
      sum: numerator,
    };
  });

  return c.json(periods);
});

export default app;
