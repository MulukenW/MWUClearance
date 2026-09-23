import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import Modal from "../../components/Modal";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatDate, getInitials } from "../../utils/helpers";
import TablePagination from "../../components/TablePagination";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role_id: "",
    department_id: "",
    college_id: "",
    clearance_office_id: "",
    status: "active",
  });
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clearanceOffices, setClearanceOffices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const departmentLevelRoles = [
    "advisor",
    "department_head",
    "laboratory",
    "student",
  ];
  // College-scoped roles see every department of their assigned college
  // (e.g. Continuing Education Officer).
  const collegeLevelRoles = ["continuing_education"];
  const [colleges, setColleges] = useState([]);
  const selectedRole = roles.find((r) => String(r.id) === String(form.role_id));
  const needsDepartment =
    selectedRole && departmentLevelRoles.includes(selectedRole.code);
  const needsCollege =
    selectedRole && collegeLevelRoles.includes(selectedRole.code);

  const fetchUsers = (targetPage = page) => {
    setLoading(true);
    const params = { page: targetPage };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    adminApi
      .users(params)
      .then((res) => {
        setUsers(res.data.data?.data || res.data.data || []);
        const meta = res.data.meta || {};
        setLastPage(meta.last_page || 1);
        setTotal(meta.total || 0);
        // Keep the requested page in sync when the list shrinks (e.g. after
        // deleting the only user on the last page).
        if (meta.current_page && meta.current_page !== targetPage) {
          setPage(meta.current_page);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Refetch on mount and whenever page / search / role filter change.
  // Search and role changes also reset page to 1 above.
  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, roleFilter]);

  useEffect(() => {
    adminApi
      .systemConfig()
      .then((res) => {
        const cfg = res.data.data || {};
        setRoles(cfg.roles || []);
        setDepartments(cfg.departments || []);
        setColleges(cfg.colleges || []);
        setClearanceOffices(cfg.clearance_offices || []);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role_id: "",
      department_id: "",
      college_id: "",
      clearance_office_id: "",
      status: "active",
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      password_confirmation: "",
      role_id: u.role_id || "",
      department_id: u.department_id || "",
      college_id: u.college_id || "",
      clearance_office_id: u.clearance_office_id || "",
      status: u.status || "active",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const data = { ...form };
      if (editUser && !data.password) {
        delete data.password;
        delete data.password_confirmation;
      }
      if (editUser) await adminApi.updateUser(editUser.id, data);
      else await adminApi.createUser(data);
      setShowModal(false);
      fetchUsers(page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      /* ignore */
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      inactive: "bg-gray-50 text-gray-600 ring-gray-500/20",
      suspended: "bg-red-50 text-red-700 ring-red-600/20",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.inactive}`}
      >
        {status}
      </span>
    );
  };

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white";

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mwu-blue to-blue-600 flex items-center justify-center text-white shadow-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage system users and their roles
            </p>
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
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search users..."
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none bg-gray-50 focus:bg-white transition-all"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mwu-blue to-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-700 font-medium">
                        {u.role?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {u.department?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(u.status)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(u)}
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
                          onClick={() => setDeleteTarget(u)}
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
          <TablePagination
            page={page}
            lastPage={lastPage}
            total={total}
            showingCount={users.length}
            label="users"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? "Edit User" : "Create User"}
        maxWidth="max-w-lg"
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password{" "}
              {editUser && (
                <span className="text-gray-400 font-normal">
                  (leave blank to keep)
                </span>
              )}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                  password_confirmation: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  role_id: e.target.value,
                  department_id: "",
                  college_id: "",
                  clearance_office_id: "",
                })
              }
              className={inputClass}
            >
              <option value="">Select role</option>
              {roles
                .filter((r) => r.code !== "admin")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          {needsDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Required for Student, Advisor, Department Head, and Laboratory
                Chief roles
              </p>
            </div>
          )}
          {needsCollege && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                College <span className="text-red-500">*</span>
              </label>
              <select
                value={form.college_id}
                onChange={(e) =>
                  setForm({ ...form, college_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select college</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                College-level roles (e.g. Continuing Education Officer) handle
                students from every department of this college
              </p>
            </div>
          )}
          {selectedRole && !needsDepartment && !needsCollege && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Clearance Office
              </label>
              <select
                value={form.clearance_office_id}
                onChange={(e) =>
                  setForm({ ...form, clearance_office_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select office</option>
                {clearanceOffices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowModal(false)}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Saving..." : editUser ? "Update" : "Create"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
