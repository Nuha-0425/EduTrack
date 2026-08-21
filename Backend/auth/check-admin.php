<?php

require_once __DIR__ . '/../config.php';

requireMethod('GET');
startAuthSession();

if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}

$userId = (int) $_SESSION['student_id'];

$stmt = $conn->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $userId);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

$stmt->close();

if (!$user || $user['role'] !== 'admin') {
    jsonResponse([
        'success' => false,
        'message' => 'Admin access required.'
    ], 403);
}

jsonResponse([
    'success' => true,
    'message' => 'Admin access granted.'
]);
