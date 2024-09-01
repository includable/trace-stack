import { useData } from "@/lib/api";

const TransactionDetails = ({ id }) => {
  const { data } = useData(`transactions/${id}`, { suspense: true });

  return (
    <div className="divide-y border-b">
      {data
        .sort((a, b) => a.started - b.started)
        .map((transaction) => {
          if (
            transaction.id?.endsWith("_started") ||
            transaction.spanType === "enrichment"
          )
            return null;

          return (
            <details key={`${transaction.id}${transaction.started}`}>
              <summary className="p-4 text-sm">
                {transaction.spanType || transaction.type} {transaction.id}
              </summary>
              <pre>{JSON.stringify(transaction, null, 2)}</pre>
            </details>
          );
        })}
    </div>
  );
};

export default TransactionDetails;
