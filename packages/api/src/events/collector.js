import { defULID } from "@thi.ng/ksuid";

import { saveHourlyStat } from "../lib/stats";
import { getErrorKey } from "../lib/errors";
import { saveInvocation } from "../lib/invocations";
import { store } from "../lib/storage";

const id = defULID();
const getId = () => {
  return id.next();
};

// Holds transactions for which we don't know the invocation ID yet
// This is used to avoid sending the transaction to the database before we know the invocation ID
const transactionCache = {};

export const handler = async ({ Records }) => {
  // Read all of the messages off the queue
  for (const record of Records) {
    const body = JSON.parse(JSON.parse(record.body));

    for (const span of body) {
      if (process.env.TRACER_TOKEN && span.token !== process.env.TRACER_TOKEN) {
        console.log(`Invalid token: ${span.token}`);
        continue;
      }

      const groupKey = span.transactionId || span.transaction_id;
      if (!transactionCache[groupKey]) transactionCache[groupKey] = [];

      transactionCache[groupKey].push(span);
    }
  }

  // Check transactions cache to see if there's any transactions we can flush
  const hourlyStats = [];
  for (const [transactionId, spans] of Object.entries(transactionCache)) {
    const invocationEndedSpan = spans.find(
      (span) =>
        span.type === "function" && span.ended && !span.id.includes("_started"),
    );

    if (!invocationEndedSpan) {
      // TODO: if we are close to running out of time, we should flush the transaction cache anyway
      continue;
    }

    // save function invocation details
    await saveInvocation(invocationEndedSpan, spans);

    const duration = invocationEndedSpan.ended - invocationEndedSpan.started;
    hourlyStats.push(["global", "invocations", 1, "sum"]);
    hourlyStats.push([
      invocationEndedSpan.region,
      invocationEndedSpan.name + ".invocations",
      1,
      "sum",
    ]);
    hourlyStats.push([
      invocationEndedSpan.region,
      invocationEndedSpan.name + ".duration",
      duration,
      "avg",
    ]);

    // save error
    if (invocationEndedSpan.error) {
      const errorKey = getErrorKey(invocationEndedSpan.error);
      await store(
        [
          "errors",
          invocationEndedSpan.region,
          invocationEndedSpan.name,
          errorKey,
          getId(),
        ],
        {
          error: invocationEndedSpan.error,
          lastInvocation: `${invocationEndedSpan.started}/${invocationEndedSpan.id}`,
          lastSeen: new Date(invocationEndedSpan.ended).toISOString(),
          type: "error",
          name: invocationEndedSpan.name,
          region: invocationEndedSpan.region,
        },
      );

      hourlyStats.push([
        invocationEndedSpan.region,
        invocationEndedSpan.name + ".errors",
        1,
        "sum",
      ]);

      hourlyStats.push(["global", "errors", 1, "sum"]);
      hourlyStats.push([
        invocationEndedSpan.region,
        invocationEndedSpan.name + ".error." + errorKey,
        1,
        "sum",
      ]);
    }

    // Delete the transaction from the cache
    delete transactionCache[transactionId];
  }

  // Save hourly stats
  const statsToSave = hourlyStats.reduce((acc, [region, name, value, type]) => {
    const key = `${region}#${name}`;
    if (!acc[key]) {
      acc[key] = [region, name, value, 0];
    } else if (type === "sum") {
      acc[key][2] += value;
    } else if (type === "avg") {
      acc[key][2] += value;
      acc[key][3] += 1;
    }
    return acc;
  }, []);
  for (const [region, name, value, count] of statsToSave) {
    await saveHourlyStat({
      region,
      name,
      value: count > 0 ? value / count : value,
    });
  }
};
