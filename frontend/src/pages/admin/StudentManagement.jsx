import { useState, useEffect } from "react";
import { adminApi, studentsApi } from "../../services/api";
import Modal from "../../components/Modal";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import StudentImportModal from "./StudentImportModal";
import TablePagination from "../../components/TablePagination";
import { getInitials, ethiopianYear, currentEthiopianYear } from "../../utils/helpers";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [config, setConfig] = useState({
    colleges: [],
    departments: [],
    programs: [],
    studentTypes: [],
  });

  const emptyForm = {
    student_id: "",
    user: { name: "", email: "", password: "" },
    phone: "",
    college_id: "",
    department_id: "",
    program_id: "",
    student_type_id: "",
    year_level: 1,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = (targetPage = page) => {
    setLoading(true);
    const params = { page: targetPage };
    if (search) params.search = search;
    studentsApi
      .list(params)
      .then((res) => {
        setStudents(res.data.data?.data || res.data.data || []);
        const meta = res.data.meta || {};
        setLastPage(meta.last_page || 1);
        setTotal(meta.total || 0);
        if (meta.current_page && meta.current_page !== targetPage) {
          setPage(meta.current_page);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Refetch on mount and whenever page / search change.
  // Search changes also reset page to 1.
  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    adminApi
      .systemConfig()
      .then((res) => {
        const cfg = res.data.data || {};
        setConfig({
          colleges: cfg.colleges || [],
          departments: cfg.departments || [],
          programs: cfg.programs || [],
          studentTypes: cfg.student_types || [],
        });
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError("");
    setGeneratedCredentials(null);
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      student_id: s.student_id || "",
      user: {
        name: s.user?.name || s.full_name || "",
        email: s.user?.email || "",
        password: "",
      },
      phone: s.phone || "",
      college_id: s.college_id || s.department?.college?.id || "",
      department_id: s.department_id || s.department?.id || "",
      program_id: s.program_id || s.program?.id || "",
      student_type_id: s.student_type_id || s.student_type?.id || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    setGeneratedCredentials(null);
    try {
      const data = { ...form };
      
      // Transform data for backend API
      const names = data.user.name.trim().split(' ');
      const payload = {
        student_id: data.student_id,
        first_name: names[0] || '',
        middle_name: names.length > 2 ? names.slice(1, -1).join(' ') : '',
        last_name: names.length > 1 ? names[names.length - 1] : names[0],
        email: data.user.email,
        phone: data.phone || null,
        college_id: data.college_id,
        department_id: data.department_id,
        program_id: data.program_id,
        student_type_id: data.student_type_id,
        academic_year: currentEthiopianYear(),
      };
      
      let response;
      if (editItem) {
        // Keep the original admission year unless the admin changed it
        if (editItem.admission_year) payload.admission_year = editItem.admission_year;
        if (data.user.password) payload.password = data.user.password;
        response = await adminApi.updateStudent(editItem.id, payload);
      } else {
        // Don't send password - let backend auto-generate it
        response = await adminApi.createStudent(payload);
      }
      
      // Check if credentials were generated
      if (response.data.credentials) {
        setGeneratedCredentials(response.data.credentials);
        // Don't close modal yet - show credentials first
      } else {
        setShowModal(false);
      }
      
      fetchData(page);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save student.";
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorList = Object.values(errors).flat().join(', ');
        setError(`${errorMsg}: ${errorList}`);
      } else {
        setError(errorMsg);
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      fetchData(page);
    } catch {
      /* ignore */
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white";
  const filteredDepartments = form.college_id
    ? config.departments.filter(
        (department) => String(department.college_id) === String(form.college_id),
      )
    : [];

  const filteredPrograms = form.department_id
    ? config.programs.filter(
        (program) => String(program.department_id) === String(form.department_id),
      )
    : [];

  if (loading && students.length === 0) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
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
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              Manage student records and enrollments
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center justify-center gap-2 border border-mwu-blue/30 text-mwu-blue bg-blue-50/50 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:border-mwu-blue/50 transition-all"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-sm shadow-mwu-blue/20"
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
            Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search students..."
        />
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <EmptyState message="No students found." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(s.user?.name || s.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {s.user?.name || s.full_name || "Unnamed student"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {s.user?.email}
                          </p>
                          {s.phone && (
                            <p className="text-xs text-gray-400 truncate">
                              {s.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 font-mono">
                      {s.student_id}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {s.department?.name || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {s.program?.name || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
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
                          onClick={() => setDeleteTarget(s)}
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
            showingCount={students.length}
            label="students"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Edit Student" : "Create Student"}
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
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student ID
            </label>
            <input
              type="text"
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.user.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  user: { ...form.user, name: e.target.value },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.user.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  user: { ...form.user, email: e.target.value },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="09xxxxxxxx"
            />
          </div>
          {editItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password{" "}
                <span className="text-gray-400 font-normal">
                  (leave blank to keep current password)
                </span>
              </label>
              <input
                type="password"
                value={form.user.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    user: { ...form.user, password: e.target.value },
                  })
                }
                className={inputClass}
                placeholder="Leave blank to keep current"
              />
            </div>
          )}
          {!editItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Auto-Generated Login</p>
                  <p className="text-xs">A secure password will be automatically generated and shown after creation.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                College
              </label>
              <select
                value={form.college_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    college_id: e.target.value,
                    department_id: "",
                    program_id: "",
                  })
                }
                className={inputClass}
              >
                <option value="">Select</option>
                {config.colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department
              </label>
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value, program_id: "" })
                }
                disabled={!form.college_id}
                className={inputClass}
              >
                <option value="">
                  {form.college_id ? "Select" : "Select college first"}
                </option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Program
              </label>
              <select
                value={form.program_id}
                onChange={(e) =>
                  setForm({ ...form, program_id: e.target.value })
                }
                disabled={!form.department_id}
                className={inputClass}
              >
                <option value="">
                  {form.department_id ? "Select" : "Select department first"}
                </option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Student Type
              </label>
              <select
                value={form.student_type_id}
                onChange={(e) =>
                  setForm({ ...form, student_type_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select</option>
                {config.studentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Year Level
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.year_level}
              onChange={(e) =>
                setForm({ ...form, year_level: parseInt(e.target.value) })
              }
              className={inputClass}
            />
          </div>
        </div>
        
        {/* Generated Credentials Display */}
        {generatedCredentials && (
          <div className="mt-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-800 mb-1">Student Account Created!</h3>
                <p className="text-sm text-green-700">{generatedCredentials.message}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                      {generatedCredentials.email}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.email);
                      }}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Copy email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-bold font-mono bg-green-50 px-3 py-2 rounded border-2 border-green-300 text-green-800">
                      {generatedCredentials.password}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.password);
                      }}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Copy password"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    <strong>Important:</strong> Save these credentials now. The password cannot be retrieved later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
          {generatedCredentials ? (
            <button
              onClick={() => {
                setShowModal(false);
                setGeneratedCredentials(null);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
            >
              Done
            </button>
          ) : (
            <>
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
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
            </>
          )}
        </div>
      </Modal>

      <StudentImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => fetchData(page)}
        config={config}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Delete student "${deleteTarget?.user?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
