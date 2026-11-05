
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ==========================================
  // FETCH LOGGED-IN ADMIN PROFILE
  // ==========================================

  const fetchProfile = useCallback(async (signal) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        method: "GET",
        credentials: "include",
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.user) {
        setAdmin(null);
        setIsAuthenticated(false);
        return null;
      }

      setAdmin(result.user);
      setIsAuthenticated(true);

      return result.user;
    } catch (error) {
      if (error.name === "AbortError") {
        return null;
      }

      console.error("Profile Error:", error);

      setAdmin(null);
      setIsAuthenticated(false);

      return null;
    }
  }, []);

  // ==========================================
  // INITIAL AUTHENTICATION CHECK
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const initializeAuth = async () => {
      setLoading(true);

      try {
        await fetchProfile(controller.signal);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => controller.abort();
  }, [fetchProfile]);

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (identifier, password) => {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.user) {
      throw new Error(result.message || "Login failed.");
    }

    setAdmin(result.user);
    setIsAuthenticated(true);

    return result;
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const updateProfile = async (profileData) => {
    const response = await fetch(
      `${API_URL}/api/admin/profile/update`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.user) {
      throw new Error(result.message || "Profile update failed.");
    }

    setAdmin(result.user);

    return result;
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const changePassword = async (passwordData) => {
    const response = await fetch(
      `${API_URL}/api/admin/change-password`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Password change failed.");
    }

    // Require login again after password change.
    setAdmin(null);
    setIsAuthenticated(false);

    return result;
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Logout failed.");
      }

      return result;
    } catch (error) {
      console.error("Logout Error:", error);

      return {
        success: false,
        message: error.message || "Logout failed.",
      };
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
    }
  };

  // ==========================================
  // REFRESH PROFILE
  // ==========================================

  const refreshProfile = async () => {
    setLoading(true);

    try {
      return await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    admin,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM AUTH HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
