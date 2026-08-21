<?php

require_once __DIR__ . '/../config.php';

requireMethod('POST');
$data = getJsonInput();

if (!$data || empty($data['email']) || !isset($data['password'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Email and password are required.'
    ], 400);
}

$email = strtolower(trim($data['email']));
$password = $data['password'];

$stmt = $conn->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

$stmt->close();

if (!$user) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid email or password.'
    ], 401);
}

if (($user['role'] ?? 'student') === 'student') {
    $banCheck = $conn->prepare('SELECT reason FROM student_bans WHERE student_id = ? LIMIT 1');
    $banCheck->bind_param('i', $user['id']);
    $banCheck->execute();
    $ban = $banCheck->get_result()->fetch_assoc();
    $banCheck->close();
    if ($ban) {
        jsonResponse([
            'success' => false,
            'message' => 'This student account has been blocked by an administrator.'
        ], 403);
    }
}

$storedPassword = (string)($user['password'] ?? '');
$validPassword = password_verify($password, $storedPassword);


// Also support accounts created by the old version of register.php.
if (!$validPassword && hash_equals($storedPassword, (string)$password)) {

    $newHash = password_hash($password, PASSWORD_DEFAULT);

    $upgrade = $conn->prepare(
        'UPDATE users SET password = ? WHERE id = ?'
    );

    $upgrade->bind_param('si', $newHash, $user['id']);
    $upgrade->execute();
    $upgrade->close();

    $validPassword = true;
}


if (!$validPassword) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid email or password.'
    ], 401);
}


// Start authentication session
startAuthSession();
session_regenerate_id(true);


// Store the user's ID and role
$_SESSION['student_id'] = (int)$user['id'];
$_SESSION['role'] = $user['role'] ?? 'student';


$token = bin2hex(random_bytes(32));

jsonResponse([
    'success' => true,
    'message' => 'Login successful.',
    'token' => $token,
    'student' => publicStudent($user)
]);