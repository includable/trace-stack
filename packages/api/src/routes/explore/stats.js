import { Hono } from "hono";
import {
  addDays,
  addHours,
  differenceInDays,
  eachDayOfInterval,
  eachHourOfInterval,
  isWithinInterval,
} from "date-fns";

import { getHourlyValues } from "../../lib/stats";
import { getDates } from "./utils";

const app = new Hono();

app.get("/:region/:name", async (c) => {
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
    const endDate = useDaily ? addDays(tick, 1) : addHours(tick, 1);
    const items = values.filter((value) =>
      isWithinInterval(new Date(value.date), { start: tick, end: endDate }),
    );

    const numerator = items.reduce((sum, item) => sum + item.numerator, 0);
    const denominator = items.reduce((sum, item) => sum + item.denominator, 0);

    return {
      date: tick,
      startDate: tick,
      endDate,
      duration,
      average: denominator ? numerator / denominator : 0,
      sum: numerator,
    };
  });

  return c.json(periods);
});

export default app;
