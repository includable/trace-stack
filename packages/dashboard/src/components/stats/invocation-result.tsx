import { useMemo } from "react";
import { CheckCircle2, CircleXIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const InvocationResult = ({ error, returnValue }) => {
  const statusCode = useMemo(() => {
    if (returnValue && typeof returnValue === "string") {
      try {
        returnValue = JSON.parse(returnValue);
      } catch (e) {}
    }
    if (returnValue && returnValue.statusCode) {
      return returnValue.statusCode;
    }
  }, [returnValue]);

  if (!error) {
    return (
      <div className="flex items-center gap-2 text-emerald-500 pr-10">
        <CheckCircle2 className="size-4" />
        Successful
        {statusCode && <Badge variant="outline">{statusCode}</Badge>}
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
