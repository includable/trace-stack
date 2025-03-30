const getGroupingKey = (span, extended = false) => {
  const items = [
    span.spanType,
    span.service,

    span.info?.resourceName,

    span.log,

    span.info?.httpInfo?.host,
    extended && span.info?.httpInfo?.request?.path,
    span.info?.httpInfo?.request?.method,
    span.info?.httpInfo?.request?.host,
    span.info?.httpInfo?.request?.protocol,
    span.info?.httpInfo?.response?.statusCode,

    span.info?.dynamodbMethod,
  ];

  // TODO: add DynamoDB KeyConditionExpression, TableName, Limit, IndexName, ScanIndexForward, ExclusiveStartKey, FilterExpression, ProjectionExpression

  return items.filter(Boolean).join(",");
};

const addGroupingKeys = (spans) => {
  return spans.map((span) => ({
    ...span,
    groupingKey: getGroupingKey(span),
    extendedGroupingKey: getGroupingKey(span, true),
    instances: 1,
  }));
};

const removeGroupingKeys = (spans) => {
  return spans.map((span) => {
    const { groupingKey, extendedGroupingKey, ...rest } = span;
    return rest;
  });
};

const simplifySpans = (spans) => {
  return spans.map((span) => {
    const {
      token,
      region,
      type,
      transactionId,
      isMetadata,
      messageVersion,
      account,
      invokedArn,
      invokedVersion,
      lumigo_execution_tags_no_scrub,
      ...rest
    } = span;

    return { ...rest };
  });
};

const getTime = (span) => span.started || span.sending_time;

export const groupSpans = (spans) => {
  spans = addGroupingKeys(spans).sort((a, b) => getTime(a) - getTime(b));

  const groupedSpans = [];
  for (const span of spans) {
    const latestSpan = groupedSpans[groupedSpans.length - 1] || {};
    const similarSpans = groupedSpans.filter(
      (s) => s.extendedGroupingKey === span.extendedGroupingKey,
    );

    if (similarSpans.length >= 20) {
      similarSpans[similarSpans.length - 1].instances++;
    } else {
      groupedSpans.push(span);
    }
  }

  return simplifySpans(removeGroupingKeys(groupedSpans));
};
