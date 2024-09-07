import { Hono } from "hono";

import { getExpiryTime, put, update } from "../../lib/database";
import { saveHourlyStat } from "../../lib/stats";
import { getErrorKey } from "../../lib/errors";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();

  for (const span of body) {
    if (process.env.TRACER_TOKEN && span.token !== process.env.TRACER_TOKEN) {
      console.log(`Invalid token: ${span.token}`);
      continue;
    }

    if (span.type === "log") {
      // save log span
      await put(
        {
          ...span,
          transactionId: span.transactionId || span.transaction_id,
          pk: `transaction#${span.transactionId || span.transaction_id}`,
          sk: `log#${span.started}#${span.id}`,
          type: "log",
        },
        true,
      );
      continue;
    }

    // save transaction span
    await put(
      {
        ...span,
        pk: `transaction#${span.transactionId || span.transaction_id}`,
        sk: `span#${span.started || span.sending_time}#${span.id}`,
        type: "span",
        spanType: span.type,
      },
      true,
    );

    if (
      span.type === "function" &&
      span.ended &&
      !span.id.includes("_started")
    ) {
      // save function invocation details
      await put(
        {
          ...span,
          pk: `function#${span.region}#${span.name}`,
          sk: `invocation#${span.started}#${span.id}`,
          type: "invocation",
        },
        true,
      );

      // save error
      if (span.error) {
        const errorKey = getErrorKey(span.error);
        await update({
          Key: {
            pk: `function#${span.region}#${span.name}`,
            sk: `error#${errorKey}`,
          },
          UpdateExpression: `SET #error = :error, #lastInvocation = :lastInvocation, #lastSeen = :lastSeen, #expires = :expires, #type = :type, #name = :name, #region = :region`,
          ExpressionAttributeValues: {
            ":error": span.error,
            ":lastInvocation": `${span.started}/${span.id}`,
            ":lastSeen": new Date(span.ended).toISOString(),
            ":expires": getExpiryTime(),
            ":type": "error",
            ":name": span.name,
            ":region": span.region,
          },
          ExpressionAttributeNames: {
            "#error": "error",
            "#lastInvocation": "lastInvocation",
            "#lastSeen": "lastSeen",
            "#expires": "_expires",
            "#type": "type",
            "#name": "name",
            "#region": "region",
          },
        });
        await saveHourlyStat(span.region, span.name + ".error." + errorKey, 1);
        await saveHourlyStat(span.region, "error." + errorKey, 1);
      }

      // save function meta data
      try {
        await update({
          Key: {
            pk: `function#${span.region}#${span.name}`,
            sk: `function#${span.region}`,
          },
          UpdateExpression: `SET lastInvocation = :lastInvocation, memoryAllocated = :memoryAllocated, #timeout = :timeout, traceStatus = :traceStatus, #expires = :expires`,
          ExpressionAttributeValues: {
            ":lastInvocation": span.started,
            ":memoryAllocated": span.memoryAllocated,
            ":timeout": span.maxFinishTime - span.started,
            ":traceStatus": "enabled",
            ":expires": getExpiryTime(),
          },
          ExpressionAttributeNames: {
            "#timeout": "timeout",
            "#expires": "_expires",
          },
        });
      } catch (e) {
        console.log(e);
      }

      // save stats
      const duration = span.ended - span.started;
      const memory = span.memoryAllocated;
      await saveHourlyStat(span.region, span.name + ".invocations", 1);
      await saveHourlyStat(span.region, span.name + ".duration", duration);
      await saveHourlyStat(span.region, span.name + ".memory", Number(memory));
      await saveHourlyStat(span.region, "invocations", 1);
      await saveHourlyStat(span.region, "duration", duration);
      await saveHourlyStat("global", "invocations", 1);
      await saveHourlyStat("global", "duration", duration);
      if (span.error) {
        await saveHourlyStat(span.region, span.name + ".errors", 1);
        await saveHourlyStat(span.region, "errors", 1);
        await saveHourlyStat("global", "errors", 1);
      }
    }
  }

  return c.json({ success: true });
});

export default app;
