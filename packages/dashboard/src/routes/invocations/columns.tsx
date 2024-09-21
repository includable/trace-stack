"use client";

import InvocationResult from "@/components/stats/invocation-result";
import { Tooltipped } from "@/components/ui/tooltipped";
import { ColumnDef } from "@tanstack/react-table";
import { formatRelative } from "date-fns";
import { SnowflakeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export type InvocationItem = {
  id: string;
  name: string;
  region: string;
  error: any;
  started: number;
  ended: number;
};

export const columns: ColumnDef<InvocationItem>[] = [
  {
    accessorKey: "id",
    header: "Invocation",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      const { region, name, started } = row.original;
      return (
        <Link
          to={`/functions/${region}/${name}/invocations/${started}/${id}`}
          className="text-primary"
        >
          <pre className="font-semibold text-xs block mb-1">{id}</pre>
        </Link>
      );
    },
  },
  {
    accessorKey: "started",
    header: "Start time",
    cell: ({ row }) => {
      return (
        <span>
          {formatRelative(new Date(row.getValue("started")), new Date())}
        </span>
      );
    },
  },
  {
    accessorKey: "error",
    header: "Result",
    cell: ({ row }) => {
      const { error } = row.original;
      return <InvocationResult error={error} />;
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.original.ended - row.original.started;
      return (
        <div className="flex items-center gap-2">
          <span>{duration} ms</span>
          {row.original.readiness === "cold" && (
            <Tooltipped title="Cold start">
              <SnowflakeIcon className="size-3.5 text-blue-400" />
            </Tooltipped>
          )}
        </div>
      );
    },
  },
];
