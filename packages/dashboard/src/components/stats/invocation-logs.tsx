import React from "react";
import { useData } from "@/lib/api";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import PayloadPreview from "@/components/stats/payload-preview";
import { cn } from "@/lib/utils";

const getColor = (logMessage) => {
  if (logMessage.startsWith("START RequestId:")) {
    return "text-muted-foreground";
  }
  if (logMessage.startsWith("END RequestId:")) {
    return "text-muted-foreground";
  }
  if (logMessage.startsWith("REPORT RequestId:")) {
    return "text-muted-foreground";
  }
  if (logMessage.startsWith("INFO\t")) {
    return "text-blue-400";
  }
  if (logMessage.startsWith("WARN\t")) {
    return "text-amber-400";
  }
  if (logMessage.startsWith("ERROR\t")) {
    return "text-red-400";
  }
};

const InvocationLogs = ({ region, name, ts, id }) => {
  const { data } = useData(`logs/${region}/${name}/invocations/${ts}/${id}`, {
    suspense: true,
  });

  return (
    <>
      <h4 className="text-sm font-medium mb-3">CloudWatch logs</h4>
      <div className="flex-1 rounded-md border divide-y border-b">
        {data.map((log) => (
          <details key={log.id} className="transition focus:ring-2">
            <summary className="text-xs flex cursor-pointer p-4">
              <div className="flex-1 w-full cursor-pointer flex items-center gap-2 justify-between">
                <div className="text-muted-foreground">
                  {format(new Date(log.timestamp), "pp")}
                </div>
                <div
                  className={cn(
                    "flex-1 truncate font-mono",
                    getColor(log.message),
                  )}
                >
                  {log.message}
                </div>
                <CaretDownIcon className="size-5 text-muted-foreground flex-shrink-0" />
              </div>
            </summary>
            <PayloadPreview value={log.message} className="border-0" />
          </details>
        ))}
      </div>
    </>
  );

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

export default InvocationLogs;
