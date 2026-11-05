
import { Routes, Route, Navigate } from "react-router-dom";

import ActivityLogs from "./pages/admin/ActivityLogs";
import RolesPermissions from "./pages/admin/RolesPermissions";
import Staff from "./pages/admin/Staff";
import Settings from "./pages/Settings";

import ProtectRoute from "./components/ProtectRoute";
import AdminLayout from "./layout/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Gallery from "./pages/Gallery";
import Team from "./pages/Team";
import ProfileSettings from "./pages/ProfileSettings";

// Simple unauthorized page
const NoAccess = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8] px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-[#223F79]">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          You don't have permission to access this page.
          Please contact your Super Admin.
        </p>

        <a
          href="/admin"
          className="mt-6 inline-block rounded-lg bg-[#223F79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172B50]"
        >
          Go Back
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin Layout */}
      <Route
        path="/admin"
        element={
          <ProtectRoute>
            <AdminLayout />
          </ProtectRoute>
        }
      >

        {/* Super Admin Dashboard */}
        <Route
          index
          element={
            <ProtectRoute superadminOnly>
              <Dashboard />
            </ProtectRoute>
          }
        />
        <Route
  path="profile-settings"
  element={
    <ProtectRoute superadminOnly>
      <ProfileSettings />
    </ProtectRoute>
  }
/>

        {/* Module Routes */}
        <Route
          path="projects"
          element={
            <ProtectRoute module="projects">
              <Projects />
            </ProtectRoute>
          }
        />

        <Route
          path="blog"
          element={
            <ProtectRoute module="blogs">
              <Blog />
            </ProtectRoute>
          }
        />

        <Route
          path="clients"
          element={
            <ProtectRoute module="clients">
              <Clients />
            </ProtectRoute>
          }
        />

        <Route
          path="gallery"
          element={
            <ProtectRoute module="gallery">
              <Gallery />
            </ProtectRoute>
          }
        />

        <Route
          path="team"
          element={
            <ProtectRoute module="team">
              <Team />
            </ProtectRoute>
          }
        />

        {/* Super Admin Only Routes */}
        <Route
          path="staff"
          element={
            <ProtectRoute superadminOnly>
              <Staff />
            </ProtectRoute>
          }
        />

        <Route
          path="roles-permissions"
          element={
            <ProtectRoute superadminOnly>
              <RolesPermissions />
            </ProtectRoute>
          }
        />

        <Route
          path="activity-logs"
          element={
            <ProtectRoute superadminOnly>
              <ActivityLogs />
            </ProtectRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectRoute superadminOnly>
              <Settings />
            </ProtectRoute>
          }
        />

        {/* Authenticated but unauthorized */}
        <Route
          path="no-access"
          element={<NoAccess />}
        />
      </Route>

      {/* Unknown Routes */}
      <Route
        path="*"
        element={<Navigate to="/admin" replace />}
      />
    </Routes>
  );
}

export default App;
