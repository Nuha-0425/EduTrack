<?php
require_once __DIR__ . '/../config.php';

$studentDbId = requireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $studentDbId);
    $stmt->execute();
    $student = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$student) {
        jsonResponse(['success' => false, 'message' => 'Student account not found.'], 404);
    }
    jsonResponse(['success' => true, 'student' => publicStudent($student)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = getJsonInput();
if (!$data) {
    jsonResponse(['success' => false, 'message' => 'Invalid JSON data.'], 400);
}

$firstName = trim($data['firstName'] ?? '');
$lastName = trim($data['lastName'] ?? '');
$phone = trim($data['phone'] ?? '');
$gender = trim($data['gender'] ?? '');
$dateOfBirth = trim($data['dateOfBirth'] ?? '');
$grade = trim($data['grade'] ?? '');

if ($firstName === '' || $lastName === '' || $phone === '') {
    jsonResponse(['success' => false, 'message' => 'First name, last name, and phone are required.'], 400);
}

$stmt = $conn->prepare(
    'UPDATE users SET firstName = ?, lastName = ?, phone = ?, gender = ?, dateOfBirth = ?, grade = ? WHERE id = ?'
);
$stmt->bind_param('ssssssi', $firstName, $lastName, $phone, $gender, $dateOfBirth, $grade, $studentDbId);

if (!$stmt->execute()) {
    $stmt->close();
    jsonResponse(['success' => false, 'message' => 'Could not update your profile.'], 400);
}
$stmt->close();

$stmt = $conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $studentDbId);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();
$stmt->close();

jsonResponse([
    'success' => true,
    'message' => 'Profile updated successfully.',
    'student' => publicStudent($student)
]);
