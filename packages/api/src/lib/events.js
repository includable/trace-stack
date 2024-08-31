import { EventBridge } from "@aws-sdk/client-eventbridge";

const bridge = new EventBridge();

const createEventEntry = (type, data = {}) => ({
  Source: process.env.SERVICE,
  DetailType: type,
  Detail: JSON.stringify({ data }),
});

export const sendEvent = async (type, data = {}) =>
  bridge.putEvents({ Entries: [createEventEntry(type, data)] });
