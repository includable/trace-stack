import { Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import InvocationSummary from "@/components/stats/invocation-summary";
import TransactionDetails from "@/components/stats/transaction-details";
import PayloadPreview from "@/components/stats/payload-preview";
import TransactionGraph from "@/components/stats/transaction-graph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/lib/api";

const Invocations = () => {
  const { region, name, id, ts } = useParams();
  const [requestOnly, setRequestOnly] = useState(true);
  const [currentTab, setCurrentTab] = useState("context");

  const { data: invocation } = useData(
    `functions/${region}/${name}/invocations/${ts}/${id}`,
    { suspense: true },
  );

  return (
    <>
      {/* --- Page header --- */}
      <div className="px-8 py-6 border-b">
        <Button variant="link" className="p-0" asChild>
          <Link to={`/functions/${region}/${name}/invocations`}>← {name}</Link>
        </Button>
        <h1 className="text-2xl font-bold">{id}</h1>
        <InvocationSummary data={invocation} />
      </div>

      <div className="md:flex flex-1 h-full overflow-hidden">
        {/* --- Transaction graph --- */}
        <div className="h-[300px] md:h-full border-b md:border-b-0 md:border-r relative md:w-1/3 overflow-hidden group">
          <Suspense
            fallback={
              <div className="flex w-full items-center justify-center">
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
                setCurrentTab("transaction");

                window.requestAnimationFrame(() => {
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
                });
              }}
            />
          </Suspense>
        </div>

        {/* --- Transaction details --- */}
        <div className="flex-1 md:h-full md:overflow-auto p-6 md:px-10 md:py-8">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="transaction">Transaction</TabsTrigger>
              {/* <TabsTrigger value="logs">Logs</TabsTrigger> */}
            </TabsList>
            <TabsContent value="context">
              <div className="flex w-full flex-col gap-10">
                {invocation.error && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Error</h4>
                    <div className="rounded-md border overflow-auto max-h-[30rem]">
                      <pre className="font-mono text-sm p-4 px-5">
                        <b className="text-red-400">
                          {invocation.error.message}
                        </b>
                        <br />
                        {invocation.error.stacktrace}
                      </pre>
                    </div>
                  </div>
                )}
                <PayloadPreview
                  title="Event payload"
                  value={invocation.event}
                />
                <PayloadPreview
                  title="Return value"
                  value={invocation.return_value}
                />
                <PayloadPreview title="Environment" value={invocation.envs} />
              </div>
            </TabsContent>
            <TabsContent value="transaction">
              <Suspense
                fallback={
                  <>
                    <h4 className="text-sm font-medium mb-3">
                      Transaction details
                    </h4>
                    <div className="flex-1 rounded-md border p-5">
                      Loading...
                    </div>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Invocations;
