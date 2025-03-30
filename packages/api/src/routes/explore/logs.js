import { Hono } from "hono";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import { query } from "../../lib/database";
import { get } from "../../lib/storage";

const app = new Hono();
const client = new CloudWatchLogsClient();

const TIMESTAMP_REGEX =
  "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,5})?Z";

app.get("/:region/:name/invocations/:ts/:id", async (c) => {
  const { region, name, ts, id } = c.req.param();
  const date = new Date(Number(ts)).toISOString().split("T")[0];

  const item = await get(`${date}/invocations/${region}/${name}/${ts}/${id}`);
  if (!item) return c.json([]);

  const { info, started, ended, id: requestId } = item;
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
      ?.filter(({ message }) => message?.includes(requestId))
      .map(({ message, timestamp, eventId }) => {
        const regex = new RegExp(`^(${TIMESTAMP_REGEX})\\t${requestId}\\t`);
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
