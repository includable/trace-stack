import { Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import InvocationSummary from "@/components/stats/invocation-summary";
import TransactionDetails from "@/components/stats/transaction-details";
import PayloadPreview from "@/components/stats/payload-preview";
import TransactionGraph from "@/components/stats/transaction-graph";
import { useData } from "@/lib/api";

const Invocations = () => {
  const { region, name, id, ts } = useParams();
  const [requestOnly, setRequestOnly] = useState(true);
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
            requestId={id}
            requestOnly={requestOnly}
            setRequestOnly={setRequestOnly}
            onNodeClick={(e, { data }) => {
              document
                .querySelectorAll("details[open]")
                .forEach((el) => el.removeAttribute("open"));

              const item = document.getElementById(data.id);
              if (!item) return;

              item.setAttribute("open", "true");
              item.scrollIntoView({ behavior: "smooth" });
              item.focus();

              item.classList?.add("bg-muted");
              setTimeout(() => item.classList?.remove("bg-muted"), 1000);
            }}
          />
        </Suspense>
      </div>
      <div className="grid lg:grid-cols-3 gap-10 my-10">
        <div className="flex flex-col gap-10">
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
        <div className="col-span-2 flex flex-col">
          <Suspense
            fallback={
              <>
                <h4 className="text-sm font-medium mb-3">
                  Transaction details
                </h4>
                <div className="flex-1 rounded-md border p-5">Loading...</div>
              </>
            }
          >
            <TransactionDetails
              id={invocation.transactionId}
              requestId={id}
              requestOnly={requestOnly}
              setRequestOnly={setRequestOnly}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Invocations;
