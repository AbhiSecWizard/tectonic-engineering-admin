
import { useEffect, useRef, useState } from "react";
import {
  FaPlus,
  FaImages,
  FaImage,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
  FaSpinner,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
} from "react-icons/fa";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const GALLERY_API = `${API_URL}/api/gallery`;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
// DATE FORMATTER
// ==========================================

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// MAIN GALLERY COMPONENT
// ==========================================

const Gallery = () => {
  // ----------------------------------------
  // STATES
  // ----------------------------------------

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewImage, setViewImage] = useState(null);

  const [imageName, setImageName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  // ----------------------------------------
  // NOTIFICATION HELPER
  // ----------------------------------------

  const showNotification = (type, text) => {
    setMessage({ type, text });
  };

  const clearNotification = () => {
    setMessage({ type: "", text: "" });
  };

  // ----------------------------------------
  // FETCH GALLERY
  // ----------------------------------------

  const fetchGallery = async () => {
    try {
      setLoading(true);

      const result = await apiRequest(GALLERY_API);

      setGallery(
        Array.isArray(result.data) ? result.data : []
      );

      clearNotification();
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
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
  // RESET FORM
  // ----------------------------------------

  const resetForm = () => {
    clearPreview();

    setImageName("");
    setImage(null);
    setPreview("");
    setEditingId(null);
    setShowForm(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ----------------------------------------
  // ADD NEW IMAGE
  // ----------------------------------------

  const handleAddNew = () => {
    resetForm();
    clearNotification();
    setShowForm(true);
  };

  // ----------------------------------------
  // EDIT IMAGE
  // ----------------------------------------

  const handleEdit = (item) => {
    clearPreview();

    setEditingId(item._id);
    setImageName(item.imageName || "");
    setImage(null);
    setPreview(item.image?.url || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setShowForm(true);
    setViewImage(null);

    clearNotification();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------------
  // IMAGE VALIDATION & PREVIEW
  // ----------------------------------------

  const handleImageChange = (e) => {
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

    if (file.size > MAX_IMAGE_SIZE) {
      showNotification(
        "error",
        "Image size should not exceed 5MB."
      );

      e.target.value = "";
      return;
    }

    clearPreview();

    const imageUrl = URL.createObjectURL(file);

    previewUrlRef.current = imageUrl;

    setImage(file);
    setPreview(imageUrl);

    clearNotification();
  };

  // ----------------------------------------
  // CREATE / UPDATE IMAGE
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageName.trim()) {
      showNotification("error", "Please enter image name.");
      return;
    }

    if (!editingId && !image) {
      showNotification("error", "Please select an image.");
      return;
    }

    try {
      setSaving(true);
      clearNotification();

      const formData = new FormData();

      formData.append("imageName", imageName.trim());

      if (image) {
        formData.append("image", image);
      }

      const url = editingId
        ? `${GALLERY_API}/${editingId}`
        : GALLERY_API;

      const result = await apiRequest(url, {
        method: editingId ? "PUT" : "POST",
        body: formData,
      });

      resetForm();

      await fetchGallery();

      showNotification(
        "success",
        result.message ||
          (editingId
            ? "Gallery image updated successfully."
            : "Gallery image uploaded successfully.")
      );
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // DELETE IMAGE
  // ----------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this gallery image?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      clearNotification();

      const result = await apiRequest(
        `${GALLERY_API}/${id}`,
        {
          method: "DELETE",
        }
      );

      setGallery((prev) =>
        prev.filter((item) => item._id !== id)
      );

      if (viewImage?._id === id) {
        setViewImage(null);
      }

      showNotification(
        "success",
        result.message || "Gallery image deleted successfully."
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

  const filteredGallery = gallery.filter((item) => {
    const query = search.trim().toLowerCase();

    return (item.imageName || "")
      .toLowerCase()
      .includes(query);
  });

  // ----------------------------------------
  // STATISTICS
  // ----------------------------------------

  const currentDate = new Date();

  const thisMonth = gallery.filter((item) => {
    if (!item.createdAt) return false;

    const date = new Date(item.createdAt);

    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  const namedImages = gallery.filter(
    (item) => item.imageName?.trim()
  ).length;

  const latestUpload = gallery.reduce((latest, item) => {
    if (!item.createdAt) return latest;

    const date = new Date(item.createdAt);

    if (Number.isNaN(date.getTime())) return latest;

    return !latest || date > latest ? date : latest;
  }, null);

  const stats = [
    {
      title: "Total Images",
      value: gallery.length,
      icon: <FaImages />,
      color: "text-primary",
    },
    {
      title: "Added This Month",
      value: thisMonth,
      icon: <FaCalendarAlt />,
      color: "text-green-600",
    },
    {
      title: "Named Images",
      value: namedImages,
      icon: <FaImage />,
      color: "text-secondary",
    },
    {
      title: "Latest Upload",
      value: latestUpload
        ? formatDate(latestUpload)
        : "—",
      icon: <FaCheckCircle />,
      color: "text-primary",
      small: true,
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
            Gallery Management
          </h1>

          <p className="mt-2 text-sm text-muted">
            Manage your company project images and gallery.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer"
        >
          <FaPlus />
          Add New Image
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

            <h2
              className={`mt-4 font-bold ${stat.color} ${
                stat.small ? "text-xl" : "text-3xl"
              }`}
            >
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
                  ? "Edit Gallery Image"
                  : "Add New Gallery Image"}
              </h2>

              <p className="mt-1 text-xs text-muted">
                Upload and manage your project images.
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
            {/* IMAGE NAME */}

            <div className="md:col-span-2">
              <label
                htmlFor="imageName"
                className="mb-2 block text-sm font-medium text-body"
              >
                Image Name *
              </label>

              <input
                id="imageName"
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g. Structural Steel Project"
                required
                maxLength={150}
                className="w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* IMAGE UPLOAD */}

            <div>
              <label className="mb-2 block text-sm font-medium text-body">
                Upload Image {!editingId && "*"}
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
                className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-5 text-center transition hover:border-secondary"
              >
                <FaCloudUploadAlt className="mb-2 text-3xl text-primary" />

                <p className="text-sm font-semibold text-heading">
                  Click to upload image
                </p>

                <p className="mt-1 text-xs text-muted">
                  JPG, PNG, WEBP (Maximum 5MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {image && (
                <p className="mt-2 break-all text-xs text-muted">
                  Selected: {image.name}
                </p>
              )}

              {editingId && (
                <p className="mt-2 text-xs text-muted">
                  Leave empty to keep existing image.
                </p>
              )}
            </div>

            {/* IMAGE PREVIEW */}

            <div>
              <label className="mb-2 block text-sm font-medium text-body">
                Image Preview
              </label>

              <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {preview ? (
                  <img
                    src={preview}
                    alt="Gallery preview"
                    className="h-40 w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted">
                    <FaImage className="mx-auto mb-2 text-4xl" />

                    <p className="text-xs">
                      Image preview will appear here
                    </p>
                  </div>
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
                      ? "Update Image"
                      : "Save Image"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GALLERY TABLE */}

      <div className="overflow-hidden rounded border border-border bg-surface shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-bold text-heading">
              All Gallery Images
            </h2>

            <p className="mt-1 text-sm text-muted">
              View and manage your gallery records.
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images..."
              className="w-full rounded-lg border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left">

            <thead className="bg-background">
              <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-4">Image</th>
                <th className="px-5 py-4">Image Name</th>
                <th className="px-5 py-4">Uploaded</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">

              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <FaSpinner className="mx-auto mb-3 animate-spin text-2xl text-primary" />

                    <p className="text-sm text-muted">
                      Loading gallery...
                    </p>
                  </td>
                </tr>
              ) : filteredGallery.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <FaImages className="mx-auto mb-3 text-3xl text-muted" />

                    <p className="font-semibold text-heading">
                      No gallery images found
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {search
                        ? "Try another search."
                        : "Upload your first gallery image."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGallery.map((item) => (
                  <tr
                    key={item._id}
                    className="transition hover:bg-background/70"
                  >
                    {/* THUMBNAIL */}

                    <td className="px-5 py-4">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.imageName || "Gallery image"}
                          loading="lazy"
                          className="h-14 w-16 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-border bg-background text-muted">
                          <FaImage />
                        </div>
                      )}
                    </td>

                    {/* NAME */}

                    <td className="px-5 py-4">
                      <p className="font-semibold text-heading">
                        {item.imageName || "Untitled"}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Gallery Image
                      </p>
                    </td>

                    {/* DATE */}

                    <td className="px-5 py-4">
                      <span className="text-sm text-body">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>

                    {/* TYPE */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary/15 px-3 py-1.5 text-xs font-medium text-body">
                        Image
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          type="button"
                          onClick={() => setViewImage(item)}
                          title="Preview image"
                          aria-label="Preview image"
                          className="rounded-md bg-blue-50 px-3 py-2 text-xs text-primary transition hover:bg-blue-100"
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-primary transition hover:bg-slate-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === item._id ? (
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
            Showing {filteredGallery.length} of {gallery.length} images
          </p>
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}

      {viewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-footer/70 p-4 backdrop-blur-sm"
          onClick={() => setViewImage(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="font-bold text-heading">
                  Image Preview
                </h2>

                <p className="mt-1 text-xs text-muted">
                  {viewImage.imageName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewImage(null)}
                aria-label="Close preview"
                className="text-muted transition hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL IMAGE */}

            <div className="bg-background p-4">
              {viewImage.image?.url ? (
                <img
                  src={viewImage.image.url}
                  alt={viewImage.imageName || "Gallery image"}
                  className="mx-auto max-h-[60vh] w-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-muted">
                  <FaImage className="text-5xl" />
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-heading">
                  {viewImage.imageName}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Uploaded: {formatDate(viewImage.createdAt)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(viewImage)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-footer"
                >
                  <FaEdit />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setViewImage(null)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-body hover:bg-background"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Gallery;
