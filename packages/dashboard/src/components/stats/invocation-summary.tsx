import { format } from "date-fns";
import { ExternalLink, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useData } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InvocationResult from "@/components/stats/invocation-result";

export const MiniInvocationSummary = ({ data, short = false }) => {
  return (
    <dl className="flex md:gap-2 text-sm text-muted-foreground mt-2">
      <InvocationResult error={data.error} />
      {short ? null : (
        <>
          {" "}
          <dt className="hidden md:block">Start time</dt>
          <dd className="hidden md:block mr-4 font-semibold">
            {format(new Date(data.started), "Pp")}
          </dd>
        </>
      )}
      <dt className="hidden md:block">Duration</dt>
      <dd className="mr-4 font-semibold">
        {(data.ended - data.started).toLocaleString()} ms
      </dd>
      {short ? null : (
        <>
          <dt className="hidden md:block">Transaction ID</dt>
          <dd className="hidden md:block mr-4 font-semibold font-mono">
            {data.transactionId}
          </dd>
        </>
      )}
    </dl>
  );
};

const InvocationSummary = ({ data }) => {
  return (
    <div className="flex items-center justify-between flex-wrap">
      <MiniInvocationSummary data={data} />
      <div className="gap-2 hidden md:flex">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={`https://${data.region}.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/${data.name}?tab=monitoring`}
                  target="_blank"
                  title="Open in AWS Console"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in AWS Console</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={`https://${data.region}.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${data.name}/log-events/${encodeURIComponent(data.info.logStreamName).replace(/%/g, "$25")}$3FfilterPattern$3D$2522${data.id}$2522`}
                  target="_blank"
                  title="Open CloudWatch Logs"
                >
                  <ScrollText className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open CloudWatch Logs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default InvocationSummary;
