import { put } from "./database";

const getStatusCodeFromSpan = (span) => {
  if (!span.return_value) return null;

  // TODO: support Lambda Function URLs
  if (!span.info?.trigger?.some((trigger) => trigger?.triggeredBy === "apigw"))
    return null;

  try {
    if (typeof span.return_value === "object") {
      return span.return_value?.statusCode?.toString() || null;
    }
    if (typeof span.return_value === "string") {
      const returnValue = JSON.parse(
        span.return_value.replace(/\.\.\.\[too long\]$/, ""),
      );
      return returnValue?.statusCode?.toString() || null;
    }
  } catch (e) {}

  return null;
};

const getResultSummaryFromSpan = (span) => {
  let mainStatus = "Successful";
  if (span.error) {
    mainStatus = span.error?.type || "Invocation failed";
  }

  const statusCode = getStatusCodeFromSpan(span);
  if (statusCode) {
    mainStatus += ` (${statusCode})`;
  }

  return mainStatus;
};

export const saveInvocation = async (span) => {
  return put(
    {
      ...span,
      statusCode: getStatusCodeFromSpan(span),
      resultSummary: getResultSummaryFromSpan(span),
      pk: `function#${span.region}#${span.name}`,
      sk: `invocation#${span.started}#${span.id}`,
      type: "invocation",
    },
    true,
  );
};
