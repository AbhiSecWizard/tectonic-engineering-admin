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

        if (!response.ok) {
          setStatus("unauthorized");
          return;
        }

        const result = await response.json();

        if (result.success && result.user) {
          setStatus("authorized");
        } else {
          setStatus("unauthorized");
        }
      } catch (error) {
        console.error("Authentication Error:", error);
        setStatus("unauthorized");
      }
    };

    checkAuth();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;