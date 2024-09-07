import { DataTable } from "@/components/tables/data-table";
import { StatsChart } from "@/components/stats/stats-chart";

import { columns } from "./columns";
import { useData } from "@/lib/api";
import { DataTableFilter } from "@/components/tables/data-table-filter";

const Functions = () => {
  const { data: functions } = useData(`functions`, { suspense: true });

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
        columns={columns}
        data={functions}
        paginate
      >
        {(table) => {
          console.log(table.getColumn("traceStatus").getFacetedUniqueValues())
          return (
            <>
              <DataTableFilter
                column={table.getColumn("traceStatus")}
                title="Tracing"
              />
            </>
          );
        }}
      </DataTable>
    </div>
  );
};

export default Functions;
