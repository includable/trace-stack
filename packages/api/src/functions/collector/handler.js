import middleware from "@includable/serverless-middleware";
import { put } from "../../lib/database";

export const app = async ({ body }) => {
  for (const span of body) {
    console.log(span);

    if (span.type === "log") {
      // save log span
      await put(
        {
          ...span,
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

    if (span.type === "function" && span.ended) {
      // save function invocation details
      await put(
        {
          ...span,
          pk: `function#${span.name}`,
          sk: `invocation#${span.started}#${span.id}`,
          type: "invocation",
        },
        true,
      );

      // save function meta data
      await put(
        {
          pk: `function#${span.name}`,
          sk: `function`,
          type: "function",
          lastInvocation: span.started,
          runtime: span.runtime,
          account: span.account,
          region: span.region,
          arn: span.invokedArn,
          memoryAllocation: span.memoryAllocation,
          timeout: span.maxFinishTime - span.started,
        },
        true,
      );
    }
  }
};

export const handler = middleware(app);
