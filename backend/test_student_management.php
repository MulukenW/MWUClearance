<?php

/**
 * Test script for Student Management API endpoints
 * 
 * This script tests:
 * 1. Officer login
 * 2. Get students list (with pagination)
 * 3. Search students
 * 4. Filter students by department
 * 5. Get student details
 * 6. Get student clearance history
 * 7. Get student statistics
 * 8. Get students summary
 */

$baseUrl = 'http://localhost:8000/api';
$token = null;

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
echo "  Student Management API Test\n";
echo "==============================================\n\n";

// Test 1: Officer Login
echo "Test 1: Officer Login\n";
echo "-------------------------------------------\n";
$response = makeRequest('POST', $baseUrl . '/auth/login', [
    'email' => 'advisor.cs@mwu.edu.et',
    'password' => 'password'
], null);

if ($response['code'] === 200 && isset($response['body']['data']['token'])) {
    $token = $response['body']['data']['token'];
    $user = $response['body']['data']['user'];
    echo "✓ Officer logged in successfully\n";
    echo "  Name: {$user['name']}\n";
    echo "  Email: {$user['email']}\n";
    echo "  Roles: " . implode(', ', array_column($user['roles'], 'name')) . "\n";
} else {
    echo "✗ Login failed\n";
    print_r($response);
    exit(1);
}
echo "\n";

// Test 2: Get Students List
echo "Test 2: Get Students List (with pagination)\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/students?per_page=5', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $students = $response['body']['data'];
    $meta = $response['body']['meta'];
    echo "✓ Retrieved students list\n";
    echo "  Total Students: {$meta['total']}\n";
    echo "  Current Page: {$meta['current_page']}\n";
    echo "  Per Page: {$meta['per_page']}\n";
    echo "  Last Page: {$meta['last_page']}\n\n";
    
    echo "  Students:\n";
    foreach ($students as $student) {
        echo "    - {$student['student_id']}: {$student['first_name']} {$student['last_name']} ({$student['department']['name']})\n";
    }
    
    // Store first student ID for later tests
    $testStudentId = $students[0]['id'] ?? null;
} else {
    echo "✗ Failed to retrieve students\n";
    print_r($response);
}
echo "\n";

// Test 3: Search Students
echo "Test 3: Search Students\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/students/search?q=abebe', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $results = $response['body']['data'];
    echo "✓ Search completed\n";
    echo "  Results found: " . count($results) . "\n";
    foreach ($results as $result) {
        echo "    - {$result['student_id']}: {$result['name']} - {$result['email']}\n";
    }
} else {
    echo "✗ Search failed\n";
    print_r($response);
}
echo "\n";

// Test 4: Filter Students by Department
echo "Test 4: Filter Students by Department\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/students?department_id=1&per_page=10', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $students = $response['body']['data'];
    $meta = $response['body']['meta'];
    echo "✓ Filtered students by department\n";
    echo "  Total: {$meta['total']}\n";
    echo "  Students in department:\n";
    foreach ($students as $student) {
        echo "    - {$student['student_id']}: {$student['first_name']} {$student['last_name']}\n";
    }
} else {
    echo "✗ Filter failed\n";
    print_r($response);
}
echo "\n";

// Test 5: Get Student Details
if (isset($testStudentId)) {
    echo "Test 5: Get Student Details\n";
    echo "-------------------------------------------\n";
    $response = makeRequest('GET', $baseUrl . '/students/' . $testStudentId, null, $token);
    
    if ($response['code'] === 200 && isset($response['body']['data'])) {
        $student = $response['body']['data'];
        echo "✓ Retrieved student details\n";
        echo "  Student ID: {$student['student_id']}\n";
        echo "  Name: {$student['first_name']} {$student['last_name']}\n";
        echo "  Email: {$student['user']['email']}\n";
        echo "  Department: {$student['department']['name']}\n";
        echo "  Program: {$student['program']['name']}\n";
        echo "  Type: {$student['student_type']['name']}\n";
        echo "  Status: {$student['status']}\n";
        echo "  Clearance Requests: " . count($student['clearance_requests']) . "\n";
    } else {
        echo "✗ Failed to retrieve student details\n";
        print_r($response);
    }
    echo "\n";
}

