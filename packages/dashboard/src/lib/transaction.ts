import { API_URL, authenticatedFetch } from "@/lib/api";
import useSWR from "swr";

export const getGroupingKey = (transaction: any, extended = false) => {
  const items = [
    transaction.spanType,
    transaction.service,
    transaction.info?.resourceName,
    transaction.info?.httpInfo?.host,
    transaction.name,
    transaction.log,
  ];

  if (extended) {
    items.push(transaction.info?.dynamodbMethod);
    items.push(transaction.info?.httpInfo?.request?.path);
    items.push(transaction.info?.httpInfo?.request?.method);
  }

  return items.filter(Boolean).join(",");
};

export const getTransactionService = (transaction: any) => {
  if (transaction.info?.httpInfo?.host === "cloudfront.amazonaws.com") {
    return "cloudfront";
  }
  if (
    transaction.info?.httpInfo?.host?.match(
      /\.s3\.\w+-\w+-\d+\.amazonaws\.com/,
    ) ||
    transaction.info?.httpInfo?.host?.match(/\.s3-accelerate\.amazonaws\.com/)
  ) {
    return "s3";
  }
  if (
    transaction.info?.httpInfo?.host?.match(
      /email\.\w+-\w+-\d+\.amazonaws\.com/,
    )
  ) {
    return "ses";
  }
  if (
    transaction.info?.httpInfo?.host?.match(
      /events\.\w+-\w+-\d+\.amazonaws\.com/,
    )
  ) {
    return "eventBridge";
  }
  if (transaction.info?.httpInfo?.host === "hooks.slack.com" || transaction.info?.httpInfo?.host === "slack.com") {
    return "slack";
  }
  if (transaction.info?.httpInfo?.host?.endsWith('.chargebee.com')) {
    return "chargebee";
  }
  if (transaction.info?.httpInfo?.host?.endsWith('.myshopify.com')) {
    return "shopify";
  }
  if (transaction.info?.httpInfo?.host === 'api.todoist.com') {
    return "todoist";
  }

  return transaction.service || transaction.spanType || transaction.type;
};

export const getTransactionLabel = (transaction: any) => {
  if (transaction.info?.resourceName) {
    return transaction.info.resourceName;
  }

  if (
    transaction.info?.httpInfo?.host?.match(
      /events\.\w+-\w+-\d+\.amazonaws\.com/,
    )
  ) {
    return "EventBridge";
  }

  if (
    transaction.info?.httpInfo?.host?.match(
      /email\.\w+-\w+-\d+\.amazonaws\.com/,
    )
  ) {
    return "SES";
  }

  if (transaction.info?.httpInfo?.host === "cloudfront.amazonaws.com") {
    return "CloudFront";
  }

  if (transaction.info?.httpInfo?.host === "hooks.slack.com" || transaction.info?.httpInfo?.host === "slack.com") {
    return "Slack";
  }
  if (transaction.info?.httpInfo?.host?.endsWith('.chargebee.com')) {
    return "Chargebee";
  }
  if (transaction.info?.httpInfo?.host?.endsWith('.myshopify.com')) {
    return "Shopify";
  }
  if (transaction.info?.httpInfo?.host === 'api.todoist.com') {
    return "Todoist";
  }

  if (
    transaction.info?.httpInfo?.host?.match(/\.s3\.\w+-\w+-\d+\.amazonaws\.com/)
  ) {
    return transaction.info?.httpInfo?.host?.match(
      /([^\.]+)\.s3\.\w+-\w+-\d+\.amazonaws\.com/,
    )[1];
  }

  if (transaction.info?.httpInfo?.host) {
    return transaction.info.httpInfo.host;
  }

  if (transaction.service) {
    if (transaction.service === "s3") return "S3";
    if (transaction.service === "ses") return "SES";
    if (transaction.service === "eventBridge") return "EventBridge";
    if (transaction.service === "dynamodb") return "DynamoDB";
    if (transaction.service === "apigw") return "API Gateway";
    return transaction.service;
  }

  return transaction.spanType === "function" ? "Lambda" : transaction.spanType;
};

export const groupSpans = (spans?: any[]) => {
  const grouped: { groupingKey: any; spans: any[] }[] = [];
  for (const span of spans || []) {
    if (span.id?.endsWith("_started") || span.spanType === "enrichment")
      continue;

    span.groupingKey = getGroupingKey(span, true);
    const group = grouped.find((g) => g.groupingKey === span.groupingKey);
    if (group) {
      group.spans.push(span);
    } else {
      grouped.push({
        groupingKey: span.groupingKey,
        spans: [span],
      });
    }
  }

  return grouped;
};

export const getTransaction = async (id: string) => {
  const res = await authenticatedFetch(`${API_URL}/transactions/${id}`);
  const spans = await res.json();

  let result: any[] = [];
  for (const span of spans) {
    if (span.spans) {
      result = result.concat(span.spans);
    } else {
      result.push(span);
    }
  }

  return {
    spans: result.sort((a, b) => a.started - b.started),
  };
};

export const useTransaction = (id: string, swrOptions = {}) => {
  return useSWR(`transactions/${id}`, () => getTransaction(id), swrOptions);
};
