import axios from "axios";

const isLocalFrontend =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL =
  rawApiUrl && !rawApiUrl.includes("railway.app")
    ? rawApiUrl
    : isLocalFrontend
    ? "http://localhost:8000/api"
    : "https://mwu-clearance-api.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post("/auth/login", { login: email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  changePassword: (data) => api.post("/auth/change-password", data),
  forceChangePassword: (data) => api.post("/auth/force-change-password", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// ─── Student ─────────────────────────────────────────────────────────────────
export const studentClearanceApi = {
  list: () => api.get("/student/clearance"),
  create: (data) => api.post("/student/clearance", data),
  show: (id) => api.get(`/student/clearance/${id}`),
  progress: (id) => api.get(`/student/clearance/${id}/progress`),
  resubmit: (itemId) => api.post(`/student/clearance/items/${itemId}/resubmit`),
  myCertificates: () => api.get("/student/certificates"),
};

// ─── Clearance Officer ───────────────────────────────────────────────────────
export const clearanceApi = {
  pending: () => api.get("/clearance/pending"),
  history: (params) => api.get("/clearance/history", { params }),
  statistics: () => api.get("/clearance/statistics"),
  show: (id) => api.get(`/clearance/items/${id}`),
  approve: (id, comment) =>
    api.post(`/clearance/items/${id}/approve`, { comment }),
  reject: (id, reason, comment) =>
    api.post(`/clearance/items/${id}/reject`, { reason, comment }),
  addComment: (id, comment, isInternal = false) =>
    api.post(`/clearance/items/${id}/comments`, {
      comment,
      is_internal: isInternal,
    }),
  getComments: (id) => api.get(`/clearance/items/${id}/comments`),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => api.get("/notifications"),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/mark-all-read"),
};

// ─── Chat (workflow-scoped conversations) ─────────────────────────────────
export const chatApi = {
  messages: (itemId) => api.get(`/clearance/items/${itemId}/chat`),
  send: (itemId, message) =>
    api.post(`/clearance/items/${itemId}/chat`, { message }),
  threads: () => api.get("/chat/threads"),
  markRead: (messageId) => api.post(`/chat/messages/${messageId}/read`),
  unreadCount: () => api.get("/chat/unread-count"),
};

// ─── Students (officer/admin view) ──────────────────────────────────────────
export const studentsApi = {
  list: (params) => api.get("/students", { params }),
  search: (q, params) =>
    api.get("/students/search", { params: { q, ...params } }),
  summary: () => api.get("/students/summary"),
  show: (id) => api.get(`/students/${id}`),
  clearanceHistory: (id) => api.get(`/students/${id}/clearance-history`),
  statistics: (id) => api.get(`/students/${id}/statistics`),
};

// ─── Certificates ────────────────────────────────────────────────────────────
export const certificatesApi = {
  list: (params) => api.get("/certificates", { params }),
  show: (id) => api.get(`/certificates/${id}`),
  downloadUrl: (id) => `/api/certificate/${id}/view`,
};

// ─── Verification (public) ──────────────────────────────────────────────────
export const verificationApi = {
  verify: (code) => api.get(`/verify/${code}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  statistics: () => api.get("/admin/statistics"),
  systemConfig: () => api.get("/admin/system-config"),
  auditLogs: (params) => api.get("/admin/audit-logs", { params }),

  // Users
  users: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Students
  createStudent: (data) => api.post("/admin/students", data),
  importStudents: (rows, autoEmail = false, autoCreate = false) =>
    api.post("/admin/students/import", { rows, auto_email: autoEmail, auto_create: autoCreate }, { timeout: 120000 }),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  // Colleges
  colleges: (params) => api.get("/admin/colleges", { params }),
  getCollege: (id) => api.get(`/admin/colleges/${id}`),
  createCollege: (data) => api.post("/admin/colleges", data),
  updateCollege: (id, data) => api.put(`/admin/colleges/${id}`, data),
  deleteCollege: (id) => api.delete(`/admin/colleges/${id}`),
  toggleCollegeActive: (id) => api.patch(`/admin/colleges/${id}/toggle-active`),

  // Departments
  departments: (params) => api.get("/admin/departments", { params }),
  getDepartment: (id) => api.get(`/admin/departments/${id}`),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  toggleDepartmentActive: (id) =>
    api.patch(`/admin/departments/${id}/toggle-active`),

  // Programs
  programs: (params) => api.get("/admin/programs", { params }),
  getProgram: (id) => api.get(`/admin/programs/${id}`),
  createProgram: (data) => api.post("/admin/programs", data),
  updateProgram: (id, data) => api.put(`/admin/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/admin/programs/${id}`),
  toggleProgramActive: (id) => api.patch(`/admin/programs/${id}/toggle-active`),

  // Student Types
  studentTypes: (params) => api.get("/admin/student-types", { params }),
  getStudentType: (id) => api.get(`/admin/student-types/${id}`),
  createStudentType: (data) => api.post("/admin/student-types", data),
  updateStudentType: (id, data) => api.put(`/admin/student-types/${id}`, data),
  deleteStudentType: (id) => api.delete(`/admin/student-types/${id}`),
  toggleStudentTypeActive: (id) =>
    api.patch(`/admin/student-types/${id}/toggle-active`),

  // Clearance Offices
  clearanceOffices: (params) => api.get("/admin/clearance-offices", { params }),
  getClearanceOffice: (id) => api.get(`/admin/clearance-offices/${id}`),
  createClearanceOffice: (data) => api.post("/admin/clearance-offices", data),
  updateClearanceOffice: (id, data) =>
    api.put(`/admin/clearance-offices/${id}`, data),
  deleteClearanceOffice: (id) => api.delete(`/admin/clearance-offices/${id}`),
  toggleClearanceOfficeActive: (id) =>
    api.patch(`/admin/clearance-offices/${id}/toggle-active`),

  // Workflows
  workflows: () => api.get("/admin/workflows"),
  workflowByType: (studentTypeId) =>
    api.get(`/admin/workflows/${studentTypeId}`),
  saveWorkflow: (data) => api.post("/admin/workflows", data),
  updateWorkflowStep: (id, data) => api.put(`/admin/workflows/${id}`, data),
  deleteWorkflowStep: (id) => api.delete(`/admin/workflows/${id}`),
  resetWorkflow: (studentTypeId) =>
    api.post(`/admin/workflows/${studentTypeId}/reset`),

  // Reports
  reports: {
    summary: (params) => api.get("/admin/reports/summary", { params }),
    department: (params) => api.get("/admin/reports/department", { params }),
    college: (params) => api.get("/admin/reports/college", { params }),
    office: (params) => api.get("/admin/reports/office", { params }),
    pending: (params) => api.get("/admin/reports/pending", { params }),
    rejected: (params) => api.get("/admin/reports/rejected", { params }),
    student: (studentId, params) =>
      api.get(`/admin/reports/student/${studentId}`, { params }),
  },
};

// ─── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  list: () => api.get("/admin/settings"),
  update: (data) => api.post("/admin/settings", data),
  uploadLogo: (formData) =>
    api.post("/admin/settings/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteLogo: () => api.delete("/admin/settings/logo"),
  uploadStamp: (formData) =>
    api.post("/admin/settings/stamp", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteStamp: () => api.delete("/admin/settings/stamp"),
};

// ─── WebAuthn ────────────────────────────────────────────────────────────────
export const webAuthnApi = {
  registerOptions: () => api.post("/webauthn/register/options"),
  registerVerify: (data) => api.post("/webauthn/register/verify", data),
  loginOptions: (email) => api.post("/webauthn/login/options", { email }),
  loginVerify: (data) => api.post("/webauthn/login/verify", data),
  credentials: () => api.get("/webauthn/credentials"),
  deleteCredential: (id) => api.delete(`/webauthn/credentials/${id}`),
};

export default api;
