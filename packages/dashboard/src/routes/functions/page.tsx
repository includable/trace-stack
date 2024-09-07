import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import { StatsChart } from "@/components/stats/stats-chart";
import { DataTableFilter } from "@/components/tables/data-table-filter";
import { columns } from "./columns";
import { useData } from "@/lib/api";

const Functions = () => {
  const { data: functions } = useData(`functions`, { suspense: true });
  const mappedFunctions = useMemo(() => {
    return functions.map((func) => ({
      ...func,
      lastInvocation: func.lastInvocation || '0',
      tags: Object.entries(func.tags || {})
        .filter(([tag]) => !tag.startsWith("aws:cloudformation:"))
        .filter(([tag]) => !tag.startsWith("lumigo:"))
        .map(([tag, value]) => {
          return `${tag}: ${value}`;
        }),
    })) || [];
  }, [functions]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Functions</h1>
      <p className="prose prose-sm mb-4">
        Functions start appearing after the first traced invocation.
      </p>
      <div className="flex flex-col md:flex-row gap-5 my-5 mb-8">
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Traced invocations"
            name="invocations"
            region="global"
          />
        </div>
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Traced errors"
            name="errors"
            region="global"
            color="var(--chart-2)"
          />
        </div>
      </div>
      <DataTable
        id="functions"
        defaultSorting={[{ id: "name", desc: false }]}
        defaultVisibility={{lastInvocation: false, tags: false}}
        columns={columns}
        data={mappedFunctions}
        paginate
      >
        {(table) => (
          <>
            <DataTableFilter
              column={table.getColumn("tags")}
              title="Tags"
              options={table
                .getColumn("tags")
                ?.columnDef.getUniqueFacetValues(table.getColumn("tags"))}
            />
            <DataTableFilter
              column={table.getColumn("traceStatus")}
              title="Tracing"
            />
          </>
        )}
      </DataTable>
    </div>
  );
};

export default Functions;
