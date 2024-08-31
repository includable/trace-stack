"use client";

import InvocationResult from "@/components/stats/invocation-result";
import { ColumnDef } from "@tanstack/react-table";
import { formatRelative } from "date-fns";
import { Link } from "react-router-dom";

export type FunctionItem = {
  name: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<FunctionItem>[] = [
  {
    accessorKey: "id",
    header: "Invocations",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return (
        <Link to={`/invocations/${id}`} className="text-primary">
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
      return <span>{duration} ms</span>;
    },
  },
];
