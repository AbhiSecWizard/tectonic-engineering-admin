import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const CATEGORIES = [
  "Statues",
  "Industrial & Energy",
  "Railway",
  "Commercial",
  "Residential",
  "Infrastructure",
];

const SERVICES = [
  "Structural Design & Drafting",
  "Structural Peer Review",
  "Value Engineering",
  "Structural Audit",
  "Cost Optimisation",
  "BOQ & Bar Bending Schedule",
  "Detail Fabrication Drawing",
  "General Arrangement Drawing",
  "Connection Design",
];

const STRUCTURE_TYPES = ["RCC", "Steel", "PEB", "Composite", "Other"];

const SOFTWARE = [
  "STAAD Pro",
  "ETABS",
  "SAFE",
  "AutoCAD",
  "Tekla Structures",
  "IDEA StatiCa",
];

const STATUSES = ["Upcoming", "Ongoing", "On Hold", "Completed", "Cancelled"];

const CURRENCIES = [
  ["INR", "INR - Indian Rupee"],
  ["USD", "USD - US Dollar"],
  ["EUR", "EUR - Euro"],
  ["GBP", "GBP - British Pound"],
];

const EMPTY_FORM = {
  code: "",
  name: "",
  client: "",
  category: "",
  structureType: "",
  description: "",
  services: [],
  location: { city: "", state: "", country: "India" },
  specs: { size: "", floors: "" },
  status: "Upcoming",
  startDate: "",
  expectedEndDate: "",
  completedDate: "",
  contractValue: "",
  currency: "INR",
  contactPerson: { name: "", phone: "", email: "" },
  softwareUsed: [],
  showOnWebsite: false,
  notes: "",
};

const statusStyles = {
  Upcoming: "bg-blue-50 text-blue-700",
  Ongoing: "bg-emerald-50 text-emerald-700",
  "On Hold": "bg-amber-50 text-amber-700",
  Completed: "bg-purple-50 text-purple-700",
  Cancelled: "bg-red-50 text-red-700",
};

const inputClass =
  "form-input w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

