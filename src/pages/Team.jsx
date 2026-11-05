
import { useEffect, useRef, useState } from "react";
import {
  FaPlus,
  FaUsers,
  FaGraduationCap,
  FaBriefcase,
  FaUserTie,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
  FaSpinner,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaEnvelope,
} from "react-icons/fa";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const TEAM_API = `${API_URL}/api/team`;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// ==========================================
// INITIAL FORM
// ==========================================

const createInitialForm = () => ({
  name: "",
  workEmail: "",
  designation: "",
  education: "",
  note: "",
});

// ==========================================
// API HELPER
// ==========================================

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const Team = () => {
  // ----------------------------------------
  // STATES
  // ----------------------------------------

  const [team, setTeam] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMember, setViewMember] = useState(null);

  const [formData, setFormData] = useState(createInitialForm);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  // ----------------------------------------
  // NOTIFICATION
  // ----------------------------------------

  const showNotification = (type, text) => {
    setMessage({ type, text });
  };

  const clearNotification = () => {
    setMessage({ type: "", text: "" });
  };

  // ----------------------------------------
  // FETCH TEAM MEMBERS
  // ----------------------------------------

  const fetchTeam = async () => {
    try {
      setLoading(true);

      const result = await apiRequest(TEAM_API);

      setTeam(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // ----------------------------------------
  // PREVIEW URL CLEANUP
  // ----------------------------------------

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  };

  useEffect(() => {
    return () => {
      clearPreview();
    };
  }, []);

  // ----------------------------------------
  // FORM INPUT CHANGE
  // ----------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ----------------------------------------
  // RESET FORM
  // ----------------------------------------

  const resetForm = () => {
    clearPreview();

    setFormData(createInitialForm());
    setPhoto(null);
    setPreview("");
    setEditingId(null);
    setShowForm(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ----------------------------------------
  // OPEN CREATE FORM
  // ----------------------------------------

  const handleAddNew = () => {
    resetForm();
    clearNotification();
    setShowForm(true);
  };

  // ----------------------------------------
  // OPEN EDIT FORM
  // ----------------------------------------

  const handleEdit = (member) => {
    clearPreview();

    setEditingId(member._id);

    setFormData({
      name: member.name || "",
      workEmail: member.workEmail || "",
      designation: member.designation || "",
      education: member.education || "",
      note: member.note || "",
    });

    setPhoto(null);
    setPreview(member.photo?.url || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setShowForm(true);
    setViewMember(null);

    clearNotification();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------------
  // PHOTO VALIDATION & PREVIEW
  // ----------------------------------------

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification(
        "error",
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      showNotification(
        "error",
        "Photo size should not exceed 5MB."
      );

      e.target.value = "";
      return;
    }

    clearPreview();

    const imageUrl = URL.createObjectURL(file);

    previewUrlRef.current = imageUrl;

    setPhoto(file);
    setPreview(imageUrl);

    clearNotification();
  };

  // ----------------------------------------
  // CREATE / UPDATE TEAM MEMBER
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.workEmail.trim() ||
      !formData.designation.trim()
    ) {
      showNotification(
        "error",
        "Name, work email and designation are required."
      );

      return;
    }

    if (!editingId && !photo) {
      showNotification(
        "error",
        "Please upload a team member photo."
      );

      return;
    }

    try {
      setSaving(true);
      clearNotification();

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value.trim());
      });

      if (photo) {
        data.append("photo", photo);
      }

      const url = editingId
        ? `${TEAM_API}/${editingId}`
        : TEAM_API;

      const result = await apiRequest(url, {
        method: editingId ? "PUT" : "POST",
        body: data,
      });

      resetForm();

      await fetchTeam();

      showNotification(
        "success",
        result.message ||
          (editingId
            ? "Team member updated successfully."
            : "Team member created successfully.")
      );
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // DELETE TEAM MEMBER
  // ----------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team member?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      clearNotification();

      const result = await apiRequest(
        `${TEAM_API}/${id}`,
        {
          method: "DELETE",
        }
      );

      setTeam((prev) =>
        prev.filter((member) => member._id !== id)
      );

      if (viewMember?._id === id) {
        setViewMember(null);
      }

      showNotification(
        "success",
        result.message || "Team member deleted successfully."
      );
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------------
  // SEARCH FILTER
  // ----------------------------------------

  const filteredTeam = team.filter((member) => {
    const query = search.trim().toLowerCase();

    return [
      member.name,
      member.workEmail,
      member.designation,
      member.education,
    ].some((value) =>
      (value || "").toLowerCase().includes(query)
    );
  });

  // ----------------------------------------
  // STATISTICS
  // ----------------------------------------

  const stats = [
    {
      title: "Total Members",
      value: team.length,
      icon: <FaUsers />,
      color: "text-primary",
    },
    {
      title: "With Education",
      value: team.filter(
        (member) => member.education?.trim()
      ).length,
      icon: <FaGraduationCap />,
      color: "text-green-600",
    },
    {
      title: "With Introduction",
      value: team.filter(
        (member) => member.note?.trim()
      ).length,
      icon: <FaUserTie />,
      color: "text-secondary",
    },
    {
      title: "Designations",
      value: new Set(
        team
          .map((member) =>
            member.designation?.trim().toLowerCase()
          )
          .filter(Boolean)
      ).size,
      icon: <FaBriefcase />,
      color: "text-primary",
    },
  ];

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-7">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-secondary">
            CRM MANAGEMENT
          </p>

          <h1 className="text-2xl font-bold text-heading sm:text-3xl">
            Team Management
          </h1>

          <p className="mt-2 text-sm text-muted">
            Manage your engineering team and professional profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer"
        >
          <FaPlus />
          Add New Member
        </button>
      </div>

      {/* NOTIFICATION */}

      {message.text && (
        <div
          className={`mb-5 flex items-center justify-between rounded-lg border p-3 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {message.type === "success" ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationCircle />
            )}

            <span>{message.text}</span>
          </div>

          <button
            type="button"
            onClick={clearNotification}
            aria-label="Close notification"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">
                {stat.title}
              </p>

              <span className={`text-lg ${stat.color}`}>
                {stat.icon}
              </span>
            </div>

            <h2 className={`mt-4 text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* ADD / EDIT FORM */}

      {showForm && (
        <div className="mb-8 overflow-hidden rounded border border-border bg-surface shadow-sm">

          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-bold text-heading">
                {editingId
                  ? "Edit Team Member"
                  : "Add New Team Member"}
              </h2>

              <p className="mt-1 text-xs text-muted">
                Enter team member professional details.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              aria-label="Close form"
              className="rounded-lg p-2 text-muted hover:bg-background hover:text-red-500 disabled:opacity-50"
            >
              <FaTimes />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2"
          >

            {/* FULL NAME */}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-body"
              >
                Full Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                maxLength={100}
                className="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* WORK EMAIL */}

            <div>
              <label
                htmlFor="workEmail"
                className="mb-2 block text-sm font-medium text-body"
              >
                Work Email *
              </label>

              <input
                id="workEmail"
                type="email"
                name="workEmail"
                value={formData.workEmail}
                onChange={handleChange}
                placeholder="example@company.com"
                required
                className="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* DESIGNATION */}

            <div>
              <label
                htmlFor="designation"
                className="mb-2 block text-sm font-medium text-body"
              >
                Designation *
              </label>

              <input
                id="designation"
                name="designation"
                type="text"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Senior Structural Engineer"
                required
                className="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* EDUCATION */}

            <div>
              <label
                htmlFor="education"
                className="mb-2 block text-sm font-medium text-body"
              >
                Education
              </label>

              <input
                id="education"
                name="education"
                type="text"
                value={formData.education}
                onChange={handleChange}
                placeholder="M.Tech Structural Engineering"
                className="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* PROFESSIONAL INTRODUCTION */}

            <div className="md:col-span-2">
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-medium text-body"
              >
                Professional Introduction
              </label>

              <textarea
                id="note"
                name="note"
                rows={4}
                value={formData.note}
                onChange={handleChange}
                placeholder="Write a short professional introduction..."
                className="w-full resize-y rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* PHOTO UPLOAD */}

            <div>
              <label className="mb-2 block text-sm font-medium text-body">
                Profile Photo {!editingId && "*"}
              </label>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-5 text-center transition hover:border-secondary"
              >
                <FaCloudUploadAlt className="mb-2 text-3xl text-primary" />

                <p className="text-sm font-semibold text-heading">
                  Click to upload photo
                </p>

                <p className="mt-1 text-xs text-muted">
                  JPG, PNG, WEBP (Maximum 5MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {photo && (
                <p className="mt-2 break-all text-xs text-muted">
                  Selected: {photo.name}
                </p>
              )}

              {editingId && (
                <p className="mt-2 text-xs text-muted">
                  Leave empty to keep existing photo.
                </p>
              )}
            </div>

            {/* PHOTO PREVIEW */}

            <div>
              <label className="mb-2 block text-sm font-medium text-body">
                Photo Preview
              </label>

              <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {preview ? (
                  <img
                    src={preview}
                    alt="Team member preview"
                    className="h-36 w-full object-contain"
                  />
                ) : (
                  <FaUserTie className="text-4xl text-muted" />
                )}
              </div>
            </div>

            {/* FORM BUTTONS */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row md:col-span-2 md:justify-end">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-body hover:bg-background disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-footer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingId ? <FaEdit /> : <FaPlus />}

                    {editingId
                      ? "Update Member"
                      : "Save Member"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ALL TEAM MEMBERS */}

      <div className="overflow-hidden rounded border border-border bg-surface shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-bold text-heading">
              All Team Members
            </h2>

            <p className="mt-1 text-sm text-muted">
              View and manage your team records.
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full rounded-lg border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">

            <thead className="bg-background">
              <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-4">Team Member</th>
                <th className="px-5 py-4">Designation</th>
                <th className="px-5 py-4">Education</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">

              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <FaSpinner className="mx-auto mb-3 animate-spin text-2xl text-primary" />

                    <p className="text-sm text-muted">
                      Loading team members...
                    </p>
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <FaUsers className="mx-auto mb-3 text-3xl text-muted" />

                    <p className="font-semibold text-heading">
                      No team members found
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {search
                        ? "Try another search."
                        : "Add your first team member to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr
                    key={member._id}
                    className="transition hover:bg-background/70"
                  >

                    {/* MEMBER */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {member.photo?.url ? (
                          <img
                            src={member.photo.url}
                            alt={member.name || "Team member"}
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted">
                            <FaUserTie />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="max-w-48 truncate font-semibold text-heading">
                            {member.name || "Unnamed"}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            Team Member
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DESIGNATION */}

                    <td className="px-5 py-4">
                      <span className="inline-block max-w-48 truncate rounded-full bg-secondary/15 px-3 py-1.5 text-xs font-medium text-body">
                        {member.designation || "—"}
                      </span>
                    </td>

                    {/* EDUCATION */}

                    <td className="px-5 py-4">
                      <span className="text-sm text-body">
                        {member.education || "—"}
                      </span>
                    </td>

                    {/* EMAIL */}

                    <td className="px-5 py-4">
                      <span className="text-sm text-body">
                        {member.workEmail || "—"}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          type="button"
                          onClick={() => setViewMember(member)}
                          title="View profile"
                          aria-label="View profile"
                          className="rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-primary transition hover:bg-blue-100"
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(member)}
                          className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-primary transition hover:bg-slate-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(member._id)}
                          disabled={deletingId === member._id}
                          className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === member._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}

                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-muted">
            Showing {filteredTeam.length} of {team.length} team members
          </p>
        </div>
      </div>

      {/* VIEW MEMBER MODAL */}

      {viewMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-footer/60 p-4 backdrop-blur-sm"
          onClick={() => setViewMember(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="font-bold text-heading">
                Team Member Details
              </h2>

              <button
                type="button"
                onClick={() => setViewMember(null)}
                aria-label="Close profile"
                className="text-muted hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>

            {/* MEMBER DETAILS */}

            <div className="p-6">

              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-secondary/30 bg-background">
                {viewMember.photo?.url ? (
                  <img
                    src={viewMember.photo.url}
                    alt={viewMember.name || "Team member"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaUserTie className="text-4xl text-muted" />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-heading">
                  {viewMember.name}
                </h3>

                <p className="mt-1 text-sm font-semibold text-secondary">
                  {viewMember.designation}
                </p>
              </div>

              <div className="mt-6 space-y-3">

                {/* EMAIL */}

                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 text-muted">
                    <FaEnvelope />
                    <p className="text-xs">Work Email</p>
                  </div>

                  <p className="mt-2 break-all text-sm font-medium text-body">
                    {viewMember.workEmail || "Not provided"}
                  </p>
                </div>

                {/* EDUCATION */}

                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 text-muted">
                    <FaGraduationCap />
                    <p className="text-xs">Education</p>
                  </div>

                  <p className="mt-2 text-sm font-medium text-body">
                    {viewMember.education || "Not provided"}
                  </p>
                </div>

                {/* INTRODUCTION */}

                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 text-muted">
                    <FaUserTie />
                    <p className="text-xs">
                      Professional Introduction
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                    {viewMember.note || "No introduction available."}
                  </p>
                </div>
              </div>

              {/* EDIT BUTTON */}

              <button
                type="button"
                onClick={() => handleEdit(viewMember)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer"
              >
                <FaEdit />
                Edit Member
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Team;
