"use client";

import { MiniFunctionSummary } from "@/components/stats/function-summary";
import { MiniStatsChart } from "@/components/stats/mini-stats-chart";
import { Badge } from "@/components/ui/badge";
import { Tooltipped } from "@/components/ui/tooltipped";
import { ColumnDef, Table } from "@tanstack/react-table";
import { formatRelative } from "date-fns";
import { CheckCircle2, CirclePause, CircleX } from "lucide-react";
import { Link } from "react-router-dom";

export type FunctionItem = {
  name: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<FunctionItem>[] = [
  {
    accessorKey: "error",
    header: "Error",
    cell: ({ row }) => {
      const error = row.getValue("error");
      return (
        <span>
          <b>{error.type || "Invocation failed"}</b>
          <br />
          {error.message.toString().substring(0, 250)}
        </span>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Function",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <Link
          to={`/functions/${row.original.region}/${name}/invocations`}
          className="block text-primary"
        >
          <span className="font-semibold block">{name}</span>
        </Link>
      );
    },
    filterFn: (row, id, value) =>
      row.getValue("name")?.toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "errors",
    header: "Occurrences",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <div className="lg:mr-10">
          <MiniStatsChart
            title="Occurrences"
            color="var(--chart-2)"
            region={row.original.region}
            name={
              row.original.name +
              "." +
              row.original.sk.replace("error#", "error.")
            }
          />
        </div>
      );
    },
  },
  {
    accessorKey: "lastSeen",
    header: "Last seen",
    cell: ({ row }) => {
      const lastSeen = row.getValue("lastSeen");
      if (!lastSeen) return <span>-</span>;
      return <span>{formatRelative(new Date(lastSeen), new Date())}</span>;
    },
  },
  {
    accessorKey: "lastInvocation",
    header: "Latest trace",
    cell: ({ row }) => {
      return (
        <Link
          to={`/functions/${row.original.region}/${row.original.name}/invocations/${row.original.lastInvocation}`}
          className="block text-primary"
        >
          <span className="text-xs block font-mono">
            {row.original.lastInvocation.split("/").pop()}
          </span>
        </Link>
      );
    },
  },
];
