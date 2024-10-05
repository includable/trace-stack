import { ColumnDef } from "@tanstack/react-table";
import { TrashIcon } from "lucide-react";
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
      return <span className="font-semibold text-primary">{name}</span>;
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
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            <TrashIcon className="size-4 mr-2" />
            Remove
          </Button>
        </div>
      );
    },
  },
];
