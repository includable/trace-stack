import { API_URL } from "@/lib/api";
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
  if (
    transaction.info?.httpInfo?.host?.match(/\.s3\.\w+-\w+-\d+\.amazonaws\.com/) || 
    transaction.info?.httpInfo?.host?.match(/\.s3-accelerate\.amazonaws\.com/)
  ) {
    return "s3";
  }

  return transaction.service || transaction.spanType || transaction.type;
};

export const getTransactionLabel = (transaction: any) => {
  if (transaction.info?.resourceName) {
    return transaction.info.resourceName;
  }

  if (transaction.info?.httpInfo?.host) {
    return transaction.info.httpInfo.host;
  }

  return transaction.service || transaction.spanType;
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
  const res = await fetch(`${API_URL}/transactions/${id}`);
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
