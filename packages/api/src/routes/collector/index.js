import { Hono } from "hono";
import { put } from "../../lib/database";
import { saveHourlyStat } from "../../lib/stats";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();

  for (const span of body) {
    console.log(span);

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

      // save function meta data
      await put(
        {
          pk: `function#${span.region}#${span.name}`,
          sk: `function#${span.region}`,
          name: span.name,
          type: "function",
          lastInvocation: span.started,
          runtime: span.runtime,
          account: span.account,
          region: span.region,
          arn: span.invokedArn,
          memoryAllocated: span.memoryAllocated,
          timeout: span.maxFinishTime - span.started,
        },
        true,
      );

      // save stats
      const duration = span.ended - span.started;
      const memory = span.memoryAllocated;
      await saveHourlyStat(span.region, span.name + ".invocations", 1);
      await saveHourlyStat(span.region, span.name + ".duration", duration);
      await saveHourlyStat(span.region, span.name + ".memory", Number(memory));
      await saveHourlyStat(span.region, "invocations", 1);
      if (span.error) {
        await saveHourlyStat(span.region, span.name + ".errors", 1);
        await saveHourlyStat(span.region, "errors", 1);
      }
    }
  }

  return c.json({ success: true });
});

export default app;
