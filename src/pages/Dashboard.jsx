
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FaFolderOpen,
  FaUsers,
  FaUserTie,
  FaImages,
  FaNewspaper,
  FaBriefcase,
  FaArrowUp,
  FaArrowRight,
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaArchive,
  FaChartLine,
  FaExclamationTriangle,
  FaEye,
  FaPlus,
  FaCalendarAlt,
} from "react-icons/fa";

import { Link } from "react-router-dom";

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const API = {
  projects: `${API_URL}/api/projects`,
  clients: `${API_URL}/api/clients`,
  team: `${API_URL}/api/team`,
  gallery: `${API_URL}/api/gallery`,
  blogs: [
    `${API_URL}/api/blogs/admin/all`,
    `${API_URL}/api/blogs`,
  ],
};

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const extractArray = (result) => {
  if (Array.isArray(result)) return result;

  if (Array.isArray(result?.data)) return result.data;

  if (Array.isArray(result?.data?.data)) {
    return result.data.data;
  }

  if (Array.isArray(result?.projects)) return result.projects;
  if (Array.isArray(result?.clients)) return result.clients;
  if (Array.isArray(result?.blogs)) return result.blogs;
  if (Array.isArray(result?.team)) return result.team;
  if (Array.isArray(result?.gallery)) return result.gallery;

  return [];
};


