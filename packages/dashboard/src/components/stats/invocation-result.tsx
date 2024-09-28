import { useMemo } from "react";
import { CheckCircle2, CircleXIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tooltipped } from "@/components/ui/tooltipped";

const StatusCodeBadge = ({ statusCode }) => {
  if (statusCode.startsWith("2")) {
    return <Badge variant="success">{statusCode}</Badge>;
  }
  if (statusCode.startsWith("4")) {
    return <Badge variant="warning">{statusCode}</Badge>;
  }
  if (statusCode.startsWith("5")) {
    return <Badge variant="error">{statusCode}</Badge>;
  }

  return <Badge variant="outline">{statusCode}</Badge>;
};

const InvocationResult = ({ error, statusCode = null }) => {
  if (!error) {
    return (
      <div className="flex items-center gap-2 text-emerald-500 pr-10">
        <CheckCircle2 className="size-4" />
        Successful
        {statusCode && (
          <Tooltipped title={`HTTP status code: ${statusCode}`}>
            <StatusCodeBadge statusCode={statusCode} />
          </Tooltipped>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger>
          <div className="flex items-center gap-2 text-red-500 pr-10 max-w-xl truncate">
            <CircleXIcon className="size-4" />
            {error.type || "Invocation failed"}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <pre className="max-w-xl">
            <b>{error.message}</b>
            <br />
            {error.stacktrace}
          </pre>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InvocationResult;
