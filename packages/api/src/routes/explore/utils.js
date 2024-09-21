import { subDays } from "date-fns";

export const getDates = (c) => {
  const start = new Date(c.req.query("startDate") || subDays(new Date(), 7));
  const end = new Date(c.req.query("endDate") || new Date());
  return [start, end];
};
