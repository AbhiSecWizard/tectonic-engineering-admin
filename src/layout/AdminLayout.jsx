
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      navigate("/admin/login", { replace: true });
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-2 text-heading hover:bg-background"
            >
              <FaBars size={20} />
            </button>

            <span className="font-bold text-heading">
              Admin Panel
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-red-600 hover:bg-red-50"
            aria-label="Logout"
          >
            <FaSignOutAlt size={18} />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden items-center justify-between border-b border-border bg-surface px-6 py-4 lg:flex">

          <div>
            <h2 className="font-semibold text-heading">
              Welcome, {admin?.name || "Admin"}
            </h2>

            <p className="text-sm capitalize text-muted">
              {admin?.role || "Administrator"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <FaSignOutAlt />
            Logout
          </button>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
