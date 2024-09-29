import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";

export type UserItem = {
  name: string;
  _created: string;
  lastSeen: string;
};

export const columns: ColumnDef<UserItem>[] = [
  {
    accessorKey: "name",
    header: "Username",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <span className="font-semibold">{name}</span>;
    },
    filterFn: (row, id, value) =>
      row.getValue("name")?.toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "lastSeen",
    header: "Last seen",
    cell: ({ row }) => {
      return format(new Date(row.getValue("lastSeen")), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <Button className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" className="gap-1.5">
            <Trash className="h-4 w-4" />
            Remove
          </Button>
        </div>
      );
    },
  },
];
