<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentClearanceController;
use App\Http\Controllers\Api\ClearanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\AdminWorkflowController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\WebAuthnController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ChatController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// ========================================================================
// Public routes (no authentication required)
// ========================================================================

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $userCount = \App\Models\User::count();
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'users_count' => $userCount,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'failed',
            'message' => $e->getMessage(),
        ], 500);
    }
});

Route::prefix('auth')->group(function () {
    // Login with rate limiting (20 attempts per minute for development)
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');

    // Password reset (rate limited)
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:10,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
});

// Public certificate verification endpoint (QR code target)
Route::get('/verify/{code}', [VerificationController::class, 'verify']);

// Public certificate view endpoint (for printing)
Route::get('/certificate/{id}/view', [CertificateController::class, 'publicView']);

// Public logo endpoint (serves current logo from settings or default SVG)
Route::get('/logo', [SettingsController::class, 'logo']);
Route::get('/stamp', [SettingsController::class, 'stamp']);
Route::get('/branding/color', [SettingsController::class, 'primaryColor']);
Route::get('/settings/public', [SettingsController::class, 'publicSettings']);

// WebAuthn public login routes
Route::prefix('webauthn')->group(function () {
    Route::post('/login/options', [WebAuthnController::class, 'loginOptions']);
    Route::post('/login/verify', [WebAuthnController::class, 'loginVerify']);
});

// ========================================================================
// Protected routes (authentication required)
// ========================================================================

Route::middleware('auth:sanctum')->group(function () {

    // ---- Authentication routes ----
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/refresh', [AuthController::class, 'refresh']);
        Route::post('/check-permission', [AuthController::class, 'checkPermission']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/force-change-password', [AuthController::class, 'forceChangePassword']);
    });

    // ---- WebAuthn / Passkey routes (authenticated) ----
    Route::prefix('webauthn')->group(function () {
        Route::post('/register/options', [WebAuthnController::class, 'registerOptions']);
        Route::post('/register/verify', [WebAuthnController::class, 'registerVerify']);
        Route::get('/credentials', [WebAuthnController::class, 'credentials']);
        Route::delete('/credentials/{id}', [WebAuthnController::class, 'deleteCredential']);
    });

    // ---- Student clearance routes (for students) ----
    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('/clearance', [StudentClearanceController::class, 'index']);
        Route::post('/clearance', [StudentClearanceController::class, 'store']);
        Route::get('/clearance/{id}', [StudentClearanceController::class, 'show']);
        Route::get('/clearance/{id}/progress', [StudentClearanceController::class, 'progress']);
        Route::post('/clearance/items/{itemId}/resubmit', [StudentClearanceController::class, 'resubmit']);
        Route::get('/certificates', [CertificateController::class, 'myCertificate']);
    });

    // ---- Clearance officer routes ----
    Route::prefix('clearance')->middleware('role:advisor,department_head,laboratory,library,dormitory,police,registrar,cafeteria,student_service,cost_sharing,continuing_education')->group(function () {
        Route::get('/pending', [ClearanceController::class, 'pending']);
        Route::get('/history', [ClearanceController::class, 'history']);
        Route::get('/statistics', [ClearanceController::class, 'statistics']);
        Route::get('/items/{id}', [ClearanceController::class, 'show']);
        Route::post('/items/{id}/approve', [ClearanceController::class, 'approve']);
        Route::post('/items/{id}/reject', [ClearanceController::class, 'reject']);
        Route::post('/items/{id}/comments', [ClearanceController::class, 'addComment']);
        Route::get('/items/{id}/comments', [ClearanceController::class, 'getComments']);
    });

    // ---- Notification routes (all authenticated users) ----
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });

    // ---- Chat routes (workflow-scoped conversations; access enforced in ChatController) ----
    Route::get('/chat/threads', [ChatController::class, 'threads']);
    Route::get('/chat/unread-count', [ChatController::class, 'unreadCount']);
    Route::post('/chat/messages/{id}/read', [ChatController::class, 'markRead']);
    Route::get('/clearance/items/{itemId}/chat', [ChatController::class, 'index']);
    Route::post('/clearance/items/{itemId}/chat', [ChatController::class, 'store']);

    // ---- Student management routes (for officers and admin) ----
    Route::prefix('students')->middleware('role:advisor,department_head,laboratory,library,dormitory,police,registrar,cafeteria,student_service,cost_sharing,continuing_education,admin')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::get('/search', [StudentController::class, 'search']);
        Route::get('/summary', [StudentController::class, 'summary']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::get('/{id}/clearance-history', [StudentController::class, 'clearanceHistory']);
        Route::get('/{id}/statistics', [StudentController::class, 'statistics']);
    });

    // ---- Certificate routes ----
    Route::prefix('certificates')->middleware('role:student,advisor,department_head,registrar,admin')->group(function () {
        Route::get('/', [CertificateController::class, 'index']);
        Route::get('/{id}', [CertificateController::class, 'show']);
        Route::get('/{id}/download', [CertificateController::class, 'download']);
    });

    // ---- Admin routes (admin only) ----
    Route::prefix('admin')->middleware('role:admin')->group(function () {

        // Dashboard & statistics
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/statistics', [AdminController::class, 'statistics']);

        // User management
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Student management (CRUD)
        Route::post('/students', [AdminController::class, 'createStudent']);
        Route::post('/students/import', [AdminController::class, 'importStudents']);
        Route::put('/students/{id}', [AdminController::class, 'updateStudent']);
        Route::delete('/students/{id}', [AdminController::class, 'deleteStudent']);

        // System configuration
        Route::get('/system-config', [AdminController::class, 'systemConfig']);

        // Audit logs
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);

        // ---- Admin Management (colleges, departments, programs, student types, clearance offices) ----

        // Colleges
        Route::get('/colleges', [AdminManagementController::class, 'colleges']);
        Route::get('/colleges/{id}', [AdminManagementController::class, 'getCollege']);
        Route::post('/colleges', [AdminManagementController::class, 'createCollege']);
        Route::put('/colleges/{id}', [AdminManagementController::class, 'updateCollege']);
        Route::delete('/colleges/{id}', [AdminManagementController::class, 'deleteCollege']);
        Route::patch('/colleges/{id}/toggle-active', [AdminManagementController::class, 'toggleCollegeActive']);

        // Departments
        Route::get('/departments', [AdminManagementController::class, 'departments']);
        Route::get('/departments/{id}', [AdminManagementController::class, 'getDepartment']);
        Route::post('/departments', [AdminManagementController::class, 'createDepartment']);
        Route::put('/departments/{id}', [AdminManagementController::class, 'updateDepartment']);
        Route::delete('/departments/{id}', [AdminManagementController::class, 'deleteDepartment']);
        Route::patch('/departments/{id}/toggle-active', [AdminManagementController::class, 'toggleDepartmentActive']);

        // Programs
        Route::get('/programs', [AdminManagementController::class, 'programs']);
        Route::get('/programs/{id}', [AdminManagementController::class, 'getProgram']);
        Route::post('/programs', [AdminManagementController::class, 'createProgram']);
        Route::put('/programs/{id}', [AdminManagementController::class, 'updateProgram']);
        Route::delete('/programs/{id}', [AdminManagementController::class, 'deleteProgram']);
        Route::patch('/programs/{id}/toggle-active', [AdminManagementController::class, 'toggleProgramActive']);

        // Student Types
        Route::get('/student-types', [AdminManagementController::class, 'studentTypes']);
        Route::get('/student-types/{id}', [AdminManagementController::class, 'getStudentType']);
        Route::post('/student-types', [AdminManagementController::class, 'createStudentType']);
        Route::put('/student-types/{id}', [AdminManagementController::class, 'updateStudentType']);
        Route::delete('/student-types/{id}', [AdminManagementController::class, 'deleteStudentType']);
        Route::patch('/student-types/{id}/toggle-active', [AdminManagementController::class, 'toggleStudentTypeActive']);

        // Clearance Offices
        Route::get('/clearance-offices', [AdminManagementController::class, 'clearanceOffices']);
        Route::get('/clearance-offices/{id}', [AdminManagementController::class, 'getClearanceOffice']);
        Route::post('/clearance-offices', [AdminManagementController::class, 'createClearanceOffice']);
        Route::put('/clearance-offices/{id}', [AdminManagementController::class, 'updateClearanceOffice']);
        Route::delete('/clearance-offices/{id}', [AdminManagementController::class, 'deleteClearanceOffice']);
        Route::patch('/clearance-offices/{id}/toggle-active', [AdminManagementController::class, 'toggleClearanceOfficeActive']);

        // ---- Workflow Configuration ----
        Route::get('/workflows', [AdminWorkflowController::class, 'index']);
        Route::get('/workflows/{studentTypeId}', [AdminWorkflowController::class, 'show']);
        Route::post('/workflows', [AdminWorkflowController::class, 'store']);
        Route::put('/workflows/{id}', [AdminWorkflowController::class, 'update']);
        Route::delete('/workflows/{id}', [AdminWorkflowController::class, 'destroy']);
        Route::post('/workflows/{studentTypeId}/reset', [AdminWorkflowController::class, 'resetToDefault']);

        // ---- Reports ----
        Route::get('/reports/summary', [ReportsController::class, 'summary']);
        Route::get('/reports/department', [ReportsController::class, 'departmentReport']);
        Route::get('/reports/college', [ReportsController::class, 'collegeReport']);
        Route::get('/reports/office', [ReportsController::class, 'officeReport']);
        Route::get('/reports/pending', [ReportsController::class, 'pendingReport']);
        Route::get('/reports/rejected', [ReportsController::class, 'rejectedReport']);
        Route::get('/reports/student/{studentId}', [ReportsController::class, 'studentReport']);

        // ---- Settings (logo, university name, etc.) ----
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::post('/settings', [SettingsController::class, 'update']);
        Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);
        Route::delete('/settings/logo', [SettingsController::class, 'deleteLogo']);
        Route::post('/settings/stamp', [SettingsController::class, 'uploadStamp']);
        Route::delete('/settings/stamp', [SettingsController::class, 'deleteStamp']);
    });

    // Test route to verify authentication
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
