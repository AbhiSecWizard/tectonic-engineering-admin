
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const SECTORS = ["government", "private", "international"];
const STATUSES = ["active", "prospect", "inactive"];

const EMPTY_CONTACT = {
  name: "",
  designation: "",
  email: "",
  phone: "",
  isPrimary: false,
};

const EMPTY_FORM = {
  name: "",
  shortName: "",
  sector: "private",
  status: "active",
  website: "",
  gstin: "",
  city: "",
  state: "",
  country: "India",
  contacts: [{ ...EMPTY_CONTACT }],
  notes: "",
  showOnWebsite: false,
  displayOrder: 0,
  work: "",
  scope: "",
  logo: null,
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

function createFormData(form) {
  const formData = new FormData();

  const payload = {
    name: form.name,
    shortName: form.shortName,
    sector: form.sector,
    status: form.status,
    website: form.website,
    gstin: form.gstin,
    location: {
      city: form.city,
      state: form.state,
      country: form.country,
    },
    contacts: form.contacts,
    notes: form.notes,
    showOnWebsite: String(form.showOnWebsite),
    displayOrder: String(form.displayOrder),
    work: form.work
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    scope: form.scope,
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (["location", "contacts", "work"].includes(key)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value ?? ""));
    }
  });

  if (form.logo) {
    formData.append("logo", form.logo);
  }

  return formData;
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState("");

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/api/clients");

      setClients(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Search and filters
  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        client.name?.toLowerCase().includes(query) ||
        client.shortName?.toLowerCase().includes(query) ||
        client.sector?.toLowerCase().includes(query);

      const matchesSector =
        sectorFilter === "all" || client.sector === sectorFilter;

      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [clients, search, sectorFilter, statusFilter]);

  // Dashboard counts
  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((client) => client.status === "active").length,
      prospects: clients.filter((client) => client.status === "prospect").length,
      website: clients.filter((client) => client.showOnWebsite).length,
    }),
    [clients]
  );

  // Reset form
  const resetForm = () => {
    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setForm({
      ...EMPTY_FORM,
      contacts: [{ ...EMPTY_CONTACT }],
    });

    setLogoPreview("");
    setEditingId(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = async (id) => {
    try {
      setError("");

      const result = await apiRequest(`/api/clients/${id}`);
      const client = result.data;

      setEditingId(id);

      setForm({
        name: client.name || "",
        shortName: client.shortName || "",
        sector: client.sector || "private",
        status: client.status || "active",
        website: client.website || "",
        gstin: client.gstin || "",
        city: client.location?.city || "",
        state: client.location?.state || "",
        country: client.location?.country || "India",
        contacts:
          client.contacts?.length > 0
            ? client.contacts.map((contact) => ({
                name: contact.name || "",
                designation: contact.designation || "",
                email: contact.email || "",
                phone: contact.phone || "",
                isPrimary: Boolean(contact.isPrimary),
              }))
            : [{ ...EMPTY_CONTACT }],
        notes: client.notes || "",
        showOnWebsite: Boolean(client.showOnWebsite),
        displayOrder: client.displayOrder ?? 0,
        work: (client.work || []).join(", "),
        scope: client.scope || "",
        logo: null,
      });

      setLogoPreview(client.logo?.url || "");
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Simple form changes
  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Logo must be 5 MB or smaller.");
        event.target.value = "";
        return;
      }

      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }

      setError("");
      setForm((prev) => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Contact changes
  const handleContactChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => ({
        ...contact,
        [field]: field === "isPrimary" ? value : value,
        ...(field === "isPrimary" && value && i !== index
          ? { isPrimary: false }
          : {}),
      })),
    }));
  };

  // Add contact
  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...EMPTY_CONTACT }],
    }));
  };

  // Remove contact
  const removeContact = (index) => {
    setForm((prev) => {
      const contacts = prev.contacts.filter((_, i) => i !== index);

      if (contacts.length > 0 && !contacts.some((item) => item.isPrimary)) {
        contacts[0].isPrimary = true;
      }

      return {
        ...prev,
        contacts:
          contacts.length > 0 ? contacts : [{ ...EMPTY_CONTACT }],
      };
    });
  };

  // Create or update client
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const path = editingId
        ? `/api/clients/${editingId}`
        : "/api/clients";

      const result = await apiRequest(path, {
        method: editingId ? "PUT" : "POST",
        body: createFormData(form),
      });

      setSuccess(
        result.message ||
          (editingId
            ? "Client updated successfully."
            : "Client created successfully.")
      );

      setIsModalOpen(false);
      resetForm();

      await fetchClients();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete client
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(`/api/clients/${id}`, {
        method: "DELETE",
      });

      setSuccess(result.message || "Client deleted successfully.");
      await fetchClients();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update client status
  const handleStatusChange = async (client, status) => {
    try {
      setError("");
      setSuccess("");

      const formData = createFormData({
        ...EMPTY_FORM,
        name: client.name || "",
        shortName: client.shortName || "",
        sector: client.sector || "private",
        status,
        website: client.website || "",
        gstin: client.gstin || "",
        city: client.location?.city || "",
        state: client.location?.state || "",
        country: client.location?.country || "India",
        contacts: (client.contacts || []).map((contact) => ({
          name: contact.name || "",
          designation: contact.designation || "",
          email: contact.email || "",
          phone: contact.phone || "",
          isPrimary: Boolean(contact.isPrimary),
        })),
        notes: client.notes || "",
        showOnWebsite: Boolean(client.showOnWebsite),
        displayOrder: client.displayOrder ?? 0,
        work: (client.work || []).join(", "),
        scope: client.scope || "",
        logo: null,
      });

      const result = await apiRequest(`/api/clients/${client._id}`, {
        method: "PUT",
        body: formData,
      });

      setSuccess(result.message || "Client status updated.");
      await fetchClients();
    } catch (err) {
      setError(err.message);
      await fetchClients();
    }
  };

  // Toggle website visibility
  const handleWebsiteVisibility = async (client) => {
    try {
      setError("");
      setSuccess("");

      const formData = createFormData({
        ...EMPTY_FORM,
        name: client.name || "",
        shortName: client.shortName || "",
        sector: client.sector || "private",
        status: client.status || "active",
        website: client.website || "",
        gstin: client.gstin || "",
        city: client.location?.city || "",
        state: client.location?.state || "",
        country: client.location?.country || "India",
        contacts: (client.contacts || []).map((contact) => ({
          name: contact.name || "",
          designation: contact.designation || "",
          email: contact.email || "",
          phone: contact.phone || "",
          isPrimary: Boolean(contact.isPrimary),
        })),
        notes: client.notes || "",
        showOnWebsite: !client.showOnWebsite,
        displayOrder: client.displayOrder ?? 0,
        work: (client.work || []).join(", "),
        scope: client.scope || "",
        logo: null,
      });

      const result = await apiRequest(`/api/clients/${client._id}`, {
        method: "PUT",
        body: formData,
      });

      setSuccess(result.message || "Website visibility updated.");
      await fetchClients();
    } catch (err) {
      setError(err.message);
      await fetchClients();
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
            CRM Management
          </p>

          <h1 className="text-3xl font-bold text-heading">
            Client Management
          </h1>

          <p className="mt-2 text-sm text-muted">
            Manage your company clients and business relationships.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-footer"
        >
          + Add New Client
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
        <StatCard title="Total Clients" value={stats.total} icon="▤" />
        <StatCard title="Active Clients" value={stats.active} icon="✓" accent="text-green-700" />
        <StatCard title="Prospects" value={stats.prospects} icon="◷" accent="text-secondary" />
        <StatCard title="On Website" value={stats.website} icon="◎" accent="text-primary" />
      </section>

      {/* Client list */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-heading">
              All Clients
            </h2>
            <p className="mt-1 text-sm text-muted">
              View and manage your client records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="form-input sm:w-56"
            />

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="form-input sm:w-44"
            >
              <option value="all">All Sectors</option>
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {capitalize(sector)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input sm:w-40"
            >
              <option value="all">All Status</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">

            <thead className="bg-background text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Sector</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Projects</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Website</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <TableMessage message="Loading clients..." />
              ) : filteredClients.length === 0 ? (
                <TableMessage message="No clients found." />
              ) : (
                filteredClients.map((client) => (
                  <tr key={client._id} className="transition hover:bg-background/70">

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {client.logo?.url ? (
                          <img
                            src={client.logo.url}
                            alt={`${client.name} logo`}
                            className="h-12 w-12 rounded-lg border border-border bg-white object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background text-lg font-bold text-primary">
                            {client.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-heading">
                            {client.name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {client.shortName || "No short name"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <SectorBadge sector={client.sector} />
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {[client.location?.city, client.location?.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-heading">
                      {client.projectCount ?? 0}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={client.status}
                        onChange={(e) =>
                          handleStatusChange(client, e.target.value)
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-2 text-xs text-body"
                        aria-label={`Change status for ${client.name}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {capitalize(status)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleWebsiteVisibility(client)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                          client.showOnWebsite
                            ? "bg-green-100 text-green-700"
                            : "bg-background text-muted"
                        }`}
                      >
                        {client.showOnWebsite ? "Visible" : "Hidden"}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(client._id)}
                          className="rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(client._id)}
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
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      </section>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-footer/70 p-3 py-8 sm:p-6">
          <div className="my-auto w-full max-w-4xl overflow-hidden rounded-xl bg-surface shadow-2xl">

            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold text-heading">
                  {editingId ? "Edit Client" : "Add New Client"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Enter the client information below.
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

            <form onSubmit={handleSubmit} className="space-y-7 p-5">

              {/* Basic information */}
              <FormSection title="Basic Information">
                <div className="grid gap-4 sm:grid-cols-2">

                  <FormField label="Client Name *">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      maxLength={150}
                      className="form-input"
                      placeholder="Enter client name"
                    />
                  </FormField>

                  <FormField label="Short Name">
                    <input
                      name="shortName"
                      value={form.shortName}
                      onChange={handleChange}
                      maxLength={40}
                      className="form-input"
                      placeholder="Enter short name"
                    />
                  </FormField>

                  <FormField label="Sector *">
                    <select
                      name="sector"
                      value={form.sector}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      {SECTORS.map((sector) => (
                        <option key={sector} value={sector}>
                          {capitalize(sector)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Client Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="form-input"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {capitalize(status)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Website URL">
                    <input
                      name="website"
                      type="url"
                      value={form.website}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://example.com"
                    />
                  </FormField>

                  <FormField label="GSTIN">
                    <input
                      name="gstin"
                      value={form.gstin}
                      onChange={handleChange}
                      maxLength={15}
                      className="form-input"
                      placeholder="15-character GSTIN"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Logo */}
              <FormSection title="Client Logo">
                <FormField label="Upload Logo (Maximum 5 MB)">
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-border p-3 text-sm text-body"
                  />

                  {logoPreview && (
                    <div className="mt-3 flex h-36 w-52 items-center justify-center rounded-lg border border-border bg-background p-4">
                      <img
                        src={logoPreview}
                        alt="Client logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </FormField>
              </FormSection>

              {/* Location */}
              <FormSection title="Location">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="City">
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="New Delhi"
                    />
                  </FormField>

                  <FormField label="State">
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Delhi"
                    />
                  </FormField>

                  <FormField label="Country">
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="India"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Contacts */}
              <FormSection title="Contact Persons">
                <div className="space-y-4">
                  {form.contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-background/50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-heading">
                          Contact {index + 1}
                        </h3>

                        {form.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Contact Name *">
                          <input
                            value={contact.name}
                            onChange={(e) =>
                              handleContactChange(index, "name", e.target.value)
                            }
                            required
                            maxLength={100}
                            className="form-input"
                            placeholder="Full name"
                          />
                        </FormField>

                        <FormField label="Designation">
                          <input
                            value={contact.designation}
                            onChange={(e) =>
                              handleContactChange(index, "designation", e.target.value)
                            }
                            className="form-input"
                            placeholder="Project Manager"
                          />
                        </FormField>

                        <FormField label="Email">
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              handleContactChange(index, "email", e.target.value)
                            }
                            className="form-input"
                            placeholder="name@example.com"
                          />
                        </FormField>

                        <FormField label="Phone">
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) =>
                              handleContactChange(index, "phone", e.target.value)
                            }
                            maxLength={20}
                            className="form-input"
                            placeholder="Contact number"
                          />
                        </FormField>
                      </div>

                      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-body">
                        <input
                          type="radio"
                          name="primaryContact"
                          checked={contact.isPrimary}
                          onChange={() =>
                            handleContactChange(index, "isPrimary", true)
                          }
                          className="accent-[#223F79]"
                        />
                        Primary contact
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addContact}
                  className="mt-4 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  + Add Contact Person
                </button>
              </FormSection>

              {/* Work details */}
              <FormSection title="Work Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Scope of Work">
                    <input
                      name="scope"
                      value={form.scope}
                      onChange={handleChange}
                      maxLength={200}
                      className="form-input"
                      placeholder="Structural design and detailing"
                    />
                  </FormField>

                  <FormField label="Work Categories">
                    <input
                      name="work"
                      value={form.work}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Design, Audit, Steel Detailing"
                    />
                    <p className="text-xs text-muted">
                      Separate multiple work categories with commas.
                    </p>
                  </FormField>

                  <FormField label="Display Order">
                    <input
                      name="displayOrder"
                      type="number"
                      min="0"
                      value={form.displayOrder}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </FormField>
                </div>

                <FormField label="Internal Notes">
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    maxLength={2000}
                    rows={4}
                    className="form-input"
                    placeholder="Add internal client notes..."
                  />
                </FormField>
              </FormSection>

              {/* Website settings */}
              <FormSection title="Website Settings">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    type="checkbox"
                    name="showOnWebsite"
                    checked={form.showOnWebsite}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 accent-[#223F79]"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-heading">
                      Display this client on the website
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Only active clients with this option enabled appear in
                      your website clients API.
                    </span>
                  </span>
                </label>
              </FormSection>

              {/* Actions */}
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
                      ? "Update Client"
                      : "Create Client"}
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

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
    active: "bg-green-100 text-green-700",
    prospect: "bg-secondary/15 text-primary",
    inactive: "bg-background text-muted",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.inactive}`}>
      {capitalize(status)}
    </span>
  );
}

function SectorBadge({ sector }) {
  const styles = {
    government: "bg-primary/10 text-primary",
    private: "bg-secondary/15 text-primary",
    international: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[sector] || "bg-background text-muted"}`}>
      {capitalize(sector)}
    </span>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b border-border pb-3 text-base font-bold text-heading">
        {title}
      </h3>
      {children}
    </section>
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
        type="button"
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
      <td colSpan="7" className="p-12 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}
