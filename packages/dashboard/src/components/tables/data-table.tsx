import { useState } from "react";
import {
  Table,
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getFacetedUniqueValues,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useUserState } from "@/lib/user-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/tables/data-table-view-options";
import { Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  id: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  defaultSorting?: SortingState;
  paginate?: boolean;
  pageSize?: number;
  children?: (table: Table<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  id,
  columns,
  data,
  defaultSorting = [],
  paginate = false,
  pageSize = 20,
  children,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const [columnFilters, setColumnFilters] = useUserState(
    `table/${id}/filters`,
    [],
  );
  const [sorting, setSorting] = useUserState(
    `table/${id}/sorting`,
    defaultSorting,
  );
  const [columnVisibility, setColumnVisibility] = useUserState(
    `table/${id}/visibility`,
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: paginate ? getPaginationRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(paginate ? { pagination } : {}),
    },
  });

  if (!id) throw new Error("No `id` provided for DataTable");

  return (
    <div>
      <div className="flex items-center justify-between py-4 gap-3">
        <div className="flex flex-1 items-center gap-3">
          {table.getColumn("name") && (
            <div className="relative flex">
              <Input
                placeholder="Filter functions..."
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="w-72 h-8 pl-9"
              />
              <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          {children && children(table)}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <div className="rounded-md border">
        <TableRoot>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="text-xs"
                      key={header.id}
                      colSpan={header.colSpan}
                    >
                      <DataTableColumnHeader
                        key={header.id}
                        column={header.column}
                        title={header.column.columnDef.header}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </DataTableColumnHeader>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableRoot>
      </div>

      {paginate && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} (
            {table.getRowCount()} total)
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
