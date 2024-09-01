import { API_URL } from "@/lib/api";
import useSWR from "swr";

export const getGroupingKey = (transaction) => {
  const items = [
    transaction.spanType,
    transaction.service,
    transaction.info?.resourceName,
    transaction.info?.httpInfo?.host,
  ];

  return items.filter(Boolean).join(",");
};

export const getTransactionLabel = (transaction) => {
  if (transaction.info?.resourceName) {
    return transaction.info.resourceName;
  }

  if (transaction.info?.httpInfo?.host) {
    return transaction.info.httpInfo.host;
  }

  return transaction.service || transaction.spanType;
};

export const getTransaction = async (id) => {
  const res = await fetch(`${API_URL}/transactions/${id}`);
  const spans = await res.json();

  return {
    spans,
  };
};

export const useTransaction = (id, swrOptions = {}) => {
  return useSWR(`transactions/${id}`, () => getTransaction(id), swrOptions);
};
