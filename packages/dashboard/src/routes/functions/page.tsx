import { useLoaderData } from "react-router-dom";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { StatsChart } from "@/components/stats/stats-chart";

const Functions = () => {
  const { functions } = useLoaderData() as { functions: any[] };
  const region = 'eu-west-1' // TODO: get region from context

  return (
    <div>
      <h1 className="text-2xl font-bold">Functions</h1>
      <p className="prose prose-sm mb-4">Functions start appearing after the first traced invocation.</p>
      <div className="flex flex-col md:flex-row gap-5 my-5">
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Traced invocations"
            name={"invocations"}
            region={region}
          />
        </div>
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Traced errors"
            name={"errors"}
            region={region}
            color="hsl(var(--chart-2))"
          />
        </div>
      </div>
      <DataTable columns={columns} data={functions} />
    </div>
  );
};

export default Functions;
