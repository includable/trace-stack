import { Hono } from "hono";
import { query, queryAll } from "../../lib/database";
import { getHourlyValues } from "../../lib/stats";
import {
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

  const { Items } = await query({
    KeyConditionExpression: "#pk = :pk AND #sk BETWEEN :skStart AND :skEnd",
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
    Limit: 1000,
    ScanIndexForward: false,
  });

  return c.json(Items);
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

  const ticks =
    differenceInDays(start, end) > 7
      ? eachDayOfInterval({ start, end })
      : eachHourOfInterval({ start, end });

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
      average: denominator ? numerator / denominator : 0,
      sum: numerator,
    };
  });

  return c.json(periods);
});

export default app;
