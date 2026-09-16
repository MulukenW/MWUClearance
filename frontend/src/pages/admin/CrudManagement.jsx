import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatDate } from "../../utils/helpers";

/**
 * Generic CRUD management page for admin entities.
 * Props:
 *  - title: string
 *  - subtitle: string (optional)
 *  - icon: React node (optional)
 *  - fetchFn: (params) => Promise  - list API call
 *  - createFn: (data) => Promise
 *  - updateFn: (id, data) => Promise
 *  - deleteFn: (id) => Promise
 *  - toggleFn: (id) => Promise (optional, for active toggle)
 *  - columns: [{ key, label, render? }]
 *  - formFields: [{ name, label, type, options? }]
 *  - emptyForm: { field: defaultValue }
 */
export default function CrudManagement({
  title,
  subtitle,
  icon,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  toggleFn,
  columns,
  formFields,
  emptyForm,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    fetchFn(params)
      .then((res) => setItems(res.data.data?.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (v) => {
    setSearch(v);
    if (v === "") fetchData();
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const editForm = {};
    Object.keys(emptyForm).forEach((key) => {
      editForm[key] = item[key] ?? emptyForm[key];
    });
    setForm(editForm);
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      // Clean up empty string values - convert to null or remove
      const cleanedForm = {};
      Object.entries(form).forEach(([key, value]) => {
        if (value === "") {
          // Skip empty strings for required fields, or set to null for optional
          const field = formFields.find(f => f.name === key);
          if (field && field.type === 'select') {
            // Don't include empty select values
            return;
          }
          cleanedForm[key] = value;
        } else {
          cleanedForm[key] = value;
        }
      });
      
      if (editItem) {
        await updateFn(editItem.id, cleanedForm);
      } else {
        await createFn(cleanedForm);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save.";
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorList = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ');
        setError(`${errorMsg} - ${errorList}`);
      } else {
        setError(errorMsg);
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await deleteFn(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const handleToggle = async (item) => {
    if (!toggleFn) return;
    try {
      await toggleFn(item.id);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const renderFormInput = (field) => {
    const value = form[field.name] ?? "";
    const onChange = (e) => setForm({ ...form, [field.name]: e.target.value });

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <select
            value={value}
            onChange={onChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white"
          >
            <option value="">{field.placeholder || "Select"}</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    if (field.type === "textarea") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <textarea
            value={value}
            onChange={onChange}
            rows={3}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white"
          />
        </div>
      );
    }
    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {field.label}
        </label>
        <input
          type={field.type || "text"}
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white"
        />
      </div>
    );
  };

  const renderCellValue = (col, item) => {
    if (col.render) return col.render(item);
    const keys = col.key.split(".");
    let val = item;
    for (const k of keys) {
      val = val?.[k];
    }
    return val ?? "N/A";
  };

  if (loading && items.length === 0) return <LoadingSpinner />;

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mwu-blue to-blue-600 flex items-center justify-center text-white shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-sm shadow-mwu-blue/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder={`Search ${title.toLowerCase()}...`}
        />
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} found.`} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50/80">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                  {toggleFn && (
                    <th className="text-center px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-5 py-3.5 text-sm text-gray-700"
                      >
                        {renderCellValue(col, item)}
                      </td>
                    ))}
                    {toggleFn && (
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            item.is_active !== false
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                              item.is_active !== false
                                ? "translate-x-4.5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-mwu-blue hover:bg-mwu-blue/5 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">{items.length}</span>{" "}
            {title.toLowerCase()}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? `Edit ${title}` : `New ${title}`}
      >
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {error}
          </div>
        )}
        <div className="space-y-4">{formFields.map(renderFormInput)}</div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowModal(false)}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Saving..." : editItem ? "Update" : "Create"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${title}`}
        message={`Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
