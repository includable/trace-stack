import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isTracerSendSpan = (span: any) => {
  return (
    span.service === "sqs" &&
    span.info?.httpInfo?.request?.body.includes("__TRACE_TOKEN__")
  );
};
