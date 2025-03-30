const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { FetchHttpHandler } = require("@smithy/fetch-http-handler");

/*
 * This module handles sending spans to an SQS queue.
 * It initializes the SQS client and provides a function to post spans.
 *
 * It is dropped in as a replacement for the original HTTP spans agent:
 * https://github.com/lumigo-io/lumigo-node/blob/master/src/httpSpansAgent.js
 */

exports.HttpSpansAgent = (() => {
  let sqsClient;

  const initAgent = () => {
    try {
      sqsClient = new SQSClient({
        region: process.env.AUTO_TRACE_QUEUE_REGION || "eu-west-1",
        requestHandler: new FetchHttpHandler({}),
      });
    } catch (error) {
      console.warn("Error initializing SQS client:", error);
    }
  };

  const cleanSessionInstance = () => {
    sqsClient = null;
  };

  const postSpans = async (requestBody) => {
    if (!sqsClient) {
      initAgent();
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: process.env.AUTO_TRACE_QUEUE_URL,
        MessageAttributes: {
          __TRACE_TOKEN__: {
            DataType: "String",
            StringValue: process.env.TRACER_TOKEN || "",
          },
        },
        MessageBody: JSON.stringify(requestBody),
      });

      // This is a workaround to avoid the fetch function being overridden
      // @ts-ignore
      if (fetch && fetch.__originalFetch) {
        const wrappedFetch = fetch;
        // @ts-ignore
        fetch = wrappedFetch.__originalFetch;
        setTimeout(() => {
          // @ts-ignore
          fetch = wrappedFetch;
        }, 1);
      }

      await sqsClient.send(command);
    } catch (error) {
      console.warn("Error sending trace spans:", error);
    }
  };

  return { postSpans, cleanSessionInstance, initAgent };
})();
