import { Hono } from "hono";

import { getExpiryTime, put, update } from "../../lib/database";
import { saveHourlyStat } from "../../lib/stats";
import { getErrorKey } from "../../lib/errors";
import { groupSpans } from "../../lib/spans";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();

  const groupedItems = {};

  for (const span of body) {
    if (process.env.TRACER_TOKEN && span.token !== process.env.TRACER_TOKEN) {
      console.log(`Invalid token: ${span.token}`);
      continue;
    }

    const pk = `transaction#${span.transactionId || span.transaction_id}`;
    if (!groupedItems[pk]) groupedItems[pk] = [];

    if (span.type === "log") {
      // save log span
      groupedItems[pk].push({
        ...span,
        transactionId: span.transactionId || span.transaction_id,
        type: "log",
      });
      continue;
    }

    // ignore started spans and enrichments
    if (span.id.endsWith("_started") || span.type === "enrichment") {
      continue;
    }

    // save transaction span
    groupedItems[pk].push({
      ...span,
      type: "span",
      spanType: span.type,
    });

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
      await saveHourlyStat(span.region, span.name + ".invocations", 1);
      await saveHourlyStat(span.region, span.name + ".duration", duration);
      await saveHourlyStat("global", "invocations", 1);
      if (span.error) {
        await saveHourlyStat(span.region, span.name + ".errors", 1);
        await saveHourlyStat("global", "errors", 1);
      }
    }
  }

  const itemsToSave = [];
  for (let [pk, items] of Object.entries(groupedItems)) {
    items = groupSpans(items);
    while (items.length) {
      const chunk = items.splice(0, 100);
      itemsToSave.push({
        pk,
        sk: `spans#${chunk[0].started || chunk[0].sending_time}#${chunk[0].id}`,
        type: "spans",
        spans: chunk,
      });
    }
  }

  await Promise.all(itemsToSave.map((item) => put(item), true));

  return c.json({ success: true });
});

export default app;
