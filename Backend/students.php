<?php
require_once __DIR__ . '/config.php';

requireMethod('GET');

$adminId = requireLogin();

$roleStmt = $conn->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
$roleStmt->bind_param('i', $adminId);
$roleStmt->execute();
$adminUser = $roleStmt->get_result()->fetch_assoc();
$roleStmt->close();

if (!$adminUser || $adminUser['role'] !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Admin access required.'], 403);
}

$query = trim($_GET['q'] ?? '');

if ($query === '') {
    $stmt = $conn->prepare(
        "SELECT id, firstName, lastName, studentId, gender, dateOfBirth, grade, section, email, phone, created_at
         FROM users WHERE role = 'student' ORDER BY id DESC"
    );
} else {
    $like = '%' . $query . '%';
    $stmt = $conn->prepare(
        "SELECT id, firstName, lastName, studentId, gender, dateOfBirth, grade, section, email, phone, created_at
         FROM users
         WHERE role = 'student'
           AND (firstName LIKE ? OR lastName LIKE ? OR studentId LIKE ? OR email LIKE ?)
         ORDER BY id DESC"
    );
    $stmt->bind_param('ssss', $like, $like, $like, $like);
}

$stmt->execute();
$result = $stmt->get_result();
$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = publicStudent($row);
}
$stmt->close();

jsonResponse(['success' => true, 'students' => $students]);
