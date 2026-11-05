// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const ProtectRoute = ({ children }) => {
//   const { loading, isAuthenticated } = useAuth();
//   const location = useLocation();

//   // Authentication check hone tak loading
//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8]">
//         <div className="text-center">
//           <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#223F79] border-t-transparent"></div>

//           <p className="mt-3 text-sm text-slate-600">
//             Checking authentication...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // User authenticated nahi hai
//   if (!isAuthenticated) {
//     return (
//       <Navigate
//         to="/admin/login"
//         replace
//         state={{ from: location }}
//       />
//     );
//   }

//   // User authenticated hai
//   return children;
// };

// export default ProtectRoute;


import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectRoute = ({
  children,
  module,
  action,
  superadminOnly = false,
}) => {
  const { admin, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#223F79] border-t-transparent" />

          <p className="mt-3 text-sm text-slate-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated || !admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Super Admin only pages
  if (superadminOnly && admin.role !== "superadmin") {
    return <Navigate to="/admin/no-access" replace />;
  }

  // Super Admin has full access
  if (admin.role === "superadmin") {
    return children;
  }

  // Staff must have a valid role
  if (admin.role !== "staff") {
    return <Navigate to="/admin/no-access" replace />;
  }

  // No module means authentication-only protection
  if (!module) {
    return children;
  }

  const modulePermissions = admin.permissions?.[module];

  // If an exact action is supplied, check that action
  if (action) {
    if (modulePermissions?.[action] !== true) {
      return <Navigate to="/admin/no-access" replace />;
    }

    return children;
  }

  // Otherwise allow entry if at least one module action is true
  const canAccessModule =
    modulePermissions &&
    Object.values(modulePermissions).some(
      (permission) => permission === true
    );

  if (!canAccessModule) {
    return <Navigate to="/admin/no-access" replace />;
  }

  return children;
};

export default ProtectRoute;
