<?php

/**
 * Test script for Admin Dashboard API endpoints
 * 
 * This script tests:
 * 1. Admin login
 * 2. Get dashboard statistics
 * 3. Get all users (with filters)
 * 4. Get single user details
 * 5. Create new user
 * 6. Update user
 * 7. Get system configuration
 * 8. Get audit logs
 * 9. Get system statistics summary
 */

$baseUrl = 'http://localhost:8000/api';
$token = null;
$testUserId = null;

// Helper function to make API requests
function makeRequest($method, $url, $data = null, $token = null) {
    $ch = curl_init();
    
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data && ($method === 'POST' || $method === 'PUT')) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

echo "==============================================\n";
echo "  Admin Dashboard API Test\n";
echo "==============================================\n\n";

// Test 1: Admin Login
echo "Test 1: Admin Login\n";
echo "-------------------------------------------\n";
$response = makeRequest('POST', $baseUrl . '/auth/login', [
    'email' => 'admin@mwu.edu.et',
    'password' => 'password'
], null);

if ($response['code'] === 200 && isset($response['body']['data']['token'])) {
    $token = $response['body']['data']['token'];
    $user = $response['body']['data']['user'];
    echo "✓ Admin logged in successfully\n";
    echo "  Name: {$user['name']}\n";
    echo "  Email: {$user['email']}\n";
} else {
    echo "✗ Login failed\n";
    print_r($response);
    exit(1);
}
echo "\n";

// Test 2: Get Dashboard Statistics
echo "Test 2: Get Dashboard Statistics\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/dashboard', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $data = $response['body']['data'];
    echo "✓ Retrieved dashboard statistics\n\n";
    
    echo "  Students:\n";
    echo "    Total: {$data['students']['total']}\n";
    echo "    Active: {$data['students']['active']}\n";
    if (isset($data['students']['by_type']) && count($data['students']['by_type']) > 0) {
        echo "    By Type:\n";
        foreach ($data['students']['by_type'] as $type) {
            echo "      - {$type['type']}: {$type['count']}\n";
        }
    }
    
    echo "\n  Clearances:\n";
    echo "    Total: {$data['clearances']['total']}\n";
    echo "    Completed: {$data['clearances']['completed']}\n";
    echo "    In Progress: {$data['clearances']['in_progress']}\n";
    echo "    Rejected: {$data['clearances']['rejected']}\n";
    if (isset($data['clearances']['average_completion_hours'])) {
        echo "    Avg Completion Time: {$data['clearances']['average_completion_hours']} hours\n";
    }
    
    echo "\n  Users:\n";
    echo "    Total: {$data['users']['total']}\n";
    
    echo "\n  Recent Clearances: " . count($data['clearances']['recent']) . "\n";
    if (count($data['clearances']['recent']) > 0) {
        foreach (array_slice($data['clearances']['recent'], 0, 3) as $clearance) {
            echo "    - {$clearance['clearance_number']}: {$clearance['student_name']} ({$clearance['status']})\n";
        }
    }
    
    echo "\n  Office Workload:\n";
    if (isset($data['offices']['workload']) && count($data['offices']['workload']) > 0) {
        foreach ($data['offices']['workload'] as $office) {
            echo "    - {$office['office']}: {$office['pending']} pending, {$office['approved']} approved\n";
        }
    }
} else {
    echo "✗ Failed to retrieve dashboard\n";
    print_r($response);
}
echo "\n";

// Test 3: Get All Users
echo "Test 3: Get All Users (with pagination)\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/users?per_page=5', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $users = $response['body']['data'];
    $meta = $response['body']['meta'];
    echo "✓ Retrieved users list\n";
    echo "  Total Users: {$meta['total']}\n";
    echo "  Current Page: {$meta['current_page']}\n";
    echo "  Per Page: {$meta['per_page']}\n\n";
    
    echo "  Users:\n";
    foreach ($users as $user) {
        $roles = isset($user['roles']) && is_array($user['roles']) 
            ? implode(', ', array_column($user['roles'], 'name'))
            : 'No roles';
        echo "    - {$user['name']} ({$user['email']}) - Roles: {$roles}\n";
    }
    
    // Store a non-admin user ID for later tests
    foreach ($users as $user) {
        $userRoles = isset($user['roles']) ? array_column($user['roles'], 'name') : [];
        if (!in_array('admin', $userRoles) && !in_array('student', $userRoles)) {
            $testUserId = $user['id'];
            break;
        }
    }
} else {
    echo "✗ Failed to retrieve users\n";
    print_r($response);
}
echo "\n";

// Test 4: Get Single User Details
if ($testUserId) {
    echo "Test 4: Get Single User Details\n";
    echo "-------------------------------------------\n";
    $response = makeRequest('GET', $baseUrl . '/admin/users/' . $testUserId, null, $token);
    
    if ($response['code'] === 200 && isset($response['body']['data'])) {
        $user = $response['body']['data'];
        echo "✓ Retrieved user details\n";
        echo "  Name: {$user['name']}\n";
        echo "  Email: {$user['email']}\n";
        echo "  Active: " . ($user['is_active'] ? 'Yes' : 'No') . "\n";
        
        if (isset($user['roles']) && is_array($user['roles']) && count($user['roles']) > 0) {
            echo "  Roles:\n";
            foreach ($user['roles'] as $role) {
                echo "    - {$role['name']}\n";
            }
        }
        
        if (isset($user['department'])) {
            echo "  Department: {$user['department']['name']}\n";
        }
    } else {
        echo "✗ Failed to retrieve user details\n";
        print_r($response);
    }
    echo "\n";
}

