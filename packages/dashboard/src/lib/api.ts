import { useDateRange } from "@/components/layout/date-picker";
import useSWR from "swr";

const BASE_URL = window.location.href.includes("localhost:")
  ? "http://localhost:3000"
  : "";

export const API_URL = `${BASE_URL}/api/explore`;

export const dataLoader =
  (path: string, key: string = path) =>
  async () => {
    return fetch(`${API_URL}/${path}`).then(async (res) => ({
      [key]: await res.json(),
    }));
  };

export const useData = (path: string, swrOptions = {}) => {
  const { startDate, endDate } = useDateRange();

  const fetcher = (path: string) => {
    path += path.includes("?") ? "&" : "?";
    path += `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    return fetch(`${API_URL}/${path}`).then((res) => res.json());
  };

  return useSWR(
    `${path}-${startDate}-${endDate}`,
    () => fetcher(path),
    swrOptions,
  );
};
