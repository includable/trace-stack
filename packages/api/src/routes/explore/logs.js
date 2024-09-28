import { Hono } from "hono";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import { query } from "../../lib/database";

const app = new Hono();
const client = new CloudWatchLogsClient();

const TIMESTAMP_REGEX =
  "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,5})?Z";

app.get("/:region/:name/invocations/:ts/:id", async (c) => {
  const { Items } = await query({
    KeyConditionExpression: "#pk = :pk AND #sk = :sk",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": `function#${c.req.param("region")}#${c.req.param("name")}`,
      ":sk": `invocation#${c.req.param("ts")}#${c.req.param("id")}`,
    },
  });

  if (!Items?.length) return c.json([]);

  const { info, started, ended, id } = Items?.[0];
  const { logGroupName, logStreamName } = info;

  const command = new GetLogEventsCommand({
    logGroupName,
    logStreamName,
    startFromHead: true,
    startTime: started - 2000,
    endTime: ended + 2000,
    limit: 10000,
  });
  const response = await client.send(command);

  return c.json(
    response.events
      ?.filter(({ message }) => message?.includes(id))
      .map(({ message, timestamp, eventId }) => {
        const regex = new RegExp(`^(${TIMESTAMP_REGEX})\\t${id}\\t`);
        const match = message.match(regex);
        if (match) {
          return {
            id: eventId,
            message: message.replace(match[0], ""),
            timestamp: new Date(match[1]),
          };
        }
        return { id: eventId, message, timestamp: new Date(timestamp) };
      }),
  );
});

export default app;
