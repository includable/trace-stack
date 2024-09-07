import { formatRelative } from "date-fns";
import { ExternalLink, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useData } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const MiniFunctionSummary = ({ data, short = false }) => {
  return (
    <dl className="flex gap-2 text-sm text-muted-foreground mt-1">
      <dt>Region</dt>
      <dd className="mr-4 font-semibold">{data.region}</dd>
      <dt>Runtime</dt>
      <dd className="mr-4 font-semibold">
        {data.runtime?.replace("AWS_Lambda_", "")}
      </dd>
      {short ? null : (
        <>
          <dt>Memory size</dt>
          <dd className="mr-4 font-semibold">{data.memoryAllocated} MB</dd>
          <dt>Timeout</dt>
          <dd className="mr-4 font-semibold">
            {Math.round(data.timeout / 1000)} s
          </dd>
          {data.lastInvocation && (
            <>
              <dt>Last invocation</dt>
              <dd className="mr-4 font-semibold">
                {formatRelative(new Date(data.lastInvocation), new Date())}
              </dd>
            </>
          )}
        </>
      )}
    </dl>
  );
};

const FunctionSummary = ({
  region,
  name,
}: {
  region?: string;
  name?: string;
}) => {
  const { data } = useData(`functions/${region}/${name}`);

  if (!data) return null;

  return (
    <div className="flex items-center justify-between flex-wrap">
      <MiniFunctionSummary data={data} />
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={`https://${region}.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/${name}?tab=monitoring`}
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
                  href={`https://${region}.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${name}/log-events$3Fstart$3D-60000`}
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

export default FunctionSummary;
