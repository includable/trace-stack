import { useMemo } from "react";
import { CaretDownIcon } from "@radix-ui/react-icons";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

import PayloadPreview from "@/components/stats/payload-preview";
import {
  getTransactionService,
  groupSpans,
  useTransaction,
} from "@/lib/transaction";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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

  if (transaction.info?.trigger?.[0]) {
    return (
      <>
        Function <code>{transaction.name}</code> executed triggered by{" "}
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
  if (span.info?.trigger) {
    return (
      <>
        <PayloadPreview
          title="Trigger"
          value={
            span.info.trigger?.length > 1
              ? span.info.trigger
              : span.info.trigger[0]
          }
        />
        {span.error && (
          <div>
            <h4 className="text-sm font-medium mb-3 mt-4">Error</h4>
            <div className="rounded-md border overflow-auto max-h-[30rem]">
              <pre className="font-mono text-sm p-4 px-5">
                <b className="text-red-400">{span.error.message}</b>
                <br />
                {span.error.stacktrace}
              </pre>
            </div>
          </div>
        )}
      </>
    );
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
  const count = spans?.reduce((acc, span) => acc + (span.instances || 1), 0);

  return (
    <details
      id={transaction.id}
      key={`${transaction.id}${transaction.started}`}
      className="transition focus:ring-2"
    >
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
            {count > 1 ? `(${count}) ` : ""}
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

const TransactionDetails = ({ id, requestId, requestOnly, setRequestOnly }) => {
  const { data } = useTransaction(id, { suspense: true });

  const grouped = useMemo(() => {
    let spans = data?.spans;
    if (requestOnly) {
      spans = spans.filter(
        (span) =>
          span.reporterAwsRequestId === requestId || span.id === requestId,
      );
    }

    return groupSpans(spans);
  }, [data, requestOnly]);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium">Transaction details</h4>
        <div className="flex items-center space-x-1.5">
          <Switch
            id="request-only"
            checked={requestOnly}
            onCheckedChange={() => setRequestOnly((r) => !r)}
          />
          <Label
            htmlFor="request-only"
            className="text-xs text-muted-foreground"
          >
            Filter current invocation
          </Label>
        </div>
      </div>

      <div className="flex-1 rounded-md border divide-y border-b">
        {grouped.map((group) => {
          return <SpanItem key={group.groupingKey} spans={group.spans} />;
        })}
      </div>
    </>
  );
};

export default TransactionDetails;
