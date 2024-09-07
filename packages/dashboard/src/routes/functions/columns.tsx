"use client";

import { MiniFunctionSummary } from "@/components/stats/function-summary";
import { MiniStatsChart } from "@/components/stats/mini-stats-chart";
import { Tooltipped } from "@/components/ui/tooltipped";
import { ColumnDef } from "@tanstack/react-table";
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
          <MiniFunctionSummary data={row.original} short />
        </Link>
      );
    },
    filterFn: (row, id, value) =>
      row.getValue("name")?.toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "invocations",
    header: "Invocations",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <MiniStatsChart
          title="Invocations"
          region={row.original.region}
          name={row.original.name + ".invocations"}
        />
      );
    },
  },
  {
    accessorKey: "errors",
    header: "Errors",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <div className="lg:mr-10">
          <MiniStatsChart
            title="Traced errors"
            color="var(--chart-2)"
            region={row.original.region}
            name={row.original.name + ".errors"}
          />
        </div>
      );
    },
  },
  {
    accessorKey: "timeout",
    header: "Timeout",
    cell: ({ row }) => {
      const timeout = Math.round(row.getValue("timeout") / 1000);
      return <span>{timeout} s</span>;
    },
  },
  {
    accessorKey: "memoryAllocated",
    header: "Memory allocated",
    cell: ({ row }) => {
      return <span>{row.getValue("memoryAllocated") || "-"} MB</span>;
    },
  },
  {
    accessorKey: "traceStatus",
    header: "Tracing",
    cell: ({ row }) => {
      if (row.getValue("traceStatus") === "enabled") {
        return (
          <Tooltipped title="Tracer installed">
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 size={16} />
              Active
            </div>
          </Tooltipped>
        );
      }

      if (row.getValue("traceStatus") === "error") {
        return (
          <Tooltipped title="Error installing tracer">
            <div className="flex items-center gap-2 text-sm text-red-500">
              <CircleX size={16} />
              Error
            </div>
          </Tooltipped>
        );
      }

      if (row.getValue("traceStatus") === "excluded") {
        return (
          <Tooltipped title={row.getValue("traceStatus")}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CirclePause size={16} />
              Excluded
            </div>
          </Tooltipped>
        );
      }

      return (
        <Tooltipped title={row.getValue("traceStatus")}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CircleX size={16} />
            Inactive
          </div>
        </Tooltipped>
      );
    },
  },
];
