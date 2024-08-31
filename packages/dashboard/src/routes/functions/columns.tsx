"use client";

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
        <Link to={`/functions/${name}`} className="block text-primary">
          <span className="font-semibold block mb-1">{name}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.region},{" "}
            {row.original.runtime?.replace("AWS_Lambda_", "")}
          </span>
        </Link>
      );
    },
  },
  {
    accessorKey: "timeout",
    header: "Timeout",
    cell: ({ row }) => {
      const timeout = Math.round(row.getValue("timeout") / 1000);
      return <span>{timeout}s</span>;
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
