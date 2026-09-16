<?php
/**
 * Admin Management Test Script - Phase 4
 * Tests: Dashboard, User CRUD, Student CRUD, College/Department/Program/StudentType/Office CRUD,
 *        Workflow Configuration, Reports, Audit Logs, System Config
 *
 * Run: php test_admin_management.php
 * Requires: php artisan serve (on port 8000)
 */

$baseUrl = 'http://localhost:8000/api';
$adminToken = null;

// ─── Helper ──────────────────────────────────────────────────────────────────
function apiRequest($method, $url, $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

function printResult($testName, $result) {
    $icon = ($result['code'] >= 200 && $result['code'] < 300) ? '✅' : '❌';
    echo "{$icon} [{$result['code']}] {$testName}\n";
    if ($result['code'] >= 400) {
        echo "   Error: " . ($result['body']['message'] ?? 'Unknown') . "\n";
    }
    return $result;
}

// ─── Start Tests ─────────────────────────────────────────────────────────────
echo "\n";
echo "============================================================\n";
echo "  MWU CLEARANCE - PHASE 4 ADMIN MANAGEMENT TESTS\n";
echo "============================================================\n\n";

// ─── 1. Login as Admin ───────────────────────────────────────────────────────
echo "--- 1. Authentication ---\n";
$result = apiRequest('POST', "{$baseUrl}/auth/login", [
    'email' => 'admin@mwu.edu.et',
    'password' => 'password',
]);
$r = printResult('Admin Login', $result);
$adminToken = $r['body']['data']['token'] ?? null;

if (!$adminToken) {
    echo "\n❌ Admin login failed. Cannot continue.\n";
    exit(1);
}

// ─── 2. Dashboard ────────────────────────────────────────────────────────────
echo "\n--- 2. Dashboard & Statistics ---\n";
printResult('Get Dashboard', apiRequest('GET', "{$baseUrl}/admin/dashboard", null, $adminToken));
printResult('Get Statistics', apiRequest('GET', "{$baseUrl}/admin/statistics", null, $adminToken));

// ─── 3. System Config ────────────────────────────────────────────────────────
echo "\n--- 3. System Configuration ---\n";
printResult('Get System Config', apiRequest('GET', "{$baseUrl}/admin/system-config", null, $adminToken));

// ─── 4. User Management ─────────────────────────────────────────────────────
echo "\n--- 4. User Management ---\n";
printResult('List Users', apiRequest('GET', "{$baseUrl}/admin/users", null, $adminToken));
printResult('List Users (filtered)', apiRequest('GET', "{$baseUrl}/admin/users?role=admin&status=active", null, $adminToken));

// Create user
$createUserResult = apiRequest('POST', "{$baseUrl}/admin/users", [
    'name' => 'Test Officer',
    'email' => 'test.officer.' . time() . '@mwu.edu.et',
    'password' => 'password',
    'password_confirmation' => 'password',
    'role_code' => 'library',
], $adminToken);
$r = printResult('Create User', $createUserResult);
$newUserId = $r['body']['data']['id'] ?? null;

if ($newUserId) {
    // Update user
    printResult('Update User', apiRequest('PUT', "{$baseUrl}/admin/users/{$newUserId}", [
        'name' => 'Test Officer Updated',
        'status' => 'active',
    ], $adminToken));

    // Get user details
    printResult('Get User Details', apiRequest('GET', "{$baseUrl}/admin/users/{$newUserId}", null, $adminToken));

    // Delete user
    printResult('Delete User', apiRequest('DELETE', "{$baseUrl}/admin/users/{$newUserId}", null, $adminToken));
}

// ─── 5. Student Management ───────────────────────────────────────────────────
echo "\n--- 5. Student Management (Admin) ---\n";

// Get summary first
printResult('Student Summary', apiRequest('GET', "{$baseUrl}/students/summary", null, $adminToken));

// List students
$studentsResult = apiRequest('GET', "{$baseUrl}/students?page=1&per_page=5", null, $adminToken);
printResult('List Students', $studentsResult);

// Search students
printResult('Search Students', apiRequest('GET', "{$baseUrl}/students/search?q=Abebe", null, $adminToken));

// Create student
$createStudentResult = apiRequest('POST', "{$baseUrl}/admin/students", [
    'student_id' => 'MWU/CS/2024/TST',
    'first_name' => 'Test',
    'middle_name' => 'Phase',
    'last_name' => 'Four',
    'email' => 'test.student.' . time() . '@student.mwu.edu.et',
    'password' => 'password',
    'password_confirmation' => 'password',
    'college_id' => 1,
    'department_id' => 1,
    'program_id' => 1,
    'student_type_id' => 1,
    'academic_year' => '2024/2025',
    'admission_year' => 2024,
    'phone' => '+251900000000',
], $adminToken);
$r = printResult('Create Student', $createStudentResult);
$newStudentId = $r['body']['data']['id'] ?? null;

if ($newStudentId) {
    // Update student
    printResult('Update Student', apiRequest('PUT', "{$baseUrl}/admin/students/{$newStudentId}", [
        'first_name' => 'Updated',
        'phone' => '+251911111111',
    ], $adminToken));

    // Delete student
    printResult('Delete Student', apiRequest('DELETE', "{$baseUrl}/admin/students/{$newStudentId}", null, $adminToken));
}

// ─── 6. College CRUD ────────────────────────────────────────────────────────
echo "\n--- 6. College Management ---\n";
printResult('List Colleges', apiRequest('GET', "{$baseUrl}/admin/colleges", null, $adminToken));

$collegeResult = apiRequest('POST', "{$baseUrl}/admin/colleges", [
    'name' => 'Test College of Engineering',
    'code' => 'TCE',
    'description' => 'Test college created in Phase 4 tests',
], $adminToken);
$r = printResult('Create College', $collegeResult);
$collegeId = $r['body']['data']['id'] ?? null;

if ($collegeId) {
    printResult('Get College', apiRequest('GET', "{$baseUrl}/admin/colleges/{$collegeId}", null, $adminToken));
    printResult('Update College', apiRequest('PUT', "{$baseUrl}/admin/colleges/{$collegeId}", [
        'name' => 'Test College of Engineering (Updated)',
        'code' => 'TCE',
    ], $adminToken));
    printResult('Toggle College Active', apiRequest('PATCH', "{$baseUrl}/admin/colleges/{$collegeId}/toggle-active", null, $adminToken));
    printResult('Delete College', apiRequest('DELETE', "{$baseUrl}/admin/colleges/{$collegeId}", null, $adminToken));
}

// ─── 7. Department CRUD ─────────────────────────────────────────────────────
echo "\n--- 7. Department Management ---\n";
printResult('List Departments', apiRequest('GET', "{$baseUrl}/admin/departments", null, $adminToken));

$deptResult = apiRequest('POST', "{$baseUrl}/admin/departments", [
    'name' => 'Test Department of Robotics',
    'code' => 'TDR',
    'college_id' => 1,
    'description' => 'Test department created in Phase 4 tests',
], $adminToken);
$r = printResult('Create Department', $deptResult);
$deptId = $r['body']['data']['id'] ?? null;

if ($deptId) {
    printResult('Get Department', apiRequest('GET', "{$baseUrl}/admin/departments/{$deptId}", null, $adminToken));
    printResult('Update Department', apiRequest('PUT', "{$baseUrl}/admin/departments/{$deptId}", [
        'name' => 'Test Department of Robotics (Updated)',
        'code' => 'TDR',
        'college_id' => 1,
    ], $adminToken));
    printResult('Toggle Department Active', apiRequest('PATCH', "{$baseUrl}/admin/departments/{$deptId}/toggle-active", null, $adminToken));
    printResult('Delete Department', apiRequest('DELETE', "{$baseUrl}/admin/departments/{$deptId}", null, $adminToken));
}

// ─── 8. Program CRUD ────────────────────────────────────────────────────────
echo "\n--- 8. Program Management ---\n";
printResult('List Programs', apiRequest('GET', "{$baseUrl}/admin/programs", null, $adminToken));

$progResult = apiRequest('POST', "{$baseUrl}/admin/programs", [
    'name' => 'Test Robotics Engineering',
    'code' => 'TRE',
    'department_id' => 1,
    'level' => 'undergraduate',
    'duration_years' => 4,
    'description' => 'Test program created in Phase 4 tests',
], $adminToken);
$r = printResult('Create Program', $progResult);
$progId = $r['body']['data']['id'] ?? null;

if ($progId) {
    printResult('Get Program', apiRequest('GET', "{$baseUrl}/admin/programs/{$progId}", null, $adminToken));
    printResult('Update Program', apiRequest('PUT', "{$baseUrl}/admin/programs/{$progId}", [
        'name' => 'Test Robotics Engineering (Updated)',
        'code' => 'TRE',
        'department_id' => 1,
        'level' => 'undergraduate',
    ], $adminToken));
    printResult('Delete Program', apiRequest('DELETE', "{$baseUrl}/admin/programs/{$progId}", null, $adminToken));
}

// ─── 9. Student Type CRUD ────────────────────────────────────────────────────
echo "\n--- 9. Student Type Management ---\n";
printResult('List Student Types', apiRequest('GET', "{$baseUrl}/admin/student-types", null, $adminToken));

$stResult = apiRequest('POST', "{$baseUrl}/admin/student-types", [
    'name' => 'Test Summer Student',
    'code' => 'test_summer',
    'description' => 'Test student type from Phase 4 tests',
], $adminToken);
$r = printResult('Create Student Type', $stResult);
$stId = $r['body']['data']['id'] ?? null;

if ($stId) {
    printResult('Get Student Type', apiRequest('GET', "{$baseUrl}/admin/student-types/{$stId}", null, $adminToken));
    printResult('Update Student Type', apiRequest('PUT', "{$baseUrl}/admin/student-types/{$stId}", [
        'name' => 'Test Summer Student (Updated)',
        'code' => 'test_summer',
    ], $adminToken));
    printResult('Delete Student Type', apiRequest('DELETE', "{$baseUrl}/admin/student-types/{$stId}", null, $adminToken));
}

// ─── 10. Clearance Office CRUD ──────────────────────────────────────────────
echo "\n--- 10. Clearance Office Management ---\n";
printResult('List Clearance Offices', apiRequest('GET', "{$baseUrl}/admin/clearance-offices", null, $adminToken));

$coResult = apiRequest('POST', "{$baseUrl}/admin/clearance-offices", [
    'name' => 'Test Finance Office',
    'code' => 'test_finance',
    'description' => 'Test office from Phase 4 tests',
], $adminToken);
$r = printResult('Create Clearance Office', $coResult);
$coId = $r['body']['data']['id'] ?? null;

if ($coId) {
    printResult('Get Clearance Office', apiRequest('GET', "{$baseUrl}/admin/clearance-offices/{$coId}", null, $adminToken));
    printResult('Update Clearance Office', apiRequest('PUT', "{$baseUrl}/admin/clearance-offices/{$coId}", [
        'name' => 'Test Finance Office (Updated)',
        'code' => 'test_finance',
    ], $adminToken));
    printResult('Toggle Office Active', apiRequest('PATCH', "{$baseUrl}/admin/clearance-offices/{$coId}/toggle-active", null, $adminToken));
    printResult('Delete Clearance Office', apiRequest('DELETE', "{$baseUrl}/admin/clearance-offices/{$coId}", null, $adminToken));
}

// ─── 11. Workflow Configuration ──────────────────────────────────────────────
echo "\n--- 11. Workflow Configuration ---\n";
printResult('List All Workflows', apiRequest('GET', "{$baseUrl}/admin/workflows", null, $adminToken));
printResult('Show Workflow (Student Type 1)', apiRequest('GET', "{$baseUrl}/admin/workflows/1", null, $adminToken));

// ─── 12. Reports ─────────────────────────────────────────────────────────────
echo "\n--- 12. Reports ---\n";
printResult('Summary Report', apiRequest('GET', "{$baseUrl}/admin/reports/summary", null, $adminToken));
printResult('Department Report', apiRequest('GET', "{$baseUrl}/admin/reports/department?department_id=1", null, $adminToken));
printResult('College Report', apiRequest('GET', "{$baseUrl}/admin/reports/college?college_id=1", null, $adminToken));
printResult('Office Report', apiRequest('GET', "{$baseUrl}/admin/reports/office", null, $adminToken));
printResult('Pending Report', apiRequest('GET', "{$baseUrl}/admin/reports/pending", null, $adminToken));
printResult('Rejected Report', apiRequest('GET', "{$baseUrl}/admin/reports/rejected", null, $adminToken));

// ─── 13. Audit Logs ─────────────────────────────────────────────────────────
echo "\n--- 13. Audit Logs ---\n";
printResult('Get Audit Logs', apiRequest('GET', "{$baseUrl}/admin/audit-logs?page=1&per_page=10", null, $adminToken));

// ─── Done ────────────────────────────────────────────────────────────────────
echo "\n";
echo "============================================================\n";
echo "  ADMIN MANAGEMENT TESTS COMPLETE\n";
echo "============================================================\n\n";
