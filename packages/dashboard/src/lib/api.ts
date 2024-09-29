import { useDateRange } from "@/components/layout/date-picker";
import useSWR from "swr";

const BASE_URL = window.location.href.includes("localhost:")
  ? "http://localhost:3000"
  : "";

export const API_URL = `${BASE_URL}/api/explore`;
export const API_AUTH_URL = `${BASE_URL}/api/auth/login`;

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if(res.status === 401) {
    localStorage.removeItem("token");
    throw new Error("Unauthorized");
  }

  return res;
};

export const dataLoader =
  (path: string, key: string = path) =>
  async () => {
    return authenticatedFetch(`${API_URL}/${path}`).then(async (res) => ({
      [key]: await res.json(),
    }));
  };

export const useData = (path: string, swrOptions = {}) => {
  const { startDate, endDate } = useDateRange();

  const fetcher = (path: string) => {
    path += path.includes("?") ? "&" : "?";
    path += `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    return authenticatedFetch(`${API_URL}/${path}`).then((res) => res.json());
  };

  return useSWR(
    `${path}-${startDate}-${endDate}`,
    () => fetcher(path),
    swrOptions,
  );
};
