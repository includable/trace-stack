import { subDays } from "date-fns";

export const getDates = (c) => {
  const start = new Date(c.req.query("startDate") || subDays(new Date(), 7));
  const end = new Date(c.req.query("endDate") || new Date());
  return [start, end];
};

export const filterByDates = (start, end, items, dateKey) => {
  return items.filter((item) => {
    const date = new Date(item[dateKey]);
    
    const dateTime = date.getTime();
    const startTime = start.getTime();
    const endTime = end.getTime();
    return dateTime >= startTime && dateTime <= endTime;
  });
};
