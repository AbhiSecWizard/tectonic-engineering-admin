
import { useCallback, useEffect, useState } from "react";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUsers,
  FaSearch,
  FaPowerOff,
  FaSave,
  FaKey,
  FaCopy,
} from "react-icons/fa";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const MODULES = ["projects", "blogs", "clients", "gallery", "team"];

const ACTIONS = ["create", "read", "update", "delete"];

// ==========================================
// INITIAL PERMISSIONS
// ==========================================

const createEmptyPermissions = () => {
  return Object.fromEntries(
    MODULES.map((module) => [
      module,
      Object.fromEntries(
        ACTIONS.map((action) => [action, false])
      ),
    ])
  );
};

// ==========================================
// INITIAL FORM
// ==========================================

const createInitialForm = () => ({
  name: "",
  email: "",
  password: "",
  permissions: createEmptyPermissions(),
});

// ==========================================
// STAFF COMPONENT
// ==========================================

const Staff = () => {
  // Staff data
  const [staffList, setStaffList] = useState([]);

  // Search
  const [search, setSearch] = useState("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // ==========================================
  // API REQUEST HELPER
  // ==========================================

  const request = async (endpoint, options = {}) => {
    const headers = {
      ...options.headers,
    };

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || "Something went wrong."
      );
    }

    return result;
  };

  // ==========================================
  // FETCH ALL STAFF
  // ==========================================

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await request("/api/admin/users");

      const list = result.staff || [];

      setStaffList(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setError("");
    setShowFormModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (staff) => {
    setEditingId(staff._id);

    setForm({
      name: staff.name || "",
      email: staff.email || "",
      password: "",
      permissions: Object.fromEntries(
        MODULES.map((module) => [
          module,
          Object.fromEntries(
            ACTIONS.map((action) => [
              action,
              staff.permissions?.[module]?.[action] === true,
            ])
          ),
        ])
      ),
    });

    setError("");
    setShowFormModal(true);
  };

  // ==========================================
  // CLOSE FORM MODAL
  // ==========================================

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingId(null);
    setForm(createInitialForm());
    setError("");
  };

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE PERMISSIONS
  // ==========================================

  const handlePermissionChange = (
    module,
    action,
    checked
  ) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: checked,
        },
      },
    }));
  };

  // ==========================================
  // CREATE / UPDATE STAFF
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (!editingId && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        permissions: form.permissions,
      };

      // Create Staff requires password
      if (!editingId) {
        payload.password = form.password;
      }

      const result = await request(
        editingId
          ? `/api/admin/users/${editingId}`
          : "/api/admin/users",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!editingId && result.staff?.loginId) {
        setSuccess(
          `Staff created successfully! Login ID: ${result.staff.loginId}`
        );
      } else {
        setSuccess(
          result.message || "Staff updated successfully."
        );
      }

      setShowFormModal(false);
      setEditingId(null);
      setForm(createInitialForm());

      await fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // UPDATE STAFF STATUS
  // ==========================================

  const handleStatusChange = async (staff) => {
    const nextStatus =
      staff.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      `Change ${staff.name}'s status to ${nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setActionLoading(staff._id);

      const result = await request(
        `/api/admin/users/${staff._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      setSuccess(result.message);
      await fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // DELETE STAFF
  // ==========================================

  const handleDelete = async (staff) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${staff.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setActionLoading(staff._id);

      const result = await request(
        `/api/admin/users/${staff._id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(result.message);
      await fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // OPEN PASSWORD MODAL
  // ==========================================

  const openPasswordModal = (staff) => {
    setSelectedStaff(staff);
    setNewPassword("");
    setError("");
    setShowPasswordModal(true);
  };

  // ==========================================
  // RESET STAFF PASSWORD
  // ==========================================

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      const result = await request(
        `/api/admin/users/${selectedStaff._id}/password`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      setSuccess(result.message);

      setShowPasswordModal(false);
      setSelectedStaff(null);
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // COPY LOGIN ID
  // ==========================================

  const copyLoginId = async (loginId) => {
    try {
      await navigator.clipboard.writeText(loginId);
      setSuccess(`Login ID ${loginId} copied.`);
      setError("");
    } catch {
      setError("Unable to copy Login ID.");
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredStaff = staffList.filter((staff) => {
    const searchText = search.trim().toLowerCase();

    const searchableText = [
      staff.name,
      staff.email,
      staff.loginId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });

  // ==========================================
  // SUMMARY
  // ==========================================

  const activeStaff = staffList.filter(
    (staff) => staff.status === "active"
  ).length;

  const inactiveStaff = staffList.filter(
    (staff) => staff.status === "inactive"
  ).length;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-[#223F79]">
            Staff Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage staff accounts, Login IDs and permissions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#223F79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172B50]"
        >
          <FaPlus />
          Add Staff
        </button>

      </div>

      {/* NOTIFICATIONS */}

      {error && !showFormModal && !showPasswordModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
            className="shrink-0"
            aria-label="Dismiss success message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Staff
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#223F79]">
            {staffList.length}
          </h2>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Active Staff
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeStaff}
          </h2>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Inactive Staff
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {inactiveStaff}
          </h2>
        </div>

      </div>

      {/* STAFF TABLE */}

      <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h2 className="font-semibold text-slate-800">
              All Staff Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total staff: {staffList.length}
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or Login ID..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#223F79] sm:w-72"
            />
          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading staff...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center">

            <FaUsers className="mx-auto mb-3 text-4xl text-slate-300" />

            <p className="font-semibold text-slate-700">
              No staff found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Add a staff member to get started."}
            </p>

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead>
                <tr className="border-b bg-slate-50 text-slate-600">

                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Login ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3 text-right">Actions</th>

                </tr>
              </thead>

              <tbody>

                {filteredStaff.map((staff) => (

                  <tr
                    key={staff._id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >

                    {/* STAFF DETAILS */}

                    <td className="p-3">
                      <p className="font-semibold text-slate-800">
                        {staff.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {staff.email}
                      </p>
                    </td>

                    {/* LOGIN ID */}

                    <td className="p-3">

                      <div className="flex items-center gap-2">

                        <span className="font-semibold text-[#223F79]">
                          {staff.loginId || "Not assigned"}
                        </span>

                        {staff.loginId && (
                          <button
                            onClick={() =>
                              copyLoginId(staff.loginId)
                            }
                            title="Copy Login ID"
                            className="text-slate-400 hover:text-[#223F79]"
                          >
                            <FaCopy />
                          </button>
                        )}

                      </div>

                    </td>

                    {/* ROLE */}

                    <td className="p-3 capitalize">
                      {staff.role}
                    </td>

                    {/* STATUS */}

                    <td className="p-3">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          staff.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {staff.status}
                      </span>

                    </td>

                    {/* CREATED BY */}

                    <td className="p-3 text-slate-600">
                      {staff.createdBy?.name || "—"}
                    </td>

                    {/* ACTIONS */}

                    <td className="p-3">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => openEditModal(staff)}
                          disabled={actionLoading === staff._id}
                          title="Edit Staff"
                          className="rounded-md bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => openPasswordModal(staff)}
                          disabled={actionLoading === staff._id}
                          title="Reset Password"
                          className="rounded-md bg-purple-50 p-2 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                          <FaKey />
                        </button>

                        <button
                          onClick={() => handleStatusChange(staff)}
                          disabled={actionLoading === staff._id}
                          title="Change Status"
                          className="rounded-md bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        >
                          <FaPowerOff />
                        </button>

                        <button
                          onClick={() => handleDelete(staff)}
                          disabled={actionLoading === staff._id}
                          title="Delete Staff"
                          className="rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ================================== */}
      {/* CREATE / EDIT STAFF MODAL */}
      {/* ================================== */}

      {showFormModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded bg-white shadow-xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">

              <div>
                <h2 className="text-lg font-bold text-[#223F79]">
                  {editingId ? "Edit Staff" : "Create Staff"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter account details and assign permissions.
                </p>
              </div>

              <button
                onClick={closeFormModal}
                disabled={saving}
                className="text-slate-500 hover:text-red-600 disabled:opacity-50"
              >
                <FaTimes />
              </button>

            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5"
            >

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* BASIC DETAILS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-[#223F79]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-[#223F79]"
                  />
                </div>

                {/* PASSWORD ONLY WHEN CREATING */}

                {!editingId && (
                  <div className="sm:col-span-2">

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Initial Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-[#223F79]"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Staff can use this password with their Login ID or email.
                    </p>

                  </div>
                )}

              </div>

              {/* PERMISSIONS */}

              <div>

                <div className="mb-3">
                  <h3 className="font-semibold text-slate-800">
                    Module Permissions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select which operations this staff member can perform.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">

                  <table className="w-full min-w-[500px] text-sm">

                    <thead className="bg-slate-50">
                      <tr>

                        <th className="p-3 text-left">
                          Module
                        </th>

                        {ACTIONS.map((action) => (
                          <th
                            key={action}
                            className="p-3 text-center capitalize"
                          >
                            {action}
                          </th>
                        ))}

                      </tr>
                    </thead>

                    <tbody>

                      {MODULES.map((module) => (

                        <tr
                          key={module}
                          className="border-t border-slate-200"
                        >

                          <td className="p-3 font-medium capitalize text-slate-700">
                            {module}
                          </td>

                          {ACTIONS.map((action) => (

                            <td
                              key={action}
                              className="p-3 text-center"
                            >

                              <input
                                type="checkbox"
                                checked={
                                  form.permissions[module][action]
                                }
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module,
                                    action,
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 cursor-pointer accent-[#223F79]"
                              />

                            </td>

                          ))}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* FORM ACTIONS */}

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#223F79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172B50] disabled:opacity-60"
                >
                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Staff"
                    : "Create Staff"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================== */}
      {/* RESET PASSWORD MODAL */}
      {/* ================================== */}

      {showPasswordModal && selectedStaff && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">

          <div className="w-full max-w-md rounded bg-white shadow-xl">

            <div className="flex items-center justify-between border-b p-5">

              <div>
                <h2 className="text-lg font-bold text-[#223F79]">
                  Reset Password
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedStaff.name}
                </p>
              </div>

              <button
                onClick={() => {
                  if (saving) return;

                  setShowPasswordModal(false);
                  setSelectedStaff(null);
                  setNewPassword("");
                  setError("");
                }}
                disabled={saving}
                className="text-slate-500 hover:text-red-600"
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={handlePasswordReset}
              className="space-y-5 p-5"
            >

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-[#223F79]"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Password must contain at least 8 characters.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedStaff(null);
                    setNewPassword("");
                    setError("");
                  }}
                  className="rounded-lg border px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#223F79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172B50] disabled:opacity-60"
                >
                  <FaKey />

                  {saving ? "Updating..." : "Reset Password"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Staff;
