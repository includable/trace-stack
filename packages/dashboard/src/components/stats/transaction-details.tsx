import { useMemo } from "react";
import { CaretDownIcon } from "@radix-ui/react-icons";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PayloadPreview from "@/components/stats/payload-preview";
import {
  getTransactionService,
  groupSpans,
  useTransaction,
} from "@/lib/transaction";
import { cn } from "@/lib/utils";

const TransactionTitle = ({ transaction }) => {
  if (transaction.info?.dynamodbMethod) {
    const rowsReturned =
      transaction.info.httpInfo?.response?.body?.match(/Count":(\d+),/);
    return (
      <>
        {transaction.info.dynamodbMethod}{" "}
        <code>{transaction.info.resourceName}</code>
        {rowsReturned && (
          <span className="text-muted-foreground">
            {" – "}
            {rowsReturned[1]} item returned
          </span>
        )}
      </>
    );
  }
  if (transaction.spanType === "http" && transaction.info?.httpInfo?.request) {
    const statusCode = transaction.info.httpInfo.response?.statusCode;
    return (
      <>
        {transaction.info.httpInfo.request.method}{" "}
        <code>
          {transaction.info.httpInfo.request.protocol}//
          {transaction.info.httpInfo.request.host}
          {transaction.info.httpInfo.request.path}
        </code>
        {statusCode && (
          <span className="text-muted-foreground">
            {" – "}
            status {statusCode}
          </span>
        )}
      </>
    );
  }

  if (transaction.type === "log" && transaction.log) {
    const log = JSON.parse(transaction.log);
    let firstLog = log?.[0];
    if (typeof firstLog === "object") {
      firstLog = JSON.stringify(firstLog);
    }

    const classes = cn(
      transaction.logType === "warn" && "text-amber-500",
      transaction.logType === "error" && "text-red-500",
      transaction.logType === "info" && "text-blue-500",
    );

    return (
      <code className={classes}>
        {firstLog.substring(0, 100)?.replace(/\n/g, " ")}
      </code>
    );
  }

  if (transaction.info?.trigger?.[0]) {
    return (
      <>
        Function executed triggered by{" "}
        <code>{transaction.info.trigger[0].triggeredBy}</code>
      </>
    );
  }

  return (
    <>
      {transaction.spanType || transaction.type} {transaction.id}
    </>
  );
};

const ServiceIcon = ({ transaction }) => {
  const service = getTransactionService(transaction);
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger>
          <div
            className="size-4 rounded-sm bg-gray-400 bg-cover bg-center"
            title={service}
            style={{
              backgroundImage: `url(/images/service-icons-mini/${service}.svg)`,
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{service}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const SpanDetails = ({ span }) => {
  if (span.info?.trigger?.length > 1) {
    return <PayloadPreview value={span.info.trigger} />;
  }
  if (span.info?.trigger?.[0]) {
    return <PayloadPreview value={span.info.trigger[0]} />;
  }

  if (span.type === "log") {
    let log = JSON.parse(span.log);
    if (
      typeof log === "object" &&
      Object.keys(log).length === 1 &&
      "0" in log
    ) {
      log = log[0];
      if (typeof log === "string") {
        try {
          log = JSON.parse(log);
        } catch (e) {}
      }
    }

    return <PayloadPreview value={log} />;
  }

  if (span.info?.dynamodbMethod) {
    return (
      <div className="flex flex-col gap-4">
        <PayloadPreview
          title="Request"
          value={span.info.httpInfo.request.body}
        />
        <PayloadPreview
          title="Response"
          value={span.info.httpInfo.response.body}
        />
      </div>
    );
  }

  if (span.spanType === "http" && span.info?.httpInfo) {
    return (
      <div className="flex flex-col gap-4">
        <PayloadPreview title="Request" value={span.info.httpInfo.request} />
        <PayloadPreview title="Response" value={span.info.httpInfo.response} />
      </div>
    );
  }

  return <PayloadPreview value={span} />;
};

const SpanItem = ({ spans, nested = false }) => {
  const transaction = spans[0];
  const { duration } = useMemo(
    () =>
      spans.reduce(
        (acc, span) => {
          if (span.started && acc.started > span.started) {
            acc.started = span.started;
          }
          if (span.ended && acc.ended < span.ended) {
            acc.ended = span.ended;
          }
          if (acc.started !== Infinity && acc.ended !== 0) {
            acc.duration = acc.ended - acc.started;
          }
          return acc;
        },
        { started: Infinity, ended: 0, duration: null },
      ),
    [spans],
  );

  const hasDuration = duration !== null && transaction.spanType !== "function";

  return (
    <details key={`${transaction.id}${transaction.started}`}>
      <summary
        className={cn(
          "text-sm flex items-center justify-between gap-2 cursor-pointer",
          nested ? "p-2" : "p-4",
        )}
      >
        <div
          className={cn(
            "flex flex-1 items-center gap-2",
            hasDuration ? "max-w-[90%]" : "max-w-[95%]",
          )}
        >
          <ServiceIcon transaction={transaction} />
          <span className="block flex-1 truncate w-full">
            {spans.length > 1 ? `(${spans.length}) ` : ""}
            <TransactionTitle transaction={transaction} />
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          {hasDuration ? <span>{duration.toLocaleString()}ms</span> : null}
          <CaretDownIcon className="size-5 text-muted-foreground flex-shrink-0" />
        </div>
      </summary>

      <div className={cn(nested ? "p-8 pb-4" : "p-4", "pt-0")}>
        {spans.length > 1 ? (
          <div className="divide-y border rounded-md">
            {spans.map((span) => (
              <SpanItem key={span.id} nested spans={[span]} />
            ))}
          </div>
        ) : (
          <SpanDetails span={transaction} />
        )}
      </div>
    </details>
  );
};

const TransactionDetails = ({ id }) => {
  const {
    data: { spans },
  } = useTransaction(id, { suspense: true });
  const grouped = useMemo(() => groupSpans(spans), [spans]);

  return (
    <div className="divide-y border-b">
      {grouped.map((group) => {
        return <SpanItem key={group.groupingKey} spans={group.spans} />;
      })}
    </div>
  );
};

export default TransactionDetails;
