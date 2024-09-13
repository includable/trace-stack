const getGroupingKey = (span) => {
  const items = [
    span.spanType,
    span.service,

    span.info?.resourceName,

    span.log,

    span.info?.httpInfo?.host,
    span.info?.httpInfo?.request?.path,
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
    instances: 1,
  }));
};

const removeGroupingKeys = (spans) => {
  return spans.map((span) => {
    const { groupingKey, ...rest } = span;
    return rest;
  });
};

const getTime = (span) => span.started || span.sending_time;

const groupSpans = (spans) => {
  spans = addGroupingKeys(spans).sort((a, b) => getTime(a) - getTime(b));

  const groupedSpans = [];
  for (const span of spans) {
    const latestSpan = groupedSpans[groupSpans.length - 1] || {};
    if (span.groupingKey === latestSpan.groupingKey) {
      latestSpan.instances++;
    } else {
      groupedSpans.push(span);
    }
  }

  return removeGroupingKeys(groupedSpans);
};
