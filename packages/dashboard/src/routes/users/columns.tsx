import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DeleteUser } from "@/components/dialogs/delete-user";

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
      const lastSeen = row.getValue("lastSeen");

      if (!lastSeen) return "Never";
      return format(new Date(row.getValue("lastSeen")), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <DeleteUser id={row.original.name} />
      );
    },
  },
];