// Test 6: Get Student Clearance History
if (isset($testStudentId)) {
    echo "Test 6: Get Student Clearance History\n";
    echo "-------------------------------------------\n";
    $response = makeRequest('GET', $baseUrl . '/students/' . $testStudentId . '/clearance-history', null, $token);
    
    if ($response['code'] === 200 && isset($response['body']['data'])) {
        $clearances = $response['body']['data'];
        echo "✓ Retrieved clearance history\n";
        echo "  Total Clearances: " . count($clearances) . "\n";
        
        if (count($clearances) > 0) {
            echo "\n  Clearance History:\n";
            foreach ($clearances as $clearance) {
                echo "    - {$clearance['clearance_number']}\n";
                echo "      Status: {$clearance['status']}\n";
                echo "      Submitted: {$clearance['submitted_at']}\n";
                
                if (isset($clearance['clearance_items']) && count($clearance['clearance_items']) > 0) {
                    echo "      Items:\n";
                    foreach ($clearance['clearance_items'] as $item) {
                        $office = $item['clearance_office']['name'];
                        $status = $item['status'];
                        echo "        • {$office}: {$status}\n";
                    }
                }
                echo "\n";
            }
        }
    } else {
        echo "✗ Failed to retrieve clearance history\n";
        print_r($response);
    }
    echo "\n";
}

// Test 7: Get Student Statistics
if (isset($testStudentId)) {
    echo "Test 7: Get Student Statistics\n";
    echo "-------------------------------------------\n";
    $response = makeRequest('GET', $baseUrl . '/students/' . $testStudentId . '/statistics', null, $token);
    
    if ($response['code'] === 200 && isset($response['body']['data'])) {
        $stats = $response['body']['data'];
        echo "✓ Retrieved student statistics\n";
        echo "  Total Clearances: {$stats['total_clearances']}\n";
        echo "  Completed: {$stats['completed_clearances']}\n";
        echo "  In Progress: {$stats['in_progress_clearances']}\n";
        echo "  Rejected: {$stats['rejected_clearances']}\n";
        echo "  Completion Rate: {$stats['completion_rate']}%\n";
        
        if ($stats['average_completion_hours']) {
            echo "  Average Completion Time: {$stats['average_completion_hours']} hours\n";
        }
    } else {
        echo "✗ Failed to retrieve statistics\n";
        print_r($response);
    }
    echo "\n";
}

// Test 8: Get Students Summary
echo "Test 8: Get Students Summary\n";
echo "-------------------------------------------\n";
$response = makeRequest('GET', $baseUrl . '/students/summary', null, $token);

if ($response['code'] === 200 && isset($response['body']['data'])) {
    $summary = $response['body']['data'];
    echo "✓ Retrieved students summary\n";
    echo "  Total Students: {$summary['total']}\n";
    echo "  Active: {$summary['active']}\n";
    echo "  Inactive: {$summary['inactive']}\n";
    echo "  Graduated: {$summary['graduated']}\n";
    
    if (isset($summary['by_type']) && count($summary['by_type']) > 0) {
        echo "\n  Students by Type:\n";
        foreach ($summary['by_type'] as $type) {
            echo "    - {$type['type']}: {$type['count']}\n";
        }
    }
} else {
    echo "✗ Failed to retrieve summary\n";
    print_r($response);
}
echo "\n";

// Test 9: Admin Access (if admin token available)
echo "Test 9: Admin Login and Full Access\n";
echo "-------------------------------------------\n";
$response = makeRequest('POST', $baseUrl . '/auth/login', [
    'email' => 'admin@mwu.edu.et',
    'password' => 'password'
], null);

if ($response['code'] === 200 && isset($response['body']['data']['token'])) {
    $adminToken = $response['body']['data']['token'];
    echo "✓ Admin logged in successfully\n";
    
    // Admin should see all students
    $response = makeRequest('GET', $baseUrl . '/students?per_page=100', null, $adminToken);
    
    if ($response['code'] === 200 && isset($response['body']['meta'])) {
        $meta = $response['body']['meta'];
        echo "✓ Admin can see all students\n";
        echo "  Total Students (all departments): {$meta['total']}\n";
    }
} else {
    echo "✗ Admin login failed\n";
}
echo "\n";

echo "==============================================\n";
echo "  All Student Management Tests Complete!\n";
echo "==============================================\n";
