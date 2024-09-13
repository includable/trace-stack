const { groupSpans } = require("./spans");

const traces = [
  {
    service: "dynamodb",
    ended: 1726249792234,
    spanType: "http",
    started: 1726249792231,
    id: "ba2eec85-d01a-9b91-4a2f-44508e0407cc",
    reporterAwsRequestId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    transactionId: "892eb4c50f4297e58e58bec5",
    parentId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    info: {
      traceId: "1-66e47b3f-892eb4c50f4297e58e58bec5",
      dynamodbMethod: "Query",
      httpInfo: {
        host: "dynamodb.eu-west-1.amazonaws.com",
        request: {
          path: "/",
          protocol: "https:",
          method: "POST",
          port: 443,
          host: "dynamodb.eu-west-1.amazonaws.com",
          truncated: false,
          uri: "dynamodb.eu-west-1.amazonaws.com/",
          sendTime: 1726249792231,
        },
        response: {
          truncated: false,
          statusCode: 200,
          receivedTime: 1726249792234,
        },
      },
      resourceName: "streetartcities-main-production",
    },
  },
  {
    service: "dynamodb",
    ended: 1726249792239,
    spanType: "http",
    started: 1726249792236,
    id: "46d07ca2-adcb-0061-74aa-b9c8ea79196e",
    reporterAwsRequestId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    transactionId: "892eb4c50f4297e58e58bec5",
    parentId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    info: {
      traceId: "1-66e47b3f-892eb4c50f4297e58e58bec5",
      dynamodbMethod: "Query",
      httpInfo: {
        host: "dynamodb.eu-west-1.amazonaws.com",
        request: {
          path: "/",
          protocol: "https:",
          method: "POST",
          port: 443,
          host: "dynamodb.eu-west-1.amazonaws.com",
          truncated: false,
          uri: "dynamodb.eu-west-1.amazonaws.com/",
          sendTime: 1726249792236,
        },
        response: {
          truncated: false,
          statusCode: 200,
          receivedTime: 1726249792239,
        },
      },
      resourceName: "streetartcities-main-production",
    },
  },
  {
    service: "dynamodb",
    ended: 1726249792244,
    spanType: "http",
    started: 1726249792240,
    id: "ed4d0e6e-a004-265f-c6bb-1e9c21e3b3d0",
    reporterAwsRequestId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    transactionId: "892eb4c50f4297e58e58bec5",
    parentId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    info: {
      traceId: "1-66e47b3f-892eb4c50f4297e58e58bec5",
      dynamodbMethod: "Query",
      httpInfo: {
        host: "dynamodb.eu-west-1.amazonaws.com",
        request: {
          path: "/",
          protocol: "https:",
          method: "POST",
          port: 443,
          host: "dynamodb.eu-west-1.amazonaws.com",
          truncated: false,
          uri: "dynamodb.eu-west-1.amazonaws.com/",
          sendTime: 1726249792240,
        },
        response: {
          truncated: false,
          statusCode: 200,
          receivedTime: 1726249792244,
        },
      },
      resourceName: "streetartcities-main-production",
    },
  },
  {
    service: "dynamodb",
    ended: 1726249792249,
    spanType: "http",
    started: 1726249792246,
    id: "97210e79-03dc-2a30-8479-af7db8ba5f15",
    reporterAwsRequestId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    transactionId: "892eb4c50f4297e58e58bec5",
    parentId: "1c065edb-2a94-4a07-9f1b-e31014df95ac",
    info: {
      traceId: "1-66e47b3f-892eb4c50f4297e58e58bec5",
      dynamodbMethod: "GetItem",
      httpInfo: {
        host: "dynamodb.eu-west-1.amazonaws.com",
        request: {
          path: "/",
          protocol: "https:",
          method: "POST",
          port: 443,
          host: "dynamodb.eu-west-1.amazonaws.com",
          truncated: false,
          uri: "dynamodb.eu-west-1.amazonaws.com/",
          sendTime: 1726249792246,
        },
        response: {
          truncated: false,
          statusCode: 200,
          receivedTime: 1726249792249,
        },
      },
      resourceName: "streetartcities-main-production",
    },
  },
];

describe("spans utils", () => {
  it("should group similar traces", async () => {
    const groupedSpans = groupSpans(traces);
    expect(groupedSpans).toHaveLength(2);
  });
});
