
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/profile`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setStatus("denied");
      }
    };

    checkAuth();
  }, []);

  // Loading
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking your session...
      </div>
    );
  }

  // Not authenticated
  if (status === "denied") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Authenticated
  return children;
};

export default ProtectedRoute;
