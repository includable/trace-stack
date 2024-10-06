import { useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";

import { columns } from "@/routes/invocations/columns";
import { useData } from "@/lib/api";
import { CheckIcon, XIcon } from "lucide-react";
import { DataTableFilter } from "@/components/tables/data-table-filter";
import { useUserState } from "@/lib/user-state";

export const InvocationsTable = ({ region, name }) => {
  const [startKey, setStartKey] = useState("");
  const [previousKeys, setPreviousKeys] = useState<string[]>([]);
  const [resultSummaryFilters, setResultSummaryFilters] = useUserState(
    `resultSummaryFilters-${region}-${name}`,
    [],
  );

  let url = `functions/${region}/${name}/invocations`;
  url += `?startKey=${encodeURIComponent(startKey)}`;
  if (resultSummaryFilters?.length) {
    url += `&resultSummaryFilters=${encodeURIComponent(resultSummaryFilters.join(","))}`;
  }

  const {
    data: { invocations, nextStartKey },
  } = useData(url, { suspense: true });

  const { data: resultSummaryFilterOptions } = useData(
    `functions/${region}/${name}/invocation-summaries`,
  );

  const goBack = () => {
    setStartKey(previousKeys.pop());
    setPreviousKeys(previousKeys);
  };
  const goNext = () => {
    setPreviousKeys([...previousKeys, startKey]);
    setStartKey(nextStartKey);
  };

  const column = {
    getFilterValue: () => resultSummaryFilters,
    setFilterValue: (value) => {
      setResultSummaryFilters(value);
      setStartKey("");
      setPreviousKeys([]);
    },
  };

  const options = resultSummaryFilterOptions?.map((value) => ({
    value,
    label: value,
    icon: value.startsWith("Successful") ? CheckIcon : XIcon,
  }));

  return (
    <>
      <DataTable
        id="invocations"
        pageSize={50}
        columns={columns}
        data={invocations}
        defaultSorting={[{ id: "started", desc: true }]}
      >
        {() => (
          <DataTableFilter
            column={column}
            title="Invocation status"
            options={options}
          />
        )}
      </DataTable>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {previousKeys.length + 1} ({invocations.length} items)
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
    </>
  );
};