// Test 5: Create New User
echo "Test 5: Create New User\n";
echo "-------------------------------------------\n";
$response = makeRequest('POST', $baseUrl . '/admin/users', [
    'name' => 'Test Officer',
    'email' => 'test.officer.' . time() . '@mwu.edu.et',
    'password' => 'password123',
    'roles' => ['library'],
    'clearance_office_id' => 4, // Library office
], $token);

if ($response['code'] === 201 && isset($response['body']['data'])) {
    $newUser = $response['body']['data'];
    $testUserId = $newUser['id'];
    echo "✓ User created successfully\n";
    echo "  ID: {$newUser['id']}\n";
    echo "  Name: {$newUser['name']}\n";
    echo "  Email: {$newUser['email']}\n";
} else {
    echo "✗ Failed to create user\n";
    print_r($response);
}
echo "\n";

// Test 6: Update User
if ($testUserId) {
    echo "Test 6: Update User\n";
    echo "-------------------------------------------\n";
    $response = makeRequest('PUT', $baseUrl . '/admin/users/' . $testUserId, [
        'name' => 'Test Officer Updated',
        'is_active' => true,
    ], $token);
    
    if ($response['code'] === 200 && isset($response['body']['data'])) {
        $updatedUser = $response['body']['data'];
        echo "✓ User updated successfully\n";
        echo "  Name: {$updatedUser['name']}\n";
        echo "  Active: " . ($updatedUser['is_active'] ? 'Yes' : 'No') . "\n";
    } else {
        echo "✗ Failed to update user\n";
        print_r($response);
    }
    echo "\n";
}

// Test 7: Get System Configuration
echo "Test 7: Get System Configuration\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/system-config', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $config = $response['body']['data'];
    echo "✓ Retrieved system configuration\n";
    echo "  Colleges: " . count($config['colleges']) . "\n";
    echo "  Departments: " . count($config['departments']) . "\n";
    echo "  Programs: " . count($config['programs']) . "\n";
    echo "  Student Types: " . count($config['student_types']) . "\n";
    echo "  Clearance Offices: " . count($config['clearance_offices']) . "\n";
    echo "  Roles: " . count($config['roles']) . "\n";
    
    echo "\n  Student Types:\n";
    foreach ($config['student_types'] as $type) {
        echo "    - {$type['name']} ({$type['code']})\n";
    }
    
    echo "\n  Clearance Offices (in order):\n";
    foreach ($config['clearance_offices'] as $office) {
        echo "    {$office['order']}. {$office['name']} ({$office['code']})\n";
    }
} else {
    echo "✗ Failed to retrieve system configuration\n";
    print_r($response);
}
echo "\n";

// Test 8: Get Audit Logs
echo "Test 8: Get Audit Logs\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/audit-logs?per_page=10', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $logs = $response['body']['data'];
    $meta = $response['body']['meta'];
    echo "✓ Retrieved audit logs\n";
    echo "  Total Logs: {$meta['total']}\n";
    echo "  Showing: " . count($logs) . " logs\n";
    
    if (count($logs) > 0) {
        echo "\n  Recent Audit Logs:\n";
        foreach (array_slice($logs, 0, 5) as $log) {
            $userName = isset($log['user']) ? $log['user']['name'] : 'System';
            echo "    - {$log['action']} by {$userName} at {$log['created_at']}\n";
        }
    }
} else {
    echo "✗ Failed to retrieve audit logs\n";
    print_r($response);
}
echo "\n";

// Test 9: Get System Statistics Summary
echo "Test 9: Get System Statistics Summary\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/statistics', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $stats = $response['body']['data'];
    echo "✓ Retrieved system statistics\n\n";
    
    echo "  Students:\n";
    echo "    Total: {$stats['students']['total']}\n";
    echo "    Active: {$stats['students']['active']}\n";
    
    echo "\n  Clearances:\n";
    echo "    Total: {$stats['clearances']['total']}\n";
    echo "    Completed: {$stats['clearances']['completed']}\n";
    echo "    In Progress: {$stats['clearances']['in_progress']}\n";
    echo "    Completion Rate: {$stats['clearances']['completion_rate']}%\n";
    
    echo "\n  Users:\n";
    echo "    Total: {$stats['users']['total']}\n";
    echo "    Active: {$stats['users']['active']}\n";
    
    echo "\n  Notifications:\n";
    echo "    Total: {$stats['notifications']['total']}\n";
    echo "    Unread: {$stats['notifications']['unread']}\n";
} else {
    echo "✗ Failed to retrieve statistics\n";
    print_r($response);
}
echo "\n";

// Test 10: Filter Users by Role
echo "Test 10: Filter Users by Role\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/admin/users?role=advisor', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $users = $response['body']['data'];
    $meta = $response['body']['meta'];
    echo "✓ Filtered users by role\n";
    echo "  Advisors found: {$meta['total']}\n";
    
    foreach ($users as $user) {
        echo "    - {$user['name']} ({$user['email']})\n";
    }
} else {
    echo "✗ Failed to filter users\n";
    print_r($response);
}
echo "\n";

echo "==============================================\n";
echo "  All Admin Dashboard Tests Complete!\n";
echo "==============================================\n";
