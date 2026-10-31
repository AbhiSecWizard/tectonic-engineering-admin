import { NavLink } from "react-router-dom";
import {
  FaChartPie,
  FaEnvelope,
  FaBuilding,
  FaFolderOpen,
  FaFileLines,
  FaImage,
  FaUsers,
  FaGear,
  FaRightFromBracket,
  FaXmark,
} from "react-icons/fa6";

const menuItems = [
  { label: "Dashboard", to: "/admin", icon: FaChartPie, end: true },
  { label: "Enquiries", to: "/admin/enquiries", icon: FaEnvelope },
  { label: "Clients", to: "/admin/clients", icon: FaBuilding },
  { label: "Projects", to: "/admin/projects", icon: FaFolderOpen },
  { label: "Blog", to: "/admin/blog", icon: FaFileLines },
  { label: "Gallery", to: "/admin/gallery", icon: FaImage },
  { label: "Team", to: "/admin/team", icon: FaUsers },
  { label: "Settings", to: "/admin/settings", icon: FaGear },
];

const getInitials = (name = "") => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "A"
  );
};

const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  admin = { name: "Admin", email: "" },
  onLogout = () => {},
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-footer text-slate-300 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-white">
              T
            </span>

            <span className="text-base font-bold text-white">
              Admin Panel
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <FaXmark size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Admin navigation"
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Manage
          </p>

          <ul className="space-y-1">
            {menuItems.map(({ label, to, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={
                          isActive
                            ? "text-secondary"
                            : "text-slate-400"
                        }
                      />

                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Profile */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            {/* Avatar */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
              {getInitials(admin.name)}
            </span>

            {/* Admin Details */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {admin.name}
              </p>

              {admin.email && (
                <p className="truncate text-xs text-slate-400">
                  {admin.email}
                </p>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <FaRightFromBracket size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;