import { Hono } from "hono";
import { defULID } from "@thi.ng/ksuid";

import { saveHourlyStat } from "../../lib/stats";
import { getErrorKey } from "../../lib/errors";
import { saveInvocation } from "../../lib/invocations";
import { store } from "../../lib/storage";

const app = new Hono();

const id = defULID();
const getId = () => {
  return id.next();
};

// Holds transactions for which we don't know the invocation ID yet
// This is used to avoid sending the transaction to the database before we know the invocation ID
const transactionCache = {};

app.post("/", async (c) => {
  const body = await c.req.json();

  for (const span of body) {
    if (process.env.TRACER_TOKEN && span.token !== process.env.TRACER_TOKEN) {
      console.log(`Invalid token: ${span.token}`);
      continue;
    }

    const groupKey = span.transactionId || span.transaction_id;
    if (!transactionCache[groupKey]) transactionCache[groupKey] = [];

    transactionCache[groupKey].push(span);
  }

  // Check transactions cache to see if there's any transactions we can flush
  for (const [transactionId, spans] of Object.entries(transactionCache)) {
    const invocationEndedSpan = spans.find(
      (span) =>
        span.type === "function" && span.ended && !span.id.includes("_started"),
    );

    if (!invocationEndedSpan) {
      console.log(
        `No invocation ended span found for transaction ${spans[0].transactionId}`,
      );

      // TODO: if we are close to running out of time, we should flush the transaction cache anyway

      continue;
    } else {
      console.log(
        "Flushing transaction cache for",
        invocationEndedSpan.transactionId,
      );
    }

    // save function invocation details
    await saveInvocation(invocationEndedSpan, spans);

    // const duration = invocationEndedSpan.ended - invocationEndedSpan.started;
    await saveHourlyStat(
      invocationEndedSpan.region,
      invocationEndedSpan.name + ".invocations",
      1,
    );
    // await saveHourlyStat(
    //   invocationEndedSpan.region,
    //   invocationEndedSpan.name + ".duration",
    //   duration,
    // );
    await saveHourlyStat("global", "invocations", 1);
    if (invocationEndedSpan.error) {
      await saveHourlyStat(
        invocationEndedSpan.region,
        invocationEndedSpan.name + ".errors",
        1,
      );
      await saveHourlyStat("global", "errors", 1);
    }

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
      await saveHourlyStat(
        invocationEndedSpan.region,
        invocationEndedSpan.name + ".error." + errorKey,
        1,
      );
    }

    // Delete the transaction from the cache
    delete transactionCache[transactionId];
  }

  return c.json({ success: true });
});

export default app;
