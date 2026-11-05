import { FaShieldAlt, FaLock, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const modules = ["projects", "blogs", "clients", "gallery", "team"];
const actions = ["create", "read", "update", "delete"];

const RolesPermissions = () => {
  const { admin } = useAuth();

  const isSuperAdmin = admin?.role === "superadmin";

  const roleDescriptions = [
    {
      role: "superadmin",
      title: "Super Admin",
      description: "Full administrative access to the admin panel.",
      permissions: "All modules and administrative operations",
    },
    {
      role: "staff",
      title: "Staff",
      description: "Access is controlled by permissions assigned by the superadmin.",
      permissions: "Only explicitly allowed module actions",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#223F79]">
          Roles & Permissions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Understand the access levels and permissions available in your admin panel.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <FaLock className="mr-2 inline" />
          This page is intended for superadmin users. You can view this reference,
          but permission management is restricted.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {roleDescriptions.map((item) => (
          <div key={item.role} className="rounded border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-[#223F79]">
                <FaShieldAlt />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{item.title}</h2>
                <span className="text-xs capitalize text-slate-500">{item.role}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600">{item.description}</p>
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Access
              </p>
              <p className="mt-1 text-sm text-slate-700">{item.permissions}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-slate-800">Permission Matrix</h2>
          <p className="mt-1 text-sm text-slate-500">
            These are the modules and actions currently supported by your backend.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Module</th>
                {actions.map((action) => (
                  <th key={action} className="p-3 capitalize">{action}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {modules.map((module) => (
                <tr key={module} className="border-t">
                  <td className="p-3 font-medium capitalize">{module}</td>
                  {actions.map((action) => (
                    <td key={action} className="p-3 text-center">
                      <FaCheckCircle className="mx-auto text-green-600" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          The matrix lists supported permission types, not permissions granted
          to every staff member. Actual access depends on each staff account.
        </p>
      </div>

      <div className="rounded border border-blue-100 bg-blue-50 p-4">
        <h3 className="font-semibold text-[#223F79]">How to assign permissions</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
          <li>Open Staff Management.</li>
          <li>Create a new staff account or edit an existing one.</li>
          <li>Select the required module permissions.</li>
          <li>Save the staff account.</li>
        </ol>
      </div>
    </div>
  );
};

export default RolesPermissions;