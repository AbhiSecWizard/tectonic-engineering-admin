
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaArrowRight,
} from "react-icons/fa6";

import { MdEmail } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

// ==========================================
// REDIRECT BASED ON ROLE AND PERMISSIONS
// ==========================================

const getLandingRoute = (user) => {
  if (user?.role === "superadmin") {
    return "/admin";
  }

  const moduleRoutes = [
    { key: "projects", path: "/admin/projects" },
    { key: "blogs", path: "/admin/blog" },
    { key: "clients", path: "/admin/clients" },
    { key: "gallery", path: "/admin/gallery" },
    { key: "team", path: "/admin/team" },
  ];

  const permissions = user?.permissions || {};

  const allowedModule = moduleRoutes.find(({ key }) => {
    const modulePermissions = permissions[key];

    return (
      modulePermissions &&
      Object.values(modulePermissions).some(
        (permission) => permission === true
      )
    );
  });

  return allowedModule?.path || "/admin/no-access";
};

// ==========================================
// LOGIN COMPONENT
// ==========================================

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    admin,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      return "Email address or Login ID is required.";
    }

    if (!formData.password) {
      return "Password is required.";
    }

    return "";
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result = await login(
        formData.identifier.trim(),
        formData.password
      );

      if (!result?.success || !result?.user) {
        throw new Error(
          result?.message || "Login failed."
        );
      }

      // Redirect according to user permissions
      const redirectPath = getLandingRoute(result.user);

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error("Login Error:", error);

      setError(
        error.message || "Unable to connect to server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // AUTHENTICATION CHECK
  // ==========================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8]">
        <p className="text-sm text-slate-600">
          Checking authentication...
        </p>
      </div>
    );
  }

  // Already logged-in user
  if (isAuthenticated && admin) {
    return (
      <Navigate
        to={getLandingRoute(admin)}
        replace
      />
    );
  }

  // ==========================================
  // LOGIN UI
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8] px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#223F79] text-3xl font-bold text-white shadow-lg">
            T
          </div>

          <h1 className="text-3xl font-bold text-[#223F79]">
            Tectonic
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Engineering Admin Panel
          </p>

          <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-[#D99A32]" />
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#223F79]">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage your website.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email / Login ID */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address / Login ID
              </label>

              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

                <input
                  id="identifier"
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter email or TEC-XXXXXX"
                  autoComplete="username"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#223F79] focus:ring-2 focus:ring-[#223F79]/10 disabled:bg-slate-100"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Use your registered email or staff Login ID.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-[#223F79] focus:ring-2 focus:ring-[#223F79]/10 disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={submitting}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#223F79]"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#223F79] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#172B50] focus:outline-none focus:ring-4 focus:ring-[#223F79]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs leading-6 text-slate-400">
          © {new Date().getFullYear()} Tectonic Engineering Solution LLP.
          <br />
          All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
