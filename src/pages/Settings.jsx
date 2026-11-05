
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaCalendarAlt,
  FaSignOutAlt,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

const formatDate = (date) => {
  if (!date) return "No login recorded";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Settings = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout from your account?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      setError("");

      const result = await logout();

      if (!result?.success) {
        throw new Error(result?.message || "Logout failed.");
      }

      navigate("/admin/login", {
        replace: true,
      });
    } catch (err) {
      console.error("Logout Error:", err);

      setError(
        err.message || "Unable to logout. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const accountFields = [
    {
      label: "Full Name",
      value: admin?.name || "Not available",
      icon: <FaUser />,
    },
    {
      label: "Email Address",
      value: admin?.email || "Not available",
      icon: <FaEnvelope />,
    },
    {
      label: "Account Role",
      value: admin?.role
        ? admin.role === "superadmin"
          ? "Super Admin"
          : "Staff"
        : "Not available",
      icon: <FaShieldAlt />,
    },
    {
      label: "Account Status",
      value: admin?.status || "Not available",
      icon: <FaCheckCircle />,
    },
    {
      label: "Last Login",
      value: formatDate(admin?.lastLogin),
      icon: <FaCalendarAlt />,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#223F79]">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your account information and security.
        </p>
      </div>

      {/* Account Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">

          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#223F79] text-2xl font-bold uppercase text-white">
            {(admin?.name || "A").charAt(0)}
          </div>

          {/* User Details */}
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {admin?.name || "Admin"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {admin?.email || "Email unavailable"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#223F79]">
                {admin?.role === "superadmin"
                  ? "Super Admin"
                  : "Staff"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  admin?.status === "active"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {admin?.status || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <h3 className="mb-4 font-semibold text-slate-800">
          Account Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">

          {accountFields.map((field) => (
            <div
              key={field.label}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-[#223F79]">
                  {field.icon}
                </span>

                {field.label}
              </div>

              <p className="break-words text-sm font-semibold text-slate-800">
                {field.value}
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-lg text-[#223F79]">
            <FaLock />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Security & Session
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your account authentication and session information.
            </p>
          </div>
        </div>

        {/* Security Information */}
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">

          <div className="flex items-start gap-3">
            <FaShieldAlt className="mt-1 shrink-0 text-[#223F79]" />

            <div>
              <p className="text-sm font-semibold text-[#223F79]">
                HTTP-only Cookie Authentication
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-600">
                Your authentication token is stored in a secure
                HTTP-only cookie. JavaScript cannot directly
                access this cookie. Authenticated API requests
                include credentials automatically when configured.
              </p>
            </div>
          </div>
        </div>

        {/* Logout Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-6 border-t border-slate-100 pt-5">

          <h3 className="font-semibold text-slate-800">
            Sign Out
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            End your current admin session on this browser.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSignOutAlt />

            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
