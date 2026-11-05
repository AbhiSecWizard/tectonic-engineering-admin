
import { useCallback, useEffect, useState } from "react";

import {
  FaHistory,
  FaInfoCircle,
  FaClock,
  FaSyncAlt,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaCalendarAlt,
  FaUserShield,
} from "react-icons/fa";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const MODULES = [
  "projects",
  "blogs",
  "clients",
  "gallery",
  "team",
  "users",
  "auth",
];

const ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
  "login",
  "logout",
];

const actionColors = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  status_change: "bg-amber-100 text-amber-700",
  login: "bg-purple-100 text-purple-700",
  logout: "bg-slate-100 text-slate-700",
};

const formatLabel = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);

  const [stats, setStats] = useState({
    totalActivities: 0,
    recentActivities: 0,
    todayActivities: 0,
  });

  const [pagination, setPagination] = useState({
    totalLogs: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
  });

  const [filters, setFilters] = useState({
    module: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // API request helper
  const apiRequest = async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Unable to fetch data.");
    }

    return result;
  };

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    const result = await apiRequest(
      "/api/admin/activity-logs/stats"
    );

    setStats({
      totalActivities: result.stats?.totalActivities || 0,
      recentActivities: result.stats?.recentActivities || 0,
      todayActivities: result.stats?.todayActivities || 0,
    });
  }, []);

  // Fetch activity logs
  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "20");

    if (filters.module) {
      params.set("module", filters.module);
    }

    if (filters.action) {
      params.set("action", filters.action);
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    const result = await apiRequest(
      `/api/admin/activity-logs?${params.toString()}`
    );

    setLogs(Array.isArray(result.logs) ? result.logs : []);

    setPagination({
      totalLogs: result.pagination?.totalLogs || 0,
      currentPage: result.pagination?.currentPage || page,
      totalPages: result.pagination?.totalPages || 0,
      limit: result.pagination?.limit || 20,
    });
  }, [page, filters]);

  // Fetch all page data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      await Promise.all([
        fetchStats(),
        fetchLogs(),
      ]);
    } catch (err) {
      console.error("Activity Logs Error:", err);
      setError(err.message || "Failed to load activity logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchStats, fetchLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters
  const handleFilterSubmit = (e) => {
    e.preventDefault();

    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      setError("Start date cannot be after end date.");
      return;
    }

    setError("");
    setPage(1);
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      module: "",
      action: "",
      startDate: "",
      endDate: "",
    });

    setPage(1);
    setError("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    setPage(newPage);
  };

  const statCards = [
    {
      title: "Total Activities",
      value: stats.totalActivities,
      icon: <FaHistory />,
      iconClass: "bg-blue-50 text-[#223F79]",
      description: "All recorded activities",
    },
    {
      title: "Last 24 Hours",
      value: stats.recentActivities,
      icon: <FaClock />,
      iconClass: "bg-amber-50 text-amber-600",
      description: "Activities in last 24 hours",
    },
    {
      title: "Today's Activities",
      value: stats.todayActivities,
      icon: <FaInfoCircle />,
      iconClass: "bg-green-50 text-green-600",
      description: "Activities recorded today",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#223F79]">
            Activity Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor administrative actions and account activity.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#223F79] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#172B50] disabled:opacity-60"
        >
          <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {loading ? "—" : card.value.toLocaleString("en-IN")}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded text-xl ${card.iconClass}`}
              >
                {card.icon}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>

          <button
            onClick={() => setError("")}
            className="font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FaFilter className="text-[#223F79]" />

          <h2 className="font-semibold text-slate-800">
            Filter Activities
          </h2>
        </div>

        <form onSubmit={handleFilterSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Module */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Module
              </label>

              <select
                value={filters.module}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    module: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#223F79]"
              >
                <option value="">All Modules</option>

                {MODULES.map((module) => (
                  <option key={module} value={module}>
                    {formatLabel(module)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Action
              </label>

              <select
                value={filters.action}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    action: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#223F79]"
              >
                <option value="">All Actions</option>

                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {formatLabel(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Start Date
              </label>

              <input
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#223F79]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                End Date
              </label>

              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#223F79]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-[#223F79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172B50]"
            >
              <FaSearch />
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Activity Table */}
      <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-2 border-b p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">
              Activity History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination.totalLogs} recorded activities
            </p>
          </div>

          <span className="text-xs text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#223F79] border-t-transparent" />

            <p className="mt-3 text-sm text-slate-500">
              Loading activities...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FaHistory className="mx-auto mb-4 text-4xl text-slate-300" />

            <h3 className="font-semibold text-slate-700">
              No Activities Found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No activity logs match your selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Admin / Staff</th>
                  <th className="px-5 py-4">Module</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Date & Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm text-[#223F79]">
                          <FaUserShield />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {log.performedBy?.name || "Unknown User"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {log.performedBy?.email || "Account unavailable"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-700">
                        {formatLabel(log.module)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          actionColors[log.action] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatLabel(log.action)}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="max-w-xs px-5 py-4">
                      <p className="break-words text-slate-700">
                        {log.description}
                      </p>

                      {log.targetName && (
                        <p className="mt-1 text-xs text-slate-400">
                          Target: {log.targetName}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-slate-400" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 0 && (
          <div className="flex flex-col justify-between gap-3 border-t p-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaChevronLeft />
                Previous
              </button>

              <span className="rounded-lg bg-[#223F79] px-4 py-2 text-sm font-semibold text-white">
                {pagination.currentPage}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ActivityLogs;
