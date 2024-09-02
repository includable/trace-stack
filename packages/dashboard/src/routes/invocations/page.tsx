import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { StatsChart } from "@/components/stats/stats-chart";
import FunctionSummary from "@/components/stats/function-summary";
import { columns } from "./columns";
import { useData } from "@/lib/api";
import { useState } from "react";

const Invocations = () => {
  const { region, name } = useParams();
  const [startKey, setStartKey] = useState("");
  const [previousKeys, setPreviousKeys] = useState<string[]>([]);

  const {
    data: { invocations, nextStartKey },
  } = useData(
    `functions/${region}/${name}/invocations?startKey=${encodeURIComponent(startKey)}`,
    {
      suspense: true,
    },
  );

  const goBack = () => {
    setStartKey(previousKeys.pop());
    setPreviousKeys(previousKeys);
  };
  const goNext = () => {
    setPreviousKeys([...previousKeys, startKey]);
    setStartKey(nextStartKey);
  };

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
      <DataTable
        id="invocations"
        pageSize={50}
        columns={columns}
        data={invocations}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {previousKeys.length + 1} ({invocations.length} invocations)
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goBack()}
            disabled={!previousKeys.length}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goNext()}
            disabled={!nextStartKey}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Invocations;
