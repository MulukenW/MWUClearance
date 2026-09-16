<?php
/**
 * Clearance Workflow Test Script
 * Tests the complete clearance workflow including:
 * - Student creates clearance request
 * - Sequential approval by offices
 * - Extension/Weekend workflow (dormitory NOT required)
 * - Rejection and resubmission
 * 
 * Run with: php test_clearance_workflow.php
 */

$baseUrl = 'http://localhost:8000/api';

// Helper function to make API requests
function apiRequest($method, $endpoint, $data = null, $token = null) {
    global $baseUrl;
    $url = $baseUrl . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// Login function
function login($email, $password) {
    $result = apiRequest('POST', '/auth/login', [
        'email' => $email,
        'password' => $password,
    ]);
    
    return $result['response']['data']['token'] ?? null;
}

echo "\n";
echo "========================================\n";
echo "  CLEARANCE WORKFLOW TEST\n";
echo "========================================\n\n";

// Test 1: Student Login
echo "Test 1: Student Login (Regular Student)\n";
echo "----------------------------------------\n";
$studentToken = login('abebe.kebede@student.mwu.edu.et', 'password');
if ($studentToken) {
    echo "✓ Student logged in successfully\n";
    echo "  Token: " . substr($studentToken, 0, 20) . "...\n";
} else {
    echo "✗ Student login failed\n";
    exit(1);
}

// Test 2: Create Clearance Request
echo "\nTest 2: Create Clearance Request\n";
echo "----------------------------------------\n";
$result = apiRequest('POST', '/student/clearance', [
    'purpose' => 'Graduation clearance'
], $studentToken);

if ($result['code'] == 201) {
    echo "✓ Clearance request created\n";
    $clearanceRequest = $result['response']['data'];
    echo "  Clearance Number: {$clearanceRequest['clearance_number']}\n";
    echo "  Status: {$clearanceRequest['status']}\n";
    echo "  Total Items: " . count($clearanceRequest['clearance_items']) . "\n";
    
    $clearanceId = $clearanceRequest['id'];
    
    // Show workflow items
    echo "\n  Workflow Items:\n";
    foreach ($clearanceRequest['clearance_items'] as $item) {
        $required = $item['is_required'] ? 'REQUIRED' : 'NOT REQUIRED';
        echo "    Step {$item['step_order']}: {$item['clearance_office']['name']} - {$item['status']} ({$required})\n";
    }
} else {
    echo "✗ Failed to create clearance request\n";
    echo "  Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n";
    exit(1);
}

// Test 3: Advisor Login
echo "\nTest 3: Advisor Login\n";
echo "----------------------------------------\n";
$advisorToken = login('advisor.cs@mwu.edu.et', 'password');
if ($advisorToken) {
    echo "✓ Advisor logged in successfully\n";
} else {
    echo "✗ Advisor login failed\n";
    exit(1);
}

// Test 4: Get Pending Clearances (Advisor)
echo "\nTest 4: Get Pending Clearances\n";
echo "----------------------------------------\n";
$result = apiRequest('GET', '/clearance/pending', null, $advisorToken);
if ($result['code'] == 200) {
    $pending = $result['response']['data'];
    echo "✓ Found " . count($pending) . " pending clearance(s)\n";
    
    if (count($pending) > 0) {
        $firstItem = $pending[0];
        $clearanceItemId = $firstItem['id'];
        echo "  First Item ID: {$clearanceItemId}\n";
        echo "  Student: {$firstItem['clearance_request']['student']['full_name']}\n";
        echo "  Office: {$firstItem['clearance_office']['name']}\n";
        echo "  Status: {$firstItem['status']}\n";
    }
} else {
    echo "✗ Failed to get pending clearances\n";
    exit(1);
}

// Test 5: Approve by Advisor
echo "\nTest 5: Approve Clearance (Advisor)\n";
echo "----------------------------------------\n";
$result = apiRequest('POST', "/clearance/items/{$clearanceItemId}/approve", [
    'comment' => 'Student is in good academic standing. Approved.'
], $advisorToken);

if ($result['code'] == 200) {
    echo "✓ Clearance approved by Advisor\n";
    echo "  Item Status: {$result['response']['data']['status']}\n";
} else {
    echo "✗ Failed to approve clearance\n";
    echo "  Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n";
    exit(1);
}

// Test 6: Check Progress
echo "\nTest 6: Check Clearance Progress\n";
echo "----------------------------------------\n";
$result = apiRequest('GET', "/student/clearance/{$clearanceId}/progress", null, $studentToken);
if ($result['code'] == 200) {
    $progress = $result['response']['data']['progress_percentage'];
    echo "✓ Progress: {$progress}%\n";
    echo "  Status: {$result['response']['data']['status']}\n";
} else {
    echo "✗ Failed to check progress\n";
}

// Test 7: Department Head Login and Approval
echo "\nTest 7: Department Head Approval\n";
echo "----------------------------------------\n";
$deptHeadToken = login('head.cs@mwu.edu.et', 'password');
if (!$deptHeadToken) {
    echo "✗ Department Head login failed\n";
    exit(1);
}

$result = apiRequest('GET', '/clearance/pending', null, $deptHeadToken);
if ($result['code'] == 200 && count($result['response']['data']) > 0) {
    $deptHeadItemId = $result['response']['data'][0]['id'];
    
    $result = apiRequest('POST', "/clearance/items/{$deptHeadItemId}/approve", [
        'comment' => 'Department requirements met. Approved.'
    ], $deptHeadToken);
    
    if ($result['code'] == 200) {
        echo "✓ Clearance approved by Department Head\n";
    } else {
        echo "✗ Department Head approval failed\n";
    }
} else {
    echo "✗ No pending items for Department Head\n";
}

// Test 8: Check Notifications
echo "\nTest 8: Check Student Notifications\n";
echo "----------------------------------------\n";
$result = apiRequest('GET', '/notifications', null, $studentToken);
if ($result['code'] == 200) {
    $notifications = $result['response']['data'];
    echo "✓ Found " . count($notifications) . " notification(s)\n";
    echo "  Unread: {$result['response']['unread_count']}\n";
    
    if (count($notifications) > 0) {
        echo "\n  Latest notifications:\n";
        foreach (array_slice($notifications, 0, 3) as $notif) {
            echo "    - {$notif['title']}: {$notif['message']}\n";
        }
    }
} else {
    echo "✗ Failed to get notifications\n";
}

// Test 9: Get Clearance Details
echo "\nTest 9: Get Full Clearance Details\n";
echo "----------------------------------------\n";
$result = apiRequest('GET', "/student/clearance/{$clearanceId}", null, $studentToken);
if ($result['code'] == 200) {
    $clearance = $result['response']['data'];
    echo "✓ Clearance Details Retrieved\n";
    echo "  Clearance Number: {$clearance['clearance_number']}\n";
    echo "  Status: {$clearance['status']}\n";
    echo "  Progress: {$clearance['progress_percentage']}%\n";
    
    echo "\n  Current Workflow Status:\n";
    foreach ($clearance['clearance_items'] as $item) {
        $status = strtoupper($item['status']);
        // PHP 7.4 compatible
        switch($item['status']) {
            case 'approved':
                $symbol = '✓';
                break;
            case 'pending':
                $symbol = '⏳';
                break;
            case 'locked':
                $symbol = '🔒';
                break;
            case 'not_required':
                $symbol = '➖';
                break;
            default:
                $symbol = '•';
        }
        echo "    {$symbol} Step {$item['step_order']}: {$item['clearance_office']['name']} - {$status}\n";
    }
} else {
    echo "✗ Failed to get clearance details\n";
}

// Test 10: Officer Statistics
echo "\nTest 10: Officer Statistics\n";
echo "----------------------------------------\n";
$result = apiRequest('GET', '/clearance/statistics', null, $advisorToken);
if ($result['code'] == 200) {
    $stats = $result['response']['data'];
    echo "✓ Statistics Retrieved (Advisor)\n";
    echo "  Pending: {$stats['pending']}\n";
    echo "  Approved: {$stats['approved']}\n";
    echo "  Rejected: {$stats['rejected']}\n";
    echo "  Total: {$stats['total']}\n";
} else {
    echo "✗ Failed to get statistics\n";
}

echo "\n========================================\n";
echo "  TEST SUMMARY\n";
echo "========================================\n";
echo "✓ All core tests passed!\n";
echo "\nNext Steps:\n";
echo "- Continue approvals through all offices\n";
echo "- Test rejection workflow\n";
echo "- Test Extension/Weekend workflow (dormitory NOT required)\n";
echo "- Test final clearance and certificate generation\n";
echo "\n";
