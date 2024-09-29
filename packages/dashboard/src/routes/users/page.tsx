import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { useData } from "@/lib/api";

const Users = () => {
  const { data } = useData(`../users`, { suspense: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="prose prose-sm mb-4">
        Manage who has access to the TraceStack dashboard.
      </p>
      <DataTable
        id="users"
        defaultSorting={[{ id: "name", desc: false }]}
        defaultVisibility={{ lastInvocation: false, tags: false }}
        columns={columns}
        data={data}
        paginate
      />
    </div>
  );
};

export default Users;
