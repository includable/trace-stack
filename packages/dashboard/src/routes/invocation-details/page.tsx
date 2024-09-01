import { Link, useParams } from "react-router-dom";

import { useData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import InvocationSummary from "@/components/stats/invocation-summary";
import { Suspense } from "react";
import TransactionDetails from "@/components/stats/transaction-details";
import PayloadPreview from "@/components/stats/payload-preview";
import TransactionGraph from "@/components/stats/transaction-graph";
import { Loader } from "lucide-react";

const Invocations = () => {
  const { region, name, id, ts } = useParams();
  const { data: invocation } = useData(
    `functions/${region}/${name}/invocations/${ts}/${id}`,
    { suspense: true },
  );

  return (
    <div>
      <Button variant="link" className="p-0" asChild>
        <Link to={`/functions/${region}/${name}/invocations`}>← {name}</Link>
      </Button>
      <h1 className="text-2xl font-bold">{id}</h1>
      <InvocationSummary data={invocation} />
      <div className="h-[300px] w-full rounded-md border mt-6 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Loader className="size-5 text-gray-500 animate-spin" />
            </div>
          }
        >
          <TransactionGraph
            id={invocation.transactionId}
            onNodeClick={() => {
              /* TODO */
            }}
          />
        </Suspense>
      </div>
      <div className="flex flex-col lg:flex-row gap-10 my-10">
        <div className="flex-1 md:w-1/2 flex flex-col gap-10">
          {invocation.error && (
            <div>
              <h4 className="text-sm font-medium mb-3">Error</h4>
              <div className="rounded-md border overflow-auto max-h-[30rem]">
                <pre className="font-mono text-sm p-4 px-5">
                  <b className="text-red-400">{invocation.error.message}</b>
                  <br />
                  {invocation.error.stacktrace}
                </pre>
              </div>
            </div>
          )}
          <PayloadPreview title="Event payload" value={invocation.event} />
          <PayloadPreview
            title="Return value"
            value={invocation.return_value}
          />
          <PayloadPreview title="Environment" value={invocation.envs} />
        </div>
        <div className="flex-1 md:w-1/2 flex flex-col">
          <h4 className="text-sm font-medium mb-3">Transaction details</h4>
          <div className="flex-1 rounded-md border">
            <Suspense fallback={<div>Loading...</div>}>
              <TransactionDetails id={invocation.transactionId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invocations;
