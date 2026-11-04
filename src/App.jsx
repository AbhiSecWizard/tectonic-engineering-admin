
import { Routes, Route, Navigate } from "react-router-dom";

import PageLoader from "./components/PageLoader";
import AdminLayout from "./layout/AdminLayout";
import ProtectedRoute from "./components/ProtectRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Blog from "./pages/Blog";
import Gallery from "./pages/Gallery";
import Team from "./pages/Team";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <>
      <PageLoader />

      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/admin/login" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="blog" element={<Blog />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* DEFAULT ROUTE */}
        <Route
          path="*"
          element={<Navigate to="/admin" replace />}
        />
      </Routes>
    </>
  );
};

export default App;
