import { useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";

import { useData } from "@/lib/api";
import { InstallSlackDialog } from "@/components/integrations/install-slack-dialog";
import { Pencil, Slack, Trash } from "lucide-react";
import { AlertRuleDialog } from "@/components/integrations/alert-rule-dialog";

const Integrations = () => {
  //   const {
  //     data: { errors, nextStartKey },
  //   } = useData(`errors?startKey=${encodeURIComponent(startKey)}`, {
  //     suspense: true,
  //   });

  return (
    <div>
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="prose prose-sm mb-10">
        Set up alerts and notifications for your functions.
      </p>
      <InstallSlackDialog />
      <div className="rounded-md border mt-5 divide-y">
        <div className="flex gap-5 p-6 items-center bg-muted/50">
          <Slack className="size-8" />
          <div className="flex-1">
            <p className="font-semibold">Includable</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Added July 18th, 2023
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Trash className="size-4" />
          </Button>
        </div>
        <div className="p-6 text-sm flex gap-3 items-center justify-between">
            <p className="flex-1">When a new <b>error</b> occurs, send a message to <a href="" className="text-primary font-semibold">#errors</a>.
            </p>
            <Button variant="outline" size="icon">
            <Pencil className="size-4" />
          </Button>
            <Button variant="outline" size="icon">
            <Trash className="size-4" />
          </Button>
        </div>
        <div className="p-6 text-sm flex gap-3 items-center justify-between">
            <AlertRuleDialog />
      </div>
      </div>
    </div>
  );
};

export default Integrations;
