"use client";

import { MiniFunctionSummary } from "@/components/stats/function-summary";
import { MiniStatsChart } from "@/components/stats/mini-stats-chart";
import { ColumnDef } from "@tanstack/react-table";
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
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <Link
          to={`/functions/${row.original.region}/${name}/invocations`}
          className="block text-primary"
        >
          <span className="font-semibold block mb-1">{name}</span>
          <MiniFunctionSummary data={row.original} short />
        </Link>
      );
    },
  },
  {
    accessorKey: "invocations",
    header: "Invocations",
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
    cell: ({ row }) => {
      return (
        <MiniStatsChart
        title="Traced errors"
        color="var(--chart-2)"
        region={row.original.region}
        name={row.original.name + ".errors"}
        />
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
];
