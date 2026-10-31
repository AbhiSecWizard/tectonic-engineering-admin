
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

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

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/api/blogs/admin/all");

      setBlogs(result.data || []);
      setCounts({ ...EMPTY_COUNTS, ...(result.counts || {}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Search and filter
  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query);

      const matchesStatus =
        filter === "all" || blog.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [blogs, search, filter]);

  // Form field changes
  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be 5 MB or smaller.");
        event.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image.");
        event.target.value = "";
        return;
      }

      setError("");
      setForm((prev) => ({ ...prev, coverImage: file }));
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImagePreview("");
    setEditingId(null);
  };

  // Create blog
  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Edit blog
  const openEditModal = async (id) => {
    try {
      setError("");

      const result = await apiRequest(`/api/blogs/admin/${id}`);
      const blog = result.data;

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
        tags: (blog.tags || []).join(", "),
        metaTitle: blog.metaTitle || "",
        metaDescription: blog.metaDescription || "",
        coverImageAlt: blog.coverImageAlt || "",
        coverImage: null,
      });

      setImagePreview(blog.coverImage?.url || "");
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Create or update blog
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "coverImage") {
          if (value) formData.append(key, value);
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
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update status
  const handleStatusChange = async (id, status) => {
    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setSuccess(result.message || "Status updated.");
      await fetchBlogs();
    } catch (err) {
      setError(err.message);
      await fetchBlogs();
    }
  };

  // Toggle featured
  const handleFeatured = async (id) => {
    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}/featured`, {
        method: "PATCH",
      });

      setSuccess(result.message || "Featured status updated.");
      await fetchBlogs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete blog
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/blogs/${id}`, {
        method: "DELETE",
      });

      setSuccess(result.message || "Blog deleted successfully.");
      await fetchBlogs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <main className="min-h-screen bg-background p-4 text-body sm:p-6 lg:p-8">

      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-secondary">
            Content Management
          </p>

          <h1 className="text-3xl font-bold text-heading">
            Blog Management
          </h1>

          <p className="mt-2 text-sm text-muted">
            Create, edit and manage your website articles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer"
        >
          + Create New Blog
        </button>
      </header>

      {/* Notifications */}
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

      {/* Statistics */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Articles"
          value={blogs.length}
          icon="▤"
        />

        <StatCard
          title="Published"
          value={counts.published}
          icon="✓"
          accent="text-green-700"
        />

        <StatCard
          title="Drafts"
          value={counts.draft}
          icon="✎"
          accent="text-secondary"
        />

        <StatCard
          title="Archived"
          value={counts.archived}
          icon="▣"
          accent="text-muted"
        />
      </section>

      {/* Blog Table */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-heading">
              All Articles
            </h2>
            <p className="mt-1 text-sm text-muted">
              View and manage all your blog publications.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input sm:w-64"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-background text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4">Article</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Views</th>
                <th className="px-5 py-4">Featured</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <TableMessage message="Loading articles..." />
              ) : filteredBlogs.length === 0 ? (
                <TableMessage message="No articles found." />
              ) : (
                filteredBlogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="transition hover:bg-background/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {blog.coverImage?.url ? (
                          <img
                            src={blog.coverImage.url}
                            alt={blog.coverImageAlt || blog.title}
                            className="h-14 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-background text-xs text-muted">
                            No Image
                          </div>
                        )}

                        <div className="max-w-xs">
                          <p className="font-semibold text-heading">
                            {blog.title}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {blog.author || "Tectonic Engineering"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {blog.category}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={blog.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {blog.views || 0}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleFeatured(blog._id)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                          blog.isFeatured
                            ? "bg-secondary/15 text-primary"
                            : "bg-background text-muted"
                        }`}
                      >
                        {blog.isFeatured ? "★ Featured" : "☆ Feature"}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openEditModal(blog._id)}
                          className="rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                        >
                          Edit
                        </button>

                        <select
                          value={blog.status}
                          onChange={(e) =>
                            handleStatusChange(blog._id, e.target.value)
                          }
                          className="rounded-md border border-border bg-surface px-2 py-2 text-xs text-body"
                          aria-label={`Change status of ${blog.title}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>

                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
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

        <div className="border-t border-border px-5 py-4 text-sm text-muted">
          Showing {filteredBlogs.length} of {blogs.length} articles
        </div>
      </section>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-footer/70 p-3 py-8 sm:p-6">
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-xl bg-surface shadow-2xl">

            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold text-heading">
                  {editingId ? "Edit Article" : "Create New Article"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Enter your blog details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-2xl text-muted hover:text-heading"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Blog Title *">
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className="form-input"
                    placeholder="Enter blog title"
                  />
                </FormField>

                <FormField label="Slug">
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Auto-generated if empty"
                  />
                </FormField>

                <FormField label="Category *">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="form-input"
                    required
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
                    onChange={handleChange}
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField label="Short Description *">
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  required
                  maxLength={300}
                  rows={3}
                  className="form-input"
                  placeholder="Write a short article description..."
                />
              </FormField>

              <FormField label="Full Blog Content">
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={8}
                  className="form-input"
                  placeholder="Write your complete article..."
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Publication Status">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className="form-input"
                    placeholder="engineering, design, construction"
                  />
                </FormField>
              </div>

              <FormField label="Cover Image (Maximum 5 MB)">
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-border p-3 text-sm text-body"
                />

                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="mt-3 h-44 w-full rounded-lg object-cover sm:w-72"
                  />
                )}
              </FormField>

              <FormField label="Image Alt Text">
                <input
                  name="coverImageAlt"
                  value={form.coverImageAlt}
                  onChange={handleChange}
                  maxLength={150}
                  className="form-input"
                  placeholder="Describe the image"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="SEO Meta Title">
                  <input
                    name="metaTitle"
                    value={form.metaTitle}
                    onChange={handleChange}
                    maxLength={70}
                    className="form-input"
                    placeholder="SEO title"
                  />
                </FormField>

                <FormField label="SEO Meta Description">
                  <textarea
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={handleChange}
                    maxLength={160}
                    rows={2}
                    className="form-input"
                    placeholder="SEO description"
                  />
                </FormField>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 accent-[#223F79]"
                />
                <span className="text-sm font-medium text-body">
                  Mark this article as featured
                </span>
              </label>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-footer disabled:cursor-not-allowed disabled:opacity-60"
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
      )}
    </main>
  );
}

// Reusable components

function StatCard({ title, value, icon, accent = "text-heading" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <span className={`text-xl ${accent}`}>{icon}</span>
      </div>
      <h3 className={`mt-3 text-3xl font-bold ${accent}`}>{value}</h3>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: "bg-green-100 text-green-700",
    draft: "bg-secondary/15 text-primary",
    archived: "bg-background text-muted",
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
}

function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-heading">
        {label}
      </label>
      {children}
    </div>
  );
}

function Notification({ type, message, onClose }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  return (
    <div className={`mb-5 flex items-center justify-between rounded-lg border p-4 text-sm ${styles}`}>
      <p>{message}</p>
      <button
        onClick={onClose}
        className="ml-4 text-lg font-bold"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

function TableMessage({ message }) {
  return (
    <tr>
      <td colSpan="6" className="p-12 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}
