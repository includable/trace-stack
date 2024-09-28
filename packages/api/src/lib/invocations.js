import { put } from "./database";

const getStatusCodeFromSpan = (span) => {
  if (!span.return_value) return null;
  try {
    if (typeof span.return_value === "object") {
      return span.return_value?.statusCode?.toString() || null;
    }
    if (typeof span.return_value === "string") {
      const returnValue = JSON.parse(span.return_value);
      return returnValue?.statusCode?.toString() || null;
    }
  } catch (e) {}

  return null;
};

export const saveInvocation = async (span) => {
  await put(
    {
      ...span,
      statusCode: getStatusCodeFromSpan(span),
      pk: `function#${span.region}#${span.name}`,
      sk: `invocation#${span.started}#${span.id}`,
      type: "invocation",
    },
    true,
  );
};