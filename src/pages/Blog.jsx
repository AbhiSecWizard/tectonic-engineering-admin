
import { useCallback, useEffect, useMemo, useState } from "react";

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar,
  FaRegStar,
  FaEye,
  FaFileAlt,
  FaCheckCircle,
  FaArchive,
  FaTimes,
  FaImage,
} from "react-icons/fa";

import { MdSearch } from "react-icons/md";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const CATEGORIES = [
  "Design",
  "Peer Review",
  "Value Engineering",
  "Structural Audit",
  "Steel Detailing",
  "Cost Optimisation",
  "Case Study",
  "News",
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  category: "Design",
  author: "Tectonic Engineering",
  content: "",
  status: "draft",
  isFeatured: false,
  tags: "",
  metaTitle: "",
  metaDescription: "",
  coverImageAlt: "",
  coverImage: null,
};

const EMPTY_COUNTS = {
  draft: 0,
  published: 0,
  archived: 0,
};

// ==========================================
// API HELPER
// ==========================================

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
};

// ==========================================
// MAIN BLOG COMPONENT
// ==========================================

const Blog = () => {
  // Blog data
  const [blogs, setBlogs] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filters
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");

  // ========================================
  // FETCH BLOGS
  // ========================================

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/api/blogs/admin/all");

      setBlogs(Array.isArray(result.data) ? result.data : []);

      setCounts({
        ...EMPTY_COUNTS,
        ...(result.counts || {}),
      });
    } catch (err) {
      setError(err.message || "Unable to fetch blogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // ========================================
  // CLEANUP IMAGE PREVIEW URL
  // ========================================

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" || blog.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [blogs, search, filter]);

  // ========================================
  // FORM HANDLING
  // ========================================

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    // Image upload
    if (type === "file") {
      const file = files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image.");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setError("Image size must be 5 MB or smaller.");
        event.target.value = "";
        return;
      }

      setError("");

      setForm((prev) => ({
        ...prev,
        coverImage: file,
      }));

      setImagePreview(URL.createObjectURL(file));

      return;
    }

    // Other fields
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setImagePreview("");
    setEditingId(null);
  };

  // ========================================
  // OPEN CREATE MODAL
  // ========================================

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = async (id) => {
    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/admin/${id}`);

      const blog = result.data;

      if (!blog) {
        throw new Error("Blog not found.");
      }

      setEditingId(id);

      setForm({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        category: blog.category || "Design",
        author: blog.author || "Tectonic Engineering",
        content: blog.content || "",
        status: blog.status || "draft",
        isFeatured: Boolean(blog.isFeatured),
        tags: Array.isArray(blog.tags)
          ? blog.tags.join(", ")
          : blog.tags || "",
        metaTitle: blog.metaTitle || "",
        metaDescription: blog.metaDescription || "",
        coverImageAlt: blog.coverImageAlt || "",
        coverImage: null,
      });

      setImagePreview(blog.coverImage?.url || "");

      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load blog.");
    }
  };

  // ========================================
  // CREATE / UPDATE BLOG
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "coverImage") {
          if (value) {
            formData.append(key, value);
          }

          return;
        }

        formData.append(key, String(value));
      });

      const path = editingId
        ? `/api/blogs/${editingId}`
        : "/api/blogs";

      const result = await apiRequest(path, {
        method: editingId ? "PUT" : "POST",
        body: formData,
      });

      setSuccess(
        result.message ||
          (editingId
            ? "Blog updated successfully."
            : "Blog created successfully.")
      );

      setIsModalOpen(false);
      resetForm();

      await fetchBlogs();
    } catch (err) {
      setError(err.message || "Unable to save blog.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // UPDATE BLOG STATUS
  // ========================================

  const handleStatusChange = async (id, status) => {
    try {
      setActionId(id);
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      setSuccess(result.message || "Status updated successfully.");

      await fetchBlogs();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setActionId(null);
    }
  };

  // ========================================
  // TOGGLE FEATURED
  // ========================================

  const handleFeatured = async (id) => {
    try {
      setActionId(id);
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}/featured`, {
        method: "PATCH",
      });

      setSuccess(result.message || "Featured status updated.");

      await fetchBlogs();
    } catch (err) {
      setError(err.message || "Unable to update featured status.");
    } finally {
      setActionId(null);
    }
  };

  // ========================================
  // DELETE BLOG
  // ========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog?"
    );

    if (!confirmed) return;

    try {
      setActionId(id);
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}`, {
        method: "DELETE",
      });

      setSuccess(result.message || "Blog deleted successfully.");

      await fetchBlogs();
    } catch (err) {
      setError(err.message || "Unable to delete blog.");
    } finally {
      setActionId(null);
    }
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    resetForm();
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="space-y-7 text-[#273444]">

      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#D99A32]">
            Content Management
          </p>

          <h1 className="text-2xl font-bold text-[#223F79] sm:text-3xl">
            Blog Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, edit and manage your website articles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#223F79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172B50]"
        >
          <FaPlus />
          Create New Blog
        </button>

      </section>

      {/* NOTIFICATIONS */}
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {success && (
        <Notification
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Articles"
          value={blogs.length}
          icon={<FaFileAlt />}
        />

        <StatCard
          title="Published"
          value={counts.published}
          icon={<FaCheckCircle />}
          color="text-green-600"
        />

        <StatCard
          title="Drafts"
          value={counts.draft}
          icon={<FaEdit />}
          color="text-[#D99A32]"
        />

        <StatCard
          title="Archived"
          value={counts.archived}
          icon={<FaArchive />}
          color="text-slate-500"
        />

      </section>

      {/* BLOG TABLE */}
      <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">

          <div>
            <h2 className="text-lg font-bold text-[#223F79]">
              All Articles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all your blog publications.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#223F79] sm:w-64"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#223F79] sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-[#F3F5F8] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Article</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Featured</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <TableMessage message="Loading articles..." />
              ) : filteredBlogs.length === 0 ? (
                <TableMessage message="No articles found." />
              ) : (
                filteredBlogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* ARTICLE */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        {blog.coverImage?.url ? (
                          <img
                            src={blog.coverImage.url}
                            alt={blog.coverImageAlt || blog.title}
                            className="h-14 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <FaImage size={20} />
                          </div>
                        )}

                        <div className="max-w-xs">
                          <p className="font-semibold text-[#223F79]">
                            {blog.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {blog.author || "Tectonic Engineering"}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td className="px-5 py-4 text-sm">
                      {blog.category}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <StatusBadge status={blog.status} />
                    </td>

                    {/* VIEWS */}
                
                    {/* FEATURED */}
                    <td className="px-5 py-4">

                      <button
                        type="button"
                        disabled={actionId === blog._id}
                        onClick={() => handleFeatured(blog._id)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                          blog.isFeatured
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {blog.isFeatured ? <FaStar /> : <FaRegStar />}

                        {blog.isFeatured ? "Featured" : "Feature"}
                      </button>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          disabled={actionId === blog._id}
                          onClick={() => openEditModal(blog._id)}
                          className="rounded-md bg-blue-50 p-2 text-[#223F79] transition hover:bg-blue-100 disabled:opacity-50"
                          aria-label="Edit blog"
                        >
                          <FaEdit />
                        </button>

                        <select
                          value={blog.status}
                          disabled={actionId === blog._id}
                          onChange={(e) =>
                            handleStatusChange(blog._id, e.target.value)
                          }
                          aria-label={`Change status of ${blog.title}`}
                          className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-[#223F79] disabled:opacity-50"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>

                        <button
                          type="button"
                          disabled={actionId === blog._id}
                          onClick={() => handleDelete(blog._id)}
                          className="rounded-md bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          aria-label="Delete blog"
                        >
                          <FaTrash />
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
        <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          Showing {filteredBlogs.length} of {blogs.length} articles
        </div>

      </section>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <BlogModal
          form={form}
          imagePreview={imagePreview}
          editingId={editingId}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

    </div>
  );
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  title,
  value,
  icon,
  color = "text-[#223F79]",
}) => {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className={`text-xl ${color}`}>
          {icon}
        </span>

      </div>

      <h3 className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </h3>

    </div>
  );
};

// ==========================================
// STATUS BADGE
// ==========================================

const StatusBadge = ({ status }) => {
  const styles = {
    published: "bg-green-100 text-green-700",
    draft: "bg-amber-100 text-amber-700",
    archived: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {status}
    </span>
  );
};

// ==========================================
// FORM FIELD
// ==========================================

const FormField = ({ label, children }) => {
  return (
    <div className="space-y-2">

      <label className="block text-sm font-semibold text-[#223F79]">
        {label}
      </label>

      {children}

    </div>
  );
};

// ==========================================
// BLOG MODAL
// ==========================================

const BlogModal = ({
  form,
  imagePreview,
  editingId,
  saving,
  onChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#172B50]/70 p-3 py-8 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >

      <div className="my-auto w-full max-w-3xl overflow-hidden rounded bg-white shadow-2xl">

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="text-xl font-bold text-[#223F79]">
              {editingId ? "Edit Article" : "Create New Article"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your blog details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#223F79] disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>

        </div>

        {/* MODAL FORM */}
        <form onSubmit={onSubmit} className="space-y-5 p-5">

          {/* BASIC DETAILS */}
          <div className="grid gap-4 sm:grid-cols-2">

            <FormField label="Blog Title *">
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                required
                maxLength={150}
                placeholder="Enter blog title"
                className="form-input"
              />
            </FormField>

            <FormField label="Slug">
              <input
                name="slug"
                value={form.slug}
                onChange={onChange}
                placeholder="Auto-generated if empty"
                className="form-input"
              />
            </FormField>

            <FormField label="Category *">
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                required
                className="form-input"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Author">
              <input
                name="author"
                value={form.author}
                onChange={onChange}
                className="form-input"
              />
            </FormField>

          </div>

          {/* DESCRIPTION */}
          <FormField label="Short Description *">
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={onChange}
              required
              maxLength={300}
              rows={3}
              placeholder="Write a short article description..."
              className="form-input"
            />
          </FormField>

          {/* CONTENT */}
          <FormField label="Full Blog Content">
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              rows={8}
              placeholder="Write your complete article..."
              className="form-input"
            />
          </FormField>

          {/* STATUS AND TAGS */}
          <div className="grid gap-4 sm:grid-cols-2">

            <FormField label="Publication Status">
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>

            <FormField label="Tags">
              <input
                name="tags"
                value={form.tags}
                onChange={onChange}
                placeholder="engineering, design, construction"
                className="form-input"
              />
            </FormField>

          </div>

          {/* COVER IMAGE */}
          <FormField label="Cover Image (Maximum 5 MB)">

            <input
              type="file"
              name="coverImage"
              accept="image/*"
              onChange={onChange}
              className="block w-full rounded-lg border border-slate-200 p-3 text-sm"
            />

            {imagePreview && (
              <div className="mt-3">

                <p className="mb-2 text-xs font-medium text-slate-500">
                  Image Preview
                </p>

                <img
                  src={imagePreview}
                  alt="Blog cover preview"
                  className="h-44 w-full rounded-lg object-cover sm:w-72"
                />

              </div>
            )}

          </FormField>

          {/* IMAGE ALT */}
          <FormField label="Image Alt Text">
            <input
              name="coverImageAlt"
              value={form.coverImageAlt}
              onChange={onChange}
              maxLength={150}
              placeholder="Describe the image"
              className="form-input"
            />
          </FormField>

          {/* SEO */}
          <div className="grid gap-4 sm:grid-cols-2">

            <FormField label="SEO Meta Title">
              <input
                name="metaTitle"
                value={form.metaTitle}
                onChange={onChange}
                maxLength={70}
                placeholder="SEO title"
                className="form-input"
              />
            </FormField>

            <FormField label="SEO Meta Description">
              <textarea
                name="metaDescription"
                value={form.metaDescription}
                onChange={onChange}
                maxLength={160}
                rows={2}
                placeholder="SEO description"
                className="form-input"
              />
            </FormField>

          </div>

          {/* FEATURED */}
          <label className="flex cursor-pointer items-center gap-3">

            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={onChange}
              className="h-4 w-4 accent-[#223F79]"
            />

            <span className="text-sm font-medium text-slate-700">
              Mark this article as featured
            </span>

          </label>

          {/* FOOTER BUTTONS */}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#223F79] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172B50] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Article"
                  : "Create Article"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

// ==========================================
// NOTIFICATION
// ==========================================

const Notification = ({ type, message, onClose }) => {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  return (
    <div
      role="alert"
      className={`flex items-center justify-between rounded-lg border p-4 text-sm ${styles}`}
    >
      <p>{message}</p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="ml-4 text-lg font-bold"
      >
        <FaTimes />
      </button>
    </div>
  );
};

// ==========================================
// TABLE MESSAGE
// ==========================================

const TableMessage = ({ message }) => {
  return (
    <tr>
      <td
        colSpan={6}
        className="p-12 text-center text-sm text-slate-500"
      >
        {message}
      </td>
    </tr>
  );
};

export default Blog;
