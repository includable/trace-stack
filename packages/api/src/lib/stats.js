import { subDays } from "date-fns";
import { getExpiryTime, query, queryAll, update } from "./database";

const getHourIdentifier = (date) =>
  `${date.toISOString().slice(0, 13)}:00:00.000Z`;

export const saveHourlyStat = async (region, name, value) => {
  const hour = getHourIdentifier(new Date());

  await update({
    Key: {
      pk: `hourly-stat#${region}#${name}`,
      sk: hour,
    },
    UpdateExpression:
      "ADD #numerator :value, #denominator :one SET #name = :name, #region = :region, #_expires = :_expires",
    ExpressionAttributeNames: {
      "#numerator": "numerator",
      "#denominator": "denominator",
      "#name": "name",
      "#region": "region",
      "#_expires": "_expires",
    },
    ExpressionAttributeValues: {
      ":value": value,
      ":one": 1,
      ":name": name,
      ":region": region,
      ":_expires": getExpiryTime(),
    },
  });
};

export const getHourlyValues = async (region, name, startDate, endDate) => {
  if (!startDate) {
    startDate = subDays(new Date(), 7);
  }
  if (!endDate) {
    endDate = new Date();
  }

  const items = await queryAll({
    KeyConditionExpression: "pk = :pk AND sk BETWEEN :startDate AND :endDate",
    ExpressionAttributeValues: {
      ":pk": `hourly-stat#${region}#${name}`,
      ":startDate": getHourIdentifier(startDate),
      ":endDate": getHourIdentifier(endDate),
    },
  });

  return items.map((item) => {
    return {
      ...item,
      average: item.denominator ? item.numerator / item.denominator : 0,
      date: new Date(item.sk),
    };
  });
};

export const getHourlySum = async (region, name, startDate, endDate) => {
  const items = await getHourlyValues(region, name, startDate, endDate);
  return items.reduce((sum, item) => sum + item.numerator, 0);
};

export const getHourlyAverage = async (region, name, startDate, endDate) => {
  const items = await getHourlyValues(region, name, startDate, endDate);
  const numerator = items.reduce((sum, item) => sum + item.numerator, 0);
  const denominator = items.reduce((sum, item) => sum + item.denominator, 0);

  if (denominator === 0) return 0;
  return numerator / denominator;
};
