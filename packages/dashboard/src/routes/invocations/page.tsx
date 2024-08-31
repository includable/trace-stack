import { Link, useParams } from "react-router-dom";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatsChart } from "@/components/stats/stats-chart";
import FunctionSummary from "@/components/stats/function-summary";

const Invocations = () => {
  const { region, name } = useParams();
  const { data: invocations } = useData(
    `functions/${region}/${name}/invocations`,
    { suspense: true },
  );

  return (
    <div>
      <Button variant="link" className="p-0" asChild>
        <Link to="/functions">← Functions</Link>
      </Button>
      <h1 className="text-2xl font-bold">{name}</h1>
      <FunctionSummary region={region} name={name} />
      <div className="flex flex-col md:flex-row gap-5 my-5">
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Invocations"
            name={name + ".invocations"}
            region={region}
          />
        </div>
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Errors"
            name={name + ".errors"}
            region={region}
            color="var(--chart-2)"
          />
        </div>
        <div className="rounded-md border flex-1">
          <StatsChart
            title="Average duration"
            name={name + ".duration"}
            metric="average"
            suffix="ms"
            region={region}
            color="var(--chart-3)"
          />
        </div>
      </div>
      <DataTable columns={columns} data={invocations} />
    </div>
  );
};

export default Invocations;