/* ------------------------------------------------------------------ */
/* Helpers (module level, so they are never re-created on render)      */
/* ------------------------------------------------------------------ */

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value, currency = "INR") => {
  if (value === undefined || value === null || value === "") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const getImageUrl = (image) =>
  typeof image === "string" ? image : image?.url || "";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const revokeUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`,{...options, credentials: "include"});
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
};

/* ------------------------------------------------------------------ */
/* Small UI components                                                 */
/*                                                                     */
/* IMPORTANT: these must live OUTSIDE the Projects component. When     */
/* they were declared inside it, every keystroke created a new         */
/* component type, React remounted the inputs, and focus was lost.     */
/* ------------------------------------------------------------------ */

const Field = ({ label, required, children }) => (
  <label className="block space-y-2">
    <span className="block text-sm font-semibold text-heading">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    {children}
  </label>
);

// For controls that contain several buttons (a <label> would hijack clicks)
const FieldGroup = ({ label, children }) => (
  <div className="space-y-2">
    <p className="block text-sm font-semibold text-heading">{label}</p>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="mb-5 border-b border-border pb-3">
    <h3 className="text-base font-bold text-heading">{children}</h3>
  </div>
);

const SelectField = ({ label, required, options, placeholder, ...props }) => (
  <Field label={label} required={required}>
    <select required={required} className={inputClass} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const [value, text] = Array.isArray(option)
          ? option
          : [option, option];
        return (
          <option key={value} value={value}>
            {text}
          </option>
        );
      })}
    </select>
  </Field>
);

const CheckboxGrid = ({ options, selected, onToggle, className }) => (
  <div className={className}>
    {options.map((option) => (
      <label
        key={option}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm text-body transition hover:border-primary/40 hover:bg-primary/5"
      >
        <input
          type="checkbox"
          checked={selected.includes(option)}
          onChange={() => onToggle(option)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span>{option}</span>
      </label>
    ))}
  </div>
);

const ProjectViewModal = ({ project, onClose, onEdit }) => {
  const location = [
    project.location?.city,
    project.location?.state,
    project.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const details = [
    ["Category", project.category],
    ["Structure", project.structureType],
    ["Status", project.status],
    ["Location", location],
    ["Project Size", project.specs?.size],
    ["Floors", project.specs?.floors],
    ["Start Date", formatDate(project.startDate)],
    ["Expected End", formatDate(project.expectedEndDate)],
    ["Completed On", formatDate(project.completedDate)],
    ["Contract Value", formatCurrency(project.contractValue, project.currency)],
    ["Website Visibility", project.showOnWebsite ? "Visible" : "Hidden"],
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-xl font-bold text-heading">Project Details</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-2xl text-muted hover:text-red-600"
          >
            ×
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
          {project.coverImage?.url && (
            <img
              src={project.coverImage.url}
              alt={project.name}
              className="h-64 w-full rounded object-cover"
            />
          )}

          <div>
            <h3 className="text-2xl font-bold text-heading">{project.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {project.code || "No project code"} · {project.client}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-background p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-heading">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-bold text-heading">Description</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
              {project.description || "No description available."}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-heading">Services</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {(project.services || []).map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-primary/5 px-3 py-1.5 text-xs text-primary"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-heading">Software Used</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {(project.softwareUsed || []).map((software) => (
                <span
                  key={software}
                  className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs text-heading"
                >
                  {software}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-heading">Contact Person</h4>
            <p className="mt-2 text-sm text-body">
              {project.contactPerson?.name || "—"}
            </p>
            <p className="text-sm text-muted">
              {project.contactPerson?.phone || ""}
            </p>
            <p className="text-sm text-muted">
              {project.contactPerson?.email || ""}
            </p>
          </div>

          {project.images?.length > 0 && (
            <div>
              <h4 className="font-bold text-heading">Project Gallery</h4>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.images.map((image) => (
                  <img
                    key={image.publicId || image.url}
                    src={image.url}
                    alt="Project"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {project.notes && (
            <div>
              <h4 className="font-bold text-heading">Internal Notes</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                {project.notes}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-5 text-right">
          <button
            type="button"
            onClick={() => onEdit(project._id)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Edit Project
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [existingCover, setExistingCover] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);

  // New gallery uploads: [{ id, file, url }]
  const [galleryItems, setGalleryItems] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);

  const [viewProject, setViewProject] = useState(null);

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const galleryIdRef = useRef(0);

  // Latest preview URLs, so they can be revoked on unmount
  const coverPreviewRef = useRef("");
  const galleryItemsRef = useRef([]);
  coverPreviewRef.current = coverPreview;
  galleryItemsRef.current = galleryItems;

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  /* ---------- Cleanup object URLs on unmount ---------- */

  useEffect(
    () => () => {
      revokeUrl(coverPreviewRef.current);
      galleryItemsRef.current.forEach((item) => revokeUrl(item.url));
    },
    []
  );

  /* ---------- Debounce the search box ---------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------- Fetch projects (aborts stale requests) ---------- */

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (statusFilter) params.set("status", statusFilter);

        const result = await apiRequest(`/api/projects?${params}`, {
          signal: controller.signal,
        });

        const totalPages = result.pages || 1;

        setProjects(result.data || []);
        setTotal(result.total || 0);
        setPages(totalPages);

        // Current page no longer exists (e.g. after deleting the last item)
        if (page > totalPages) setPage(totalPages);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [page, search, categoryFilter, statusFilter, reloadKey]);

  /* ---------- Dashboard counts (current page only, except total) ---------- */

  const stats = useMemo(
    () => ({
      total,
      ongoing: projects.filter((p) => p.status === "Ongoing").length,
      completed: projects.filter((p) => p.status === "Completed").length,
      upcoming: projects.filter((p) => p.status === "Upcoming").length,
    }),
    [projects, total]
  );

  /* ---------- Form helpers ---------- */

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateNestedField = (parent, field, value) =>
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));

  const toggleArrayValue = (field, value) =>
    setForm((prev) => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });

  const bind = (field) => ({
    value: form[field],
    onChange: (e) => updateField(field, e.target.value),
  });

  const bindNested = (parent, field) => ({
    value: form[parent][field],
    onChange: (e) => updateNestedField(parent, field, e.target.value),
  });

  /* ---------- Reset / open / close ---------- */

  const resetForm = () => {
    revokeUrl(coverPreviewRef.current);
    galleryItemsRef.current.forEach((item) => revokeUrl(item.url));

    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setCoverFile(null);
    setCoverPreview("");
    setExistingCover(null);
    setRemoveCover(false);
    setGalleryItems([]);
    setExistingImages([]);
    setRemoveImages([]);

    if (coverInputRef.current) coverInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = async (id) => {
    try {
      setError("");

      const result = await apiRequest(`/api/projects/${id}`);
      const project = result.data;

      resetForm();
      setViewProject(null);
      setEditingId(project._id);

      setForm({
        ...EMPTY_FORM,
        ...project,
        location: { ...EMPTY_FORM.location, ...(project.location || {}) },
        specs: { ...EMPTY_FORM.specs, ...(project.specs || {}) },
        contactPerson: {
          ...EMPTY_FORM.contactPerson,
          ...(project.contactPerson || {}),
        },
        services: project.services || [],
        softwareUsed: project.softwareUsed || [],
        startDate: toDateInput(project.startDate),
        expectedEndDate: toDateInput(project.expectedEndDate),
        completedDate: toDateInput(project.completedDate),
        contractValue: project.contractValue ?? "",
        showOnWebsite: Boolean(project.showOnWebsite),
      });

      setExistingCover(project.coverImage || null);
      setCoverPreview(getImageUrl(project.coverImage));
      setExistingImages(project.images || []);

      setModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------- Escape closes whichever modal is on top ---------- */

  useEffect(() => {
    if (!modalOpen && !viewProject) return undefined;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (modalOpen) closeModal();
      else setViewProject(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, viewProject, closeModal]);

  /* ---------- Cover image ---------- */

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      event.target.value = "";
      return;
    }

    revokeUrl(coverPreviewRef.current);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    revokeUrl(coverPreviewRef.current);
    setRemoveCover(true);
    setCoverFile(null);
    setCoverPreview("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleUndoRemoveCover = () => {
    setRemoveCover(false);
    setCoverPreview(getImageUrl(existingCover));
  };

  /* ---------- Gallery images ---------- */

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    setGalleryItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: ++galleryIdRef.current,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = "";
  };

  const removeNewGalleryImage = (id) => {
    setGalleryItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeUrl(target.url);
      return prev.filter((item) => item.id !== id);
    });
  };

  const removeExistingGalleryImage = (image) => {
    setExistingImages((prev) =>
      prev.filter((item) => item.publicId !== image.publicId)
    );
    setRemoveImages((prev) =>
      prev.includes(image.publicId) ? prev : [...prev, image.publicId]
    );
  };

  /* ---------- Create / update ---------- */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.client.trim() || !form.category) {
      alert("Project name, client and category are required.");
      return;
    }

    if (!form.services.length) {
      alert("Please select at least one service.");
      return;
    }

    if (
      form.startDate &&
      form.expectedEndDate &&
      form.expectedEndDate < form.startDate
    ) {
      alert("Expected end date cannot be before the start date.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("code", form.code.trim());
      formData.append("name", form.name.trim());
      formData.append("client", form.client.trim());
      formData.append("category", form.category);
      formData.append("structureType", form.structureType);
      formData.append("description", form.description);
      formData.append("status", form.status);
      formData.append("currency", form.currency);
      formData.append("showOnWebsite", String(form.showOnWebsite));
      formData.append("notes", form.notes);

      formData.append("services", JSON.stringify(form.services));
      formData.append("softwareUsed", JSON.stringify(form.softwareUsed));
      formData.append("location", JSON.stringify(form.location));
      formData.append("specs", JSON.stringify(form.specs));
      formData.append("contactPerson", JSON.stringify(form.contactPerson));

      formData.append("startDate", form.startDate);
      formData.append("expectedEndDate", form.expectedEndDate);
      formData.append("completedDate", form.completedDate);
      formData.append("contractValue", String(form.contractValue));

      if (coverFile) formData.append("coverImage", coverFile);
      galleryItems.forEach((item) => formData.append("images", item.file));

      if (editingId) {
        formData.append("removeCover", String(removeCover));
        formData.append("removeImages", JSON.stringify(removeImages));
      }

      const result = await apiRequest(
        editingId ? `/api/projects/${editingId}` : "/api/projects",
        { method: editingId ? "PUT" : "POST", body: formData }
      );

      alert(result.message || "Project saved successfully.");

      closeModal();
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const result = await apiRequest(`/api/projects/${id}`, {
        method: "DELETE",
      });

      alert(result.message || "Project deleted successfully.");

      if (projects.length === 1 && page > 1) setPage((prev) => prev - 1);
      else reload();
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------- Website visibility ---------- */

  const toggleVisibility = async (project) => {
    try {
      const result = await apiRequest(
        `/api/projects/${project._id}/visibility`,
        { method: "PATCH" }
      );

      setProjects((prev) =>
        prev.map((item) =>
          item._id === project._id
            ? { ...item, showOnWebsite: result.data.showOnWebsite }
            : item
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------- Render ---------- */

  const statCards = [
    { title: "Total Projects", value: stats.total, icon: "▦" },
    { title: "Ongoing (this page)", value: stats.ongoing, icon: "◷" },
    { title: "Completed (this page)", value: stats.completed, icon: "✓" },
    { title: "Upcoming (this page)", value: stats.upcoming, icon: "↗" },
  ];

  const showCoverPreview = coverPreview && !removeCover;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-secondary">
            ADMINISTRATION / PROJECTS
          </p>
          <h1 className="text-2xl font-bold text-heading md:text-3xl">
            Projects Management
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage your engineering projects, images and website visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <span className="text-lg">+</span>
          Add New Project
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.title}
            className="rounded border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{item.title}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl text-primary">
                {item.icon}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-heading">
              {item.value}
            </h2>
          </div>
        ))}
      </div>

      {/* PROJECT TABLE */}
      <div className="overflow-hidden rounded border border-border bg-surface shadow-sm">
        {/* FILTERS */}
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-heading">All Projects</h2>
            <p className="mt-1 text-xs text-muted">{total} projects found</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={inputClass}
            />

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-background text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Website</th>
                <th className="px-5 py-4">Start Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center text-muted">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="text-3xl">▦</div>
                    <p className="mt-3 font-semibold text-heading">
                      No projects found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Add a new project to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project._id}
                    className="transition hover:bg-background/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {project.coverImage?.url ? (
                          <img
                            src={project.coverImage.url}
                            alt={project.name}
                            className="h-12 w-14 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            {getInitials(project.name)}
                          </div>
                        )}

                        <div>
                          <p className="max-w-[220px] truncate text-sm font-bold text-heading">
                            {project.name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {project.code || "No project code"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {project.client || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary">
                        {project.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          statusStyles[project.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(project)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          project.showOnWebsite
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {project.showOnWebsite ? "Visible" : "Hidden"}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-sm text-muted">
                      {formatDate(project.startDate)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="View project"
                          onClick={() => setViewProject(project)}
                          className="rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-primary/5"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          title="Edit project"
                          onClick={() => openEditModal(project._id)}
                          className="rounded-lg border border-border px-3 py-2 text-sm text-heading hover:bg-background"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Delete project"
                          onClick={() => handleDelete(project._id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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

        {/* PAGINATION */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-4 sm:flex-row">
          <p className="text-sm text-muted">
            Page {page} of {pages} · {total} total projects
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-body disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-body disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 py-6 backdrop-blur-sm md:p-6">
          <div
            role="dialog"
            aria-modal="true"
            className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4 md:px-7">
              <div>
                <h2 className="text-xl font-bold text-heading">
                  {editingId ? "Edit Project" : "Create New Project"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Enter project information below.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-xl text-muted hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 p-5 md:p-7">
              {/* 01 BASIC INFORMATION */}
              <section>
                <SectionTitle>01. Basic Information</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Project Name" required>
                    <input
                      required
                      maxLength={150}
                      placeholder="Enter project name"
                      className={inputClass}
                      {...bind("name")}
                    />
                  </Field>

                  <Field label="Project Code">
                    <input
                      placeholder="Example: TEC-001"
                      className={inputClass}
                      {...bind("code")}
                    />
                  </Field>

                  <Field label="Client Name" required>
                    <input
                      required
                      maxLength={150}
                      placeholder="Enter client name"
                      className={inputClass}
                      {...bind("client")}
                    />
                  </Field>

                  <SelectField
                    label="Category"
                    required
                    placeholder="Select category"
                    options={CATEGORIES}
                    {...bind("category")}
                  />

                  <SelectField
                    label="Structure Type"
                    placeholder="Select structure type"
                    options={STRUCTURE_TYPES}
                    {...bind("structureType")}
                  />

                  <SelectField
                    label="Project Status"
                    options={STATUSES}
                    {...bind("status")}
                  />

                  <div className="md:col-span-2">
                    <Field label="Project Description">
                      <textarea
                        rows={4}
                        maxLength={2000}
                        placeholder="Describe the project..."
                        className={inputClass}
                        {...bind("description")}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              {/* 02 SERVICES */}
              <section>
                <SectionTitle>02. Services Provided</SectionTitle>
                <CheckboxGrid
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  options={SERVICES}
                  selected={form.services}
                  onToggle={(value) => toggleArrayValue("services", value)}
                />
              </section>

              {/* 03 LOCATION */}
              <section>
                <SectionTitle>03. Project Location</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="City">
                    <input
                      placeholder="City"
                      className={inputClass}
                      {...bindNested("location", "city")}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      placeholder="State"
                      className={inputClass}
                      {...bindNested("location", "state")}
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      placeholder="Country"
                      className={inputClass}
                      {...bindNested("location", "country")}
                    />
                  </Field>
                </div>
              </section>

              {/* 04 SPECIFICATIONS */}
              <section>
                <SectionTitle>04. Project Specifications</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Project Size">
                    <input
                      placeholder="Example: 50,000 sq. ft."
                      className={inputClass}
                      {...bindNested("specs", "size")}
                    />
                  </Field>
                  <Field label="Number of Floors">
                    <input
                      placeholder="Example: G + 5"
                      className={inputClass}
                      {...bindNested("specs", "floors")}
                    />
                  </Field>
                </div>
              </section>

              {/* 05 TIMELINE */}
              <section>
                <SectionTitle>05. Project Timeline</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="Start Date">
                    <input
                      type="date"
                      className={inputClass}
                      {...bind("startDate")}
                    />
                  </Field>
                  <Field label="Expected End Date">
                    <input
                      type="date"
                      min={form.startDate || undefined}
                      className={inputClass}
                      {...bind("expectedEndDate")}
                    />
                  </Field>
                  <Field label="Completed Date">
                    <input
                      type="date"
                      className={inputClass}
                      {...bind("completedDate")}
                    />
                  </Field>
                </div>
              </section>

              {/* 06 FINANCIAL */}
              <section>
                <SectionTitle>06. Financial Information</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Contract Value">
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter contract value"
                      className={inputClass}
                      {...bind("contractValue")}
                    />
                  </Field>

                  <SelectField
                    label="Currency"
                    options={CURRENCIES}
                    {...bind("currency")}
                  />
                </div>
              </section>

              {/* 07 CONTACT PERSON */}
              <section>
                <SectionTitle>07. Client Contact Person</SectionTitle>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="Contact Name">
                    <input
                      placeholder="Contact person name"
                      className={inputClass}
                      {...bindNested("contactPerson", "name")}
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      placeholder="Phone number"
                      className={inputClass}
                      {...bindNested("contactPerson", "phone")}
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      type="email"
                      placeholder="Email address"
                      className={inputClass}
                      {...bindNested("contactPerson", "email")}
                    />
                  </Field>
                </div>
              </section>

              {/* 08 SOFTWARE */}
              <section>
                <SectionTitle>08. Software Used</SectionTitle>
                <CheckboxGrid
                  className="grid grid-cols-2 gap-3 md:grid-cols-3"
                  options={SOFTWARE}
                  selected={form.softwareUsed}
                  onToggle={(value) => toggleArrayValue("softwareUsed", value)}
                />
              </section>

              {/* 09 IMAGES */}
              <section>
                <SectionTitle>09. Project Images</SectionTitle>

                <div className="space-y-6">
                  {/* COVER */}
                  <FieldGroup label="Cover Image">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border bg-background p-5 text-center transition hover:border-primary"
                    >
                      {showCoverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="max-h-56 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <>
                          <span className="text-4xl text-primary">↑</span>
                          <span className="mt-3 font-semibold text-heading">
                            Click to upload cover image
                          </span>
                          <span className="mt-1 text-xs text-muted">
                            Select an image for the project cover.
                          </span>
                        </>
                      )}
                    </button>

                    <div className="mt-3 flex gap-4">
                      {showCoverPreview && (
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="text-sm font-semibold text-primary"
                        >
                          Change cover
                        </button>
                      )}

                      {editingId && existingCover && !removeCover && (
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="text-sm font-semibold text-red-600"
                        >
                          Remove cover
                        </button>
                      )}

                      {editingId && existingCover && removeCover && (
                        <button
                          type="button"
                          onClick={handleUndoRemoveCover}
                          className="text-sm font-semibold text-primary"
                        >
                          Undo remove
                        </button>
                      )}
                    </div>
                  </FieldGroup>

                  {/* GALLERY */}
                  <FieldGroup label="Gallery Images">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      + Add Gallery Images
                    </button>

                    {(existingImages.length > 0 || galleryItems.length > 0) && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {existingImages.map((image) => (
                          <div
                            key={image.publicId || image.url}
                            className="relative"
                          >
                            <img
                              src={getImageUrl(image)}
                              alt="Project gallery"
                              className="h-28 w-full rounded-lg border border-border object-cover"
                            />
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() => removeExistingGalleryImage(image)}
                              className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                        {galleryItems.map((item) => (
                          <div key={item.id} className="relative">
                            <img
                              src={item.url}
                              alt="New gallery preview"
                              className="h-28 w-full rounded-lg border border-border object-cover"
                            />
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() => removeNewGalleryImage(item.id)}
                              className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldGroup>
                </div>
              </section>

              {/* 10 WEBSITE VISIBILITY */}
              <section>
                <SectionTitle>10. Website Settings</SectionTitle>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded border border-border bg-background p-4">
                  <div>
                    <p className="font-semibold text-heading">
                      Show project on website
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Enable this option to display this project publicly.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.showOnWebsite}
                    onChange={(e) =>
                      updateField("showOnWebsite", e.target.checked)
                    }
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              </section>

              {/* 11 NOTES */}
              <section>
                <SectionTitle>11. Internal Notes</SectionTitle>

                <Field label="Notes">
                  <textarea
                    rows={4}
                    placeholder="Add internal project notes..."
                    className={inputClass}
                    {...bind("notes")}
                  />
                </Field>
              </section>

              {/* FOOTER */}
              <div className="sticky bottom-0 flex flex-col-reverse justify-end gap-3 border-t border-border bg-white pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-body hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Project"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROJECT MODAL */}
      {viewProject && (
        <ProjectViewModal
          project={viewProject}
          onClose={() => setViewProject(null)}
          onEdit={openEditModal}
        />
      )}
    </div>
  );
};

export default Projects;