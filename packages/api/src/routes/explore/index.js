import { Hono } from "hono";
import { put, query, queryAll } from "../../lib/database";
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

app.get("/functions/:region/:name/invocations", async (c) => {
  const [start, end] = getDates(c);
  const startTs = start.getTime();
  const endTs = end.getTime();

  const items = await queryAll({
    KeyConditionExpression: "#pk = :pk AND #sk BETWEEN :skStart AND :skEnd",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":skStart": `invocation#${startTs}`,
      ":skEnd": `invocation#${endTs}`,
    },
    IndexName: "type-sk",
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
