<?php
/**
 * Authentication Test Script
 * Run this with: php test_auth.php
 */

// Test login endpoint
function testLogin($email, $password) {
    $url = 'http://localhost:8000/api/auth/login';
    
    $data = [
        'email' => $email,
        'password' => $password,
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "\n========================================\n";
    echo "Testing Login: $email\n";
    echo "========================================\n";
    echo "HTTP Code: $httpCode\n";
    echo "Response: " . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";
    
    $result = json_decode($response, true);
    return $result['data']['token'] ?? null;
}

// Test me endpoint (get current user)
function testMe($token) {
    $url = 'http://localhost:8000/api/auth/me';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "\n========================================\n";
    echo "Testing /auth/me Endpoint\n";
    echo "========================================\n";
    echo "HTTP Code: $httpCode\n";
    echo "Response: " . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";
}

// Test logout endpoint
function testLogout($token) {
    $url = 'http://localhost:8000/api/auth/logout';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "\n========================================\n";
    echo "Testing Logout\n";
    echo "========================================\n";
    echo "HTTP Code: $httpCode\n";
    echo "Response: " . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";
}

// Run tests
echo "\n";
echo "====================================\n";
echo "  MWU CLEARANCE AUTHENTICATION TEST\n";
echo "====================================\n";

// Test 1: Login with admin credentials
$token = testLogin('admin@mwu.edu.et', 'password');

if ($token) {
    // Test 2: Get current user
    testMe($token);
    
    // Test 3: Logout
    testLogout($token);
} else {
    echo "\n❌ Login failed. Make sure the server is running: php artisan serve\n";
}

// Test 4: Login with invalid credentials
testLogin('invalid@email.com', 'wrongpassword');

echo "\n";
echo "====================================\n";
echo "  TESTS COMPLETE\n";
echo "====================================\n";
echo "\n";