const fetchResource = async (url) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const fetchBlogs = async () => {
  let lastError;

  for (const url of API.blogs) {
    try {
      return extractArray(await fetchResource(url));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to fetch blogs");
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRecordTitle = (item, type) => {
  return (
    item.name ||
    item.title ||
    item.imageName ||
    item.projectName ||
    item.clientName ||
    item.heading ||
    `${type} record`
  );
};

const getStatus = (item) => {
  return String(item.status || "").toLowerCase();
};

// --------------------------------------------------
// REUSABLE STAT CARD
// --------------------------------------------------

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  loading,
  link,
}) => {
  const content = (
    <div className="group h-full rounded-xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">

      <div className="flex items-center justify-between gap-3">

        <p className="text-sm font-medium text-muted">
          {title}
        </p>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="text-lg" />
        </div>

      </div>

      {loading ? (
        <div className="mt-5 h-9 w-20 animate-pulse rounded-md bg-background" />
      ) : (
        <h2 className="mt-5 text-3xl font-bold tabular-nums text-heading">
          {value.toLocaleString("en-IN")}
        </h2>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">

        <p className="text-xs text-muted">
          {subtitle}
        </p>

        <FaArrowRight className="text-xs text-muted transition group-hover:translate-x-1 group-hover:text-secondary" />

      </div>

    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

// --------------------------------------------------
// SECTION HEADER
// --------------------------------------------------

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="mb-5 flex items-center justify-between gap-3">

    <div>
      <h2 className="text-lg font-bold text-heading">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-1 text-xs text-muted">
          {subtitle}
        </p>
      )}
    </div>

    {action}

  </div>
);

// --------------------------------------------------
// MAIN DASHBOARD
// --------------------------------------------------

const Dashboard = () => {
  const [data, setData] = useState({
    projects: [],
    clients: [],
    team: [],
    gallery: [],
    blogs: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errors, setErrors] = useState([]);

  // ----------------------------------------------
  // FETCH ALL DASHBOARD DATA
  // ----------------------------------------------

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const resources = [
      ["projects", () => fetchResource(API.projects)],
      ["clients", () => fetchResource(API.clients)],
      ["team", () => fetchResource(API.team)],
      ["gallery", () => fetchResource(API.gallery)],
      ["blogs", fetchBlogs],
    ];

    try {
      const results = await Promise.allSettled(
        resources.map(([, request]) => request())
      );

      const newData = {
        projects: [],
        clients: [],
        team: [],
        gallery: [],
        blogs: [],
      };

      const failedResources = [];

      results.forEach((result, index) => {
        const key = resources[index][0];

        if (result.status === "fulfilled") {
          newData[key] =
            key === "blogs"
              ? result.value
              : extractArray(result.value);
        } else {
          failedResources.push(key);
          console.error(
            `Dashboard ${key} API error:`,
            result.reason
          );
        }
      });

      setData(newData);
      setErrors(failedResources);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ----------------------------------------------
  // COUNTS
  // ----------------------------------------------

  const counts = useMemo(() => {
    const blogStatus = data.blogs.map(getStatus);

    const activeClients = data.clients.filter(
      (client) => getStatus(client) === "active"
    ).length;

    const publishedBlogs = blogStatus.filter(
      (status) => status === "published"
    ).length;

    const draftBlogs = blogStatus.filter(
      (status) => status === "draft"
    ).length;

    const archivedBlogs = blogStatus.filter(
      (status) => status === "archived"
    ).length;

    return {
      projects: data.projects.length,
      clients: data.clients.length,
      activeClients,
      team: data.team.length,
      gallery: data.gallery.length,
      blogs: data.blogs.length,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
    };
  }, [data]);

  // ----------------------------------------------
  // RECENT ACTIVITY
  // ----------------------------------------------

  const recentActivity = useMemo(() => {
    const collections = [
      ["Project", data.projects, "text-blue-700 bg-blue-50"],
      ["Client", data.clients, "text-green-700 bg-green-50"],
      ["Team Member", data.team, "text-purple-700 bg-purple-50"],
      ["Gallery", data.gallery, "text-orange-700 bg-orange-50"],
      ["Blog", data.blogs, "text-indigo-700 bg-indigo-50"],
    ];

    return collections
      .flatMap(([type, records, style]) =>
        records.map((item) => ({
          id: item._id || `${type}-${getRecordTitle(item, type)}`,
          type,
          title: getRecordTitle(item, type),
          date: item.createdAt || item.updatedAt || null,
          style,
        }))
      )
      .filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()))
      .sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )
      .slice(0, 7);
  }, [data]);

  // ----------------------------------------------
  // MONTHLY ACTIVITY CHART
  // ----------------------------------------------

  const monthlyActivity = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const month = date.getMonth();
      const year = date.getFullYear();

      const total = Object.values(data).reduce(
        (sum, records) => {
          const count = records.filter((item) => {
            if (!item.createdAt) return false;
                                                
            const created = new Date(item.createdAt);

            return (
              created.getMonth() === month &&
              created.getFullYear() === year
            );
          }).length;

          return sum + count;
        },
        0
      );

      months.push({
        label: date.toLocaleDateString("en-IN", {
          month: "short",
        }),
        total,
      });
    }

    return months;
  }, [data]);

  const maxActivity = Math.max(
    ...monthlyActivity.map((item) => item.total),
    1
  );

  // ----------------------------------------------
  // QUICK ACTIONS
  // ----------------------------------------------

  const quickActions = [
    {
      title: "Add Project",
      description: "Create a new project",
      icon: FaFolderOpen,
      path: "/admin/projects",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Add Client",
      description: "Manage company clients",
      icon: FaUsers,
      path: "/admin/clients",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Add Team Member",
      description: "Manage your engineering team",
      icon: FaUserTie,
      path: "/admin/team",
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Upload Image",
      description: "Add gallery images",
      icon: FaImages,
      path: "/admin/gallery",
      color: "bg-orange-50 text-orange-700",
    },
    {
      title: "Create Blog",
      description: "Publish engineering articles",
      icon: FaNewspaper,
      path: "/admin/blog",
      color: "bg-indigo-50 text-indigo-700",
    },
  ];

  // ----------------------------------------------
  // MAIN STATISTICS
  // ----------------------------------------------

  const statCards = [
    {
      title: "Total Projects",
      value: counts.projects,
      icon: FaFolderOpen,
      color: "bg-blue-50 text-blue-700",
      subtitle: "Projects in database",
      link: "/admin/projects",
    },
    {
      title: "Total Clients",
      value: counts.clients,
      icon: FaUsers,
      color: "bg-green-50 text-green-700",
      subtitle: `${counts.activeClients} active clients`,
      link: "/admin/clients",
    },
    {
      title: "Team Members",
      value: counts.team,
      icon: FaUserTie,
      color: "bg-purple-50 text-purple-700",
      subtitle: "Professional team records",
      link: "/admin/team",
    },
    {
      title: "Gallery Images",
      value: counts.gallery,
      icon: FaImages,
      color: "bg-orange-50 text-orange-700",
      subtitle: "Uploaded images",
      link: "/admin/gallery",
    },
    {
      title: "Total Blogs",
      value: counts.blogs,
      icon: FaNewspaper,
      color: "bg-indigo-50 text-indigo-700",
      subtitle: `${counts.publishedBlogs} published`,
      link: "/admin/blog",
    },
  ];

  // ----------------------------------------------
  // RENDER
  // ----------------------------------------------

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-7">

      {/* ==========================================
          TOP HEADER
      ========================================== */}

      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-secondary">
            TECTONIC ENGINEERING
          </p>

          <h1 className="text-2xl font-bold text-heading sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-muted">
            Welcome to your admin dashboard. Manage your business
            operations from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted sm:flex">
            <FaCalendarAlt className="text-secondary" />
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary transition hover:bg-background disabled:opacity-50"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

        </div>

      </div>

      {/* ==========================================
          API ERROR NOTICE
      ========================================== */}

      {errors.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-800">
              Some dashboard data could not be loaded.
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Failed modules: {errors.join(", ")}. Check your backend
              routes and API responses, then refresh.
            </p>
          </div>

        </div>
      )}

      {/* ==========================================
          STATISTICS CARDS
      ========================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            {...stat}
            loading={loading}
          />
        ))}

      </div>

      {/* ==========================================
          CONTENT STATUS
      ========================================== */}

      <section className="mb-8">

        <SectionHeader
          title="Content Overview"
          subtitle="Track your blog publishing progress."
          action={
            <Link
              to="/admin/blog"
              className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-secondary"
            >
              Manage Blogs <FaArrowRight />
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {[
            {
              title: "Published Blogs",
              value: counts.publishedBlogs,
              icon: FaCheckCircle,
              color: "text-green-600",
              background: "bg-green-50",
            },
            {
              title: "Draft Blogs",
              value: counts.draftBlogs,
              icon: FaClock,
              color: "text-amber-600",
              background: "bg-amber-50",
            },
            {
              title: "Archived Blogs",
              value: counts.archivedBlogs,
              icon: FaArchive,
              color: "text-slate-600",
              background: "bg-slate-100",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <div>
                <p className="text-sm text-muted">
                  {item.title}
                </p>

                <h3 className="mt-3 text-2xl font-bold text-heading">
                  {loading ? "—" : item.value}
                </h3>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.background} ${item.color}`}>
                <item.icon className="text-xl" />
              </div>
            </div>
          ))}

        </div>

      </section>

      {/* ==========================================
          CHART + QUICK ACTIONS
      ========================================== */}

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* MONTHLY ACTIVITY */}

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm xl:col-span-2">

          <SectionHeader
            title="Monthly Activity"
            subtitle="New records added across all modules."
          />

          <div className="mt-8 flex h-56 items-end justify-between gap-3 sm:gap-6">

            {monthlyActivity.map((month) => (
              <div
                key={`${month.label}-${monthlyActivity.indexOf(month)}`}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >

                <span className="mb-2 text-xs font-semibold text-heading">
                  {loading ? "—" : month.total}
                </span>

                <div className="flex h-40 w-full items-end justify-center rounded-t-md bg-background">

                  <div
                    className="w-full max-w-12 rounded-t-md bg-primary transition-all duration-500"
                    style={{
                      height: loading
                        ? "0%"
                        : `${(month.total / maxActivity) * 100}%`,
                      minHeight:
                        !loading && month.total > 0 ? "5px" : "0px",
                    }}
                  />

                </div>

                <span className="mt-3 text-xs font-medium text-muted">
                  {month.label}
                </span>

              </div>
            ))}

          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-xs text-muted">
              Total new records created per month
            </p>
          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">

          <SectionHeader
            title="Quick Actions"
            subtitle="Manage your business faster."
          />

          <div className="space-y-3">

            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.path}
                className="group flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-secondary hover:bg-background"
              >

                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                  <action.icon />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-heading">
                    {action.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted">
                    {action.description}
                  </p>
                </div>

                <FaArrowRight className="text-xs text-muted transition group-hover:translate-x-1 group-hover:text-secondary" />

              </Link>
            ))}

          </div>

        </section>

      </div>

      {/* ==========================================
          RECENT ACTIVITY
      ========================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-lg font-bold text-heading">
              Recent Activity
            </h2>

            <p className="mt-1 text-xs text-muted">
              Latest records from your database.
            </p>
          </div>

          <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-muted">
            Latest 7 records
          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[600px] text-left">

            <thead className="bg-background">

              <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-4">Record</th>
                <th className="px-5 py-4">Module</th>
                <th className="px-5 py-4">Created Date</th>
                <th className="px-5 py-4">Activity</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {loading ? (

                <tr>
                  <td colSpan="4" className="py-12 text-center text-sm text-muted">
                    Loading recent activity...
                  </td>
                </tr>

              ) : recentActivity.length === 0 ? (

                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <FaChartLine className="mx-auto mb-3 text-3xl text-muted" />

                    <p className="text-sm font-semibold text-heading">
                      No recent activity
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Records with creation dates will appear here.
                    </p>
                  </td>
                </tr>

              ) : (

                recentActivity.map((activity) => (
                  <tr
                    key={activity.id}
                    className="transition hover:bg-background/70"
                  >

                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate text-sm font-semibold text-heading">
                        {activity.title}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${activity.style}`}>
                        {activity.type}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {formatDate(activity.date)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-xs font-medium text-green-600">
                        <FaCheckCircle />
                        Record created
                      </span>
                    </td>

                  </tr>
                ))

              )}

            </tbody>

          </table>

        </div>

        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted">
            Activity is based on createdAt dates returned by your APIs.
          </p>
        </div>

      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <div className="mt-8 flex flex-col justify-between gap-2 border-t border-border pt-5 sm:flex-row sm:items-center">

        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Tectonic Engineering Solution LLP
        </p>

        <p className="text-xs text-muted">
          Admin Management System
        </p>

      </div>

    </div>
  );
};

export default Dashboard;
