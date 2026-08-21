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

$adminId = (int) $_SESSION['student_id'];

$stmt = $conn->prepare(
    'SELECT role FROM users WHERE id = ? LIMIT 1'
);

$stmt->bind_param('i', $adminId);
$stmt->execute();

$result = $stmt->get_result();
$admin = $result->fetch_assoc();

$stmt->close();

if (!$admin || $admin['role'] !== 'admin') {
    jsonResponse([
        'success' => false,
        'message' => 'Admin access required.'
    ], 403);
}


$stmt = $conn->prepare(
    'SELECT id, grade, section
     FROM classes
     ORDER BY CAST(grade AS UNSIGNED), section'
);

$stmt->execute();

$result = $stmt->get_result();

$classes = [];

while ($class = $result->fetch_assoc()) {
    $classes[] = $class;
}

$stmt->close();


jsonResponse([
    'success' => true,
    'classes' => $classes
]);