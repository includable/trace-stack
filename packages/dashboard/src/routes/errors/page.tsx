import { useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";

import { useData } from "@/lib/api";
import { columns } from "./columns";

const Errors = () => {
  const [startKey, setStartKey] = useState("");
  const [previousKeys, setPreviousKeys] = useState<string[]>([]);

  const {
    data: { errors, nextStartKey },
  } = useData(`errors?startKey=${encodeURIComponent(startKey)}`, {
    suspense: true,
  });

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
      <h1 className="text-2xl font-bold">Errors</h1>
      <p className="prose prose-sm mb-4">
        Errors are collected from all traced functions.
      </p>
      <DataTable
        id="errors"
        defaultSorting={[{ id: "lastSeen", desc: true }]}
        pageSize={50}
        columns={columns}
        data={errors}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {previousKeys.length + 1} ({errors.length} items)
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

export default Errors;
