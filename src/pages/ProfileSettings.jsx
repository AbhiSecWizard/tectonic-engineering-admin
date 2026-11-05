
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSave,
  FaKey,
} from "react-icons/fa";

const ProfileSettings = () => {
  const { admin, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Only Super Admin can access this page
  if (!admin || admin.role !== "superadmin") {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h2 className="text-xl font-bold text-red-600">
          Access Denied
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Only Super Admin can access profile settings.
        </p>
      </div>
    );
  }

  // Profile input handler
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Password input handler
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileMessage("");

    if (!profileData.name.trim() || !profileData.email.trim()) {
      setProfileError("Name and email are required.");
      return;
    }

    try {
      setProfileLoading(true);

      const result = await updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });

      setProfileMessage(
        result.message || "Profile updated successfully."
      );
    } catch (error) {
      setProfileError(error.message || "Profile update failed.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("Please fill all password fields.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      const result = await changePassword(passwordData);

      setPasswordMessage(
        result.message || "Password changed successfully."
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Password change ends the current session.
      setTimeout(() => {
        navigate("/admin/login", { replace: true });
      }, 1500);

    } catch (error) {
      setPasswordError(error.message || "Password change failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-heading">
          Profile Settings
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your personal account details and password.
        </p>
      </div>

      {/* Account Information */}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <FaUser size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-heading">
              Personal Information
            </h2>

            <p className="text-sm text-muted">
              Update your name and email address.
            </p>
          </div>
        </div>

        {profileError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {profileError}
          </p>
        )}

        {profileMessage && (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {profileMessage}
          </p>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-body">
              Full Name
            </label>

            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
                required
                className="w-full rounded-lg border border-border py-3 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-body">
              Email Address
            </label>

            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-border py-3 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />

            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-secondary/10 p-3 text-secondary">
            <FaKey size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-heading">
              Change Password
            </h2>

            <p className="text-sm text-muted">
              Verify your current password before setting a new one.
            </p>
          </div>
        </div>

        {passwordError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {passwordError}
          </p>
        )}

        {passwordMessage && (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {passwordMessage}
            <br />
            Redirecting to login...
          </p>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5">

          {/* Current Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-body">
              Current Password
            </label>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-border py-3 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-body">
              New Password
            </label>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-border py-3 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <p className="mt-1 text-xs text-muted">
              Minimum 8 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-body">
              Confirm New Password
            </label>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-border py-3 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaLock />

            {passwordLoading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>

    </div>
  );
};

export default ProfileSettings;