<?php

require_once __DIR__ . '/../config.php';

requireMethod('POST');
startAuthSession();


// Check that the person is logged in
if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}


// Check that the person is an admin
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


// Get the teacher information
$data = getJsonInput();

if (
    !$data ||
    empty($data['firstName']) ||
    empty($data['lastName']) ||
    empty($data['email']) ||
    empty($data['teacherId']) ||
    empty($data['password'])
) {
    jsonResponse([
        'success' => false,
        'message' => 'First name, last name, email, teacher ID, and password are required.'
    ], 400);
}


$firstName = trim($data['firstName']);
$lastName = trim($data['lastName']);
$email = strtolower(trim($data['email']));
$teacherId = trim($data['teacherId']);
$password = $data['password'];


// Check whether email already exists
$stmt = $conn->prepare(
    'SELECT id FROM users WHERE email = ? LIMIT 1'
);

$stmt->bind_param('s', $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->fetch_assoc()) {
    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => 'This email is already registered.'
    ], 409);
}

$stmt->close();


// Check whether teacher ID already exists
$stmt = $conn->prepare(
    'SELECT id FROM users WHERE teacherId = ? LIMIT 1'
);

$stmt->bind_param('s', $teacherId);
$stmt->execute();

$result = $stmt->get_result();

if ($result->fetch_assoc()) {
    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => 'This Teacher ID is already in use.'
    ], 409);
}

$stmt->close();


// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);


// Create the teacher account
$stmt = $conn->prepare(
    'INSERT INTO users
    (email, password, role, firstName, lastName, teacherId)
    VALUES (?, ?, "teacher", ?, ?, ?)'
);

$stmt->bind_param(
    'sssss',
    $email,
    $hashedPassword,
    $firstName,
    $lastName,
    $teacherId
);

if (!$stmt->execute()) {
    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => 'Failed to create teacher account.'
    ], 500);
}

$teacherDatabaseId = $stmt->insert_id;

$stmt->close();


jsonResponse([
    'success' => true,
    'message' => 'Teacher account created successfully.',
    'teacher' => [
        'id' => $teacherDatabaseId,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'teacherId' => $teacherId,
        'role' => 'teacher'
    ]
]);