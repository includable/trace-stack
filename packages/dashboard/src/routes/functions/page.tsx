import { useLoaderData } from "react-router-dom";

import { DataTable } from "./data-table";
import { columns } from "./columns";

const Functions = () => {
  const { functions } = useLoaderData() as { functions: any[] };

  return (
    <div>
      <h1 className="text-2xl font-bold">Traced functions</h1>
      <p className="prose prose-sm mb-4">Functions start appearing after the first traced invocation.</p>
      <DataTable columns={columns} data={functions} />
    </div>
  );
};

export default Functions;
