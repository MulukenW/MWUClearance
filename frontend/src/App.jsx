import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import { OFFICER_ROLES } from "./constants";

// Auth pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import ForceChangePassword from "./pages/ForceChangePassword";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import NewClearance from "./pages/student/NewClearance";
import StudentClearanceDetail from "./pages/student/ClearanceDetail";
import MyCertificates from "./pages/student/MyCertificates";

// Officer pages
import OfficerDashboard from "./pages/officer/Dashboard";
import PendingClearances from "./pages/officer/PendingClearances";
import OfficerClearanceDetail from "./pages/officer/ClearanceDetail";
import OfficerHistory from "./pages/officer/History";
import Chats from "./pages/shared/Chats";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import CollegeManagement from "./pages/admin/CollegeManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import ProgramManagement from "./pages/admin/ProgramManagement";
import StudentTypeManagement from "./pages/admin/StudentTypeManagement";
import OfficeManagement from "./pages/admin/OfficeManagement";
import WorkflowConfig from "./pages/admin/WorkflowConfig";
import Reports from "./pages/admin/Reports";
import AuditLogs from "./pages/admin/AuditLogs";
import Settings from "./pages/admin/Settings";

// Public pages
import CertificateView from "./pages/CertificateView";
import VerifyCertificate from "./pages/VerifyCertificate";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Authenticated: Force password change (e.g. student first login) */}
          <Route
            element={
              <ProtectedRoute>
                <AuthLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/force-change-password" element={<ForceChangePassword />} />
          </Route>

          {/* Public: Certificate verification (no auth layout) */}
          <Route path="/verify/:code" element={<VerifyCertificate />} />

          {/* Authenticated routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Shared */}
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Student routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/clearance/new"
              element={
                <ProtectedRoute roles={["student"]}>
                  <NewClearance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/clearance/:id"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentClearanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute roles={["student"]}>
                  <MyCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/chats"
              element={
                <ProtectedRoute roles={["student"]}>
                  <Chats />
                </ProtectedRoute>
              }
            />

            {/* Officer routes */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute roles={OFFICER_ROLES}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/pending"
              element={
                <ProtectedRoute roles={OFFICER_ROLES}>
                  <PendingClearances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/clearance/:id"
              element={
                <ProtectedRoute roles={OFFICER_ROLES}>
                  <OfficerClearanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/history"
              element={
                <ProtectedRoute roles={OFFICER_ROLES}>
                  <OfficerHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/chats"
              element={
                <ProtectedRoute roles={OFFICER_ROLES}>
                  <Chats />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/colleges"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <CollegeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/programs"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <ProgramManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/student-types"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <StudentTypeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clearance-offices"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <OfficeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/workflows"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <WorkflowConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
