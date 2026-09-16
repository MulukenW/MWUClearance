<?php
/**
 * Phase 4 Features Test Script
 * Tests: Comments, Certificates, Verification, Password Reset, Change Password
 *
 * Run: php test_phase4_features.php
 * Requires: php artisan serve (on port 8000)
 */

$baseUrl = 'http://localhost:8000/api';

function apiRequest($method, $url, $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
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
    $icon = ($result['code'] >= 200 && $result['code'] < 300) ? 'PASS' : 'FAIL';
    echo "[{$icon}] [{$result['code']}] {$testName}\n";
    if ($result['code'] >= 400) {
        echo "   Error: " . ($result['body']['message'] ?? 'Unknown') . "\n";
    }
    return $result;
}

echo "\n";
echo "============================================================\n";
echo "  MWU CLEARANCE - PHASE 4 FEATURE TESTS\n";
echo "============================================================\n\n";

// ---- 1. Login as student ----
echo "--- 1. Login as Student ---\n";
$r = printResult('Student Login', apiRequest('POST', "{$baseUrl}/auth/login", [
    'email' => 'abebe.kebede@student.mwu.edu.et',
    'password' => 'password',
]));
$studentToken = $r['body']['data']['token'] ?? null;

// ---- 2. Get my certificates ----
echo "\n--- 2. Certificates (Student) ---\n";
printResult('My Certificates', apiRequest('GET', "{$baseUrl}/student/certificates", null, $studentToken));

// ---- 3. Create a clearance to have items to comment on ----
echo "\n--- 3. Create Clearance for Comment Test ---\n";
$cr = printResult('Create Clearance', apiRequest('POST', "{$baseUrl}/student/clearance", [
    'purpose' => 'Phase 4 feature testing',
], $studentToken));
$clearanceId = $cr['body']['data']['id'] ?? null;

// Get clearance items to find an item ID
$clearanceItemId = null;
if ($clearanceId) {
    $detail = apiRequest('GET', "{$baseUrl}/student/clearance/{$clearanceId}", null, $studentToken);
    if (isset($detail['body']['data']['clearance_items'][0]['id'])) {
        $clearanceItemId = $detail['body']['data']['clearance_items'][0]['id'];
    }
}

// ---- 4. Login as officer to test comments ----
echo "\n--- 4. Officer Login for Comments ---\n";
$r = printResult('Advisor Login', apiRequest('POST', "{$baseUrl}/auth/login", [
    'email' => 'advisor.cs@mwu.edu.et',
    'password' => 'password',
]));
$officerToken = $r['body']['data']['token'] ?? null;

// ---- 5. Add comment to clearance item ----
echo "\n--- 5. Clearance Comments ---\n";
if ($clearanceItemId) {
    printResult('Add Comment (Officer)', apiRequest('POST', "{$baseUrl}/clearance/items/{$clearanceItemId}/comments", [
        'comment' => 'Please provide your transcript for verification.',
        'is_internal' => false,
    ], $officerToken));

    printResult('Add Internal Comment', apiRequest('POST', "{$baseUrl}/clearance/items/{$clearanceItemId}/comments", [
        'comment' => 'Internal note: Student record checked in system.',
        'is_internal' => true,
    ], $officerToken));

    printResult('Get Comments', apiRequest('GET', "{$baseUrl}/clearance/items/{$clearanceItemId}/comments", null, $officerToken));

    // Student adds comment
    printResult('Add Comment (Student)', apiRequest('POST', "{$baseUrl}/clearance/items/{$clearanceItemId}/comments", [
        'comment' => 'I have uploaded the required documents.',
    ], $studentToken));
} else {
    echo "  [SKIP] No clearance item available for comment tests.\n";
}

// ---- 6. Login as admin for certificate tests ----
echo "\n--- 6. Admin Login for Certificate/Report Tests ---\n";
$r = printResult('Admin Login', apiRequest('POST', "{$baseUrl}/auth/login", [
    'email' => 'admin@mwu.edu.et',
    'password' => 'password',
]));
$adminToken = $r['body']['data']['token'] ?? null;

// ---- 7. Certificate endpoints (admin) ----
echo "\n--- 7. Certificates (Admin) ---\n";
printResult('List All Certificates', apiRequest('GET', "{$baseUrl}/certificates", null, $adminToken));

// ---- 8. Public verification endpoint (no auth) ----
echo "\n--- 8. Public Verification ---\n";
printResult('Verify Invalid Code', apiRequest('GET', "{$baseUrl}/verify/INVALID-CODE-12345", null, null));

// ---- 9. Password Reset Flow ----
echo "\n--- 9. Password Reset Flow ---\n";
$forgotResult = apiRequest('POST', "{$baseUrl}/auth/forgot-password", [
    'email' => 'abebe.kebede@student.mwu.edu.et',
]);
$r = printResult('Forgot Password', $forgotResult);
$resetToken = $r['body']['data']['reset_token'] ?? null;

if ($resetToken) {
    printResult('Reset Password', apiRequest('POST', "{$baseUrl}/auth/reset-password", [
        'email' => 'abebe.kebede@student.mwu.edu.et',
        'token' => $resetToken,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]));

    // Login with new password
    printResult('Login with New Password', apiRequest('POST', "{$baseUrl}/auth/login", [
        'email' => 'abebe.kebede@student.mwu.edu.et',
        'password' => 'newpassword123',
    ]));

    // Change password back
    // First get fresh token
    $r2 = apiRequest('POST', "{$baseUrl}/auth/login", [
        'email' => 'abebe.kebede@student.mwu.edu.et',
        'password' => 'newpassword123',
    ]);
    $freshToken = $r2['body']['data']['token'] ?? null;
    if ($freshToken) {
        printResult('Change Password', apiRequest('POST', "{$baseUrl}/auth/change-password", [
            'current_password' => 'newpassword123',
            'password' => 'password',
            'password_confirmation' => 'password',
        ], $freshToken));
    }
} else {
    echo "  [SKIP] Reset token not returned (app.debug may be off).\n";
}

// ---- 10. Student clearance history & stats ----
echo "\n--- 10. Student History & Statistics ---\n";
// Get first student ID
$studentsResult = apiRequest('GET', "{$baseUrl}/students?page=1&per_page=1", null, $adminToken);
$firstStudentId = $studentsResult['body']['data'][0]['id'] ?? $studentsResult['body']['data']['data'][0]['id'] ?? null;

if ($firstStudentId) {
    printResult('Student Clearance History', apiRequest('GET', "{$baseUrl}/students/{$firstStudentId}/clearance-history", null, $adminToken));
    printResult('Student Statistics', apiRequest('GET', "{$baseUrl}/students/{$firstStudentId}/statistics", null, $adminToken));
    printResult('Student Report', apiRequest('GET', "{$baseUrl}/admin/reports/student/{$firstStudentId}", null, $adminToken));
} else {
    echo "  [SKIP] No student found for history/stats tests.\n";
}

echo "\n";
echo "============================================================\n";
echo "  PHASE 4 FEATURE TESTS COMPLETE\n";
echo "============================================================\n\n";
