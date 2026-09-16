# MWU Student Clearance System — Project Complete

## Summary

The **Madda Walabu University Student Clearance Management System** is a full-stack web application that digitizes the multi-step student clearance process across academic offices.

---

## Backend (Laravel 8 + PHP 7.4)

### Stats

- **99 API endpoints** across 12 controllers
- **15+ database migrations**
- **12 API Resources** for response formatting
- **3 middleware** (Role, Department Auth, Security Headers)

### Controllers

| Controller                   | Endpoints | Purpose                                                                    |
| ---------------------------- | --------- | -------------------------------------------------------------------------- |
| `AuthController`             | 9         | Login, logout, password reset/change, permission check                     |
| `AdminController`            | 10        | Dashboard stats, user CRUD, student CRUD, system config                    |
| `AdminManagementController`  | 30        | CRUD for colleges, departments, programs, student types, clearance offices |
| `AdminWorkflowController`    | 6         | Workflow configuration, reset to default                                   |
| `StudentClearanceController` | 6         | Student clearance create, list, show, progress, resubmit                   |
| `ClearanceController`        | 8         | Officer approve/reject, comments, pending list, history, statistics        |
| `StudentController`          | 6         | Student search, view, clearance history, statistics                        |
| `NotificationController`     | 4         | List, unread count, mark read, mark all read                               |
| `CertificateController`      | 4         | List, show, download HTML, student's certificates                          |
| `VerificationController`     | 1         | Public QR code verification                                                |
| `ReportsController`          | 7         | Summary, department, college, office, pending, rejected, student reports   |
| `WebAuthnController`         | 6         | Passkey registration/login (PHP 7.4 compatible)                            |

### Key Features

- Sanctum token-based authentication
- Role-based access control (admin, student, advisor, department_head, laboratory, library, dormitory, police, registrar)
- Sequential multi-step clearance workflow
- Real-time notifications
- HTML certificate generation with QR verification
- Audit logging
- WebAuthn/Passkey support (lightweight, no external library)
- CORS restricted to frontend origins
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)

---

## Frontend (React 18 + Vite 6 + Tailwind CSS v4)

### Stats

- **49 source files** (JSX, JS, CSS)
- **15 reusable UI components**
- **16 page components** across 3 role sections
- **1 API service layer** with all endpoints

### Components (15)

`ClearanceTimeline`, `ConfirmDialog`, `DashboardCard`, `DataTable`, `EmptyState`, `FormInput`, `LoadingSpinner`, `Modal`, `Pagination`, `ProgressBar`, `SearchBar`, `SelectInput`, `StatusBadge`, `CrudManagement`, `NotificationPanel` (in Navbar)

### Pages by Role

**Public (4):** Login, ForgotPassword, ResetPassword, VerifyCertificate

**Student (4):** Dashboard, NewClearance, ClearanceDetail, MyCertificates

**Officer (4):** Dashboard, PendingClearances, ClearanceDetail (approve/reject), History

**Admin (11):** Dashboard, UserManagement, StudentManagement, CollegeManagement, DepartmentManagement, ProgramManagement, StudentTypeManagement, OfficeManagement, WorkflowConfig, Reports, AuditLogs

**Shared (2):** ChangePassword, CertificateView

### Architecture

- **AuthContext** — React context for authentication state
- **ProtectedRoute** — Role-based route guard
- **AppLayout** — Sidebar + Navbar with notification bell (30s polling)
- **AuthLayout** — Centered card for login pages
- **Vite proxy** — `/api` → `http://localhost:8000` during development
- **Axios interceptors** — Auto Bearer token, 401 redirect

---

## Running the Project

### Development

```bash
# Terminal 1: Backend (http://localhost:8000)
cd Clerance/backend
php artisan serve --port=8000

# Terminal 2: Frontend (http://localhost:5173)
cd Clerance/frontend
npm run dev
```

### Production Build

```bash
cd Clerance/frontend
npm run build    # outputs to dist/
```

### Default Login

| Email                | Password | Role      |
| -------------------- | -------- | --------- |
| admin@mwu.edu.et     | password | Admin     |
| advisor@mwu.edu.et   | password | Advisor   |
| head@mwu.edu.et      | password | Dept Head |
| lab@mwu.edu.et       | password | Lab       |
| library@mwu.edu.et   | password | Library   |
| dormitory@mwu.edu.et | password | Dormitory |
| police@mwu.edu.et    | password | Police    |
| registrar@mwu.edu.et | password | Registrar |

---

## Technology Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Backend Framework  | Laravel 8 (PHP 7.4)                     |
| Database           | MySQL 5.7+                              |
| Auth               | Laravel Sanctum (Bearer tokens)         |
| Frontend Framework | React 18                                |
| Build Tool         | Vite 6                                  |
| CSS                | Tailwind CSS v4                         |
| Routing            | React Router DOM 6                      |
| HTTP Client        | Axios                                   |
| Forms              | React Hook Form                         |
| Password Reset     | Laravel Mail + token                    |
| WebAuthn           | Custom PHP 7.4 implementation (openssl) |

---

## File Structure

```
Clerance/
├── backend/                        # Laravel API
│   ├── app/Http/Controllers/Api/   # 12 API controllers
│   ├── app/Http/Middleware/        # 3 custom middleware
│   ├── app/Http/Resources/         # 12 API resources
│   ├── app/Models/                 # Eloquent models
│   ├── app/Services/               # Business logic
│   ├── database/migrations/        # Schema migrations
│   ├── routes/api.php              # 99 API routes
│   └── config/cors.php             # CORS config
│
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── components/             # 15 reusable components
│   │   ├── pages/admin/            # 11 admin pages
│   │   ├── pages/officer/          # 4 officer pages
│   │   ├── pages/student/          # 4 student pages
│   │   ├── layouts/                # AppLayout, AuthLayout
│   │   ├── services/api.js         # API service layer
│   │   ├── contexts/AuthContext.jsx # Auth state
│   │   ├── routes/ProtectedRoute.jsx
│   │   ├── App.jsx                 # All routes
│   │   └── main.jsx                # Entry point
│   ├── dist/                       # Production build
│   └── vite.config.js              # Vite + Tailwind + proxy
│
├── DEPLOYMENT_GUIDE.md             # Full deployment docs
└── PROJECT_COMPLETE.md             # This file
```
