<?php
require_once __DIR__ . '/config.php';


requireMethod('POST');
$data = getJsonInput();


if (!$data) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid or missing JSON data.'
    ], 400);
}


$required = [
    'firstName',
    'lastName',
    'studentId',
    'gender',
    'dateOfBirth',
    'grade',
    'section',
    'email',
    'phone',
    'password'
];

foreach ($required as $field) {
    if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
        jsonResponse([
            'success' => false,
            'message' => ucfirst($field) . ' is required.'
        ], 400);
    }
}


$firstName = trim($data['firstName']);
$lastName = trim($data['lastName']);
$studentId = trim($data['studentId']);
$gender = trim($data['gender']);
$dateOfBirth = trim($data['dateOfBirth']);
$grade = trim($data['grade']);
$section = strtoupper(trim($data['section']));
$email = strtolower(trim($data['email']));
$phone = trim($data['phone']);
$password = $data['password'];


// Validate grade
$validGrades = ['9', '10', '11', '12'];

if (!in_array($grade, $validGrades, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid grade selected.'
    ], 400);
}


// Validate section
$validSections = ['A', 'B', 'C', 'D', 'E'];

if (!in_array($section, $validSections, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid section selected.'
    ], 400);
}


// Grade 11 and 12 only have sections A-D
if (($grade === '11' || $grade === '12') && $section === 'E') {
    jsonResponse([
        'success' => false,
        'message' => 'Grade 11 and 12 only have sections A-D.'
    ], 400);
}


// Check for existing email or Student ID
$check = $conn->prepare(
    'SELECT id FROM users WHERE email = ? OR studentId = ? LIMIT 1'
);

$check->bind_param('ss', $email, $studentId);
$check->execute();

$existing = $check->get_result()->fetch_assoc();

$check->close();


if ($existing) {
    jsonResponse([
        'success' => false,
        'message' => 'That email or Student ID is already registered.'
    ], 409);
}


// Hash password
$passwordHash = password_hash($password, PASSWORD_DEFAULT);


// Insert new student
$stmt = $conn->prepare(
    'INSERT INTO users (
        firstName,
        lastName,
        studentId,
        gender,
        dateOfBirth,
        grade,
        section,
        email,
        phone,
        password
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$stmt->bind_param(
    'ssssssssss',
    $firstName,
    $lastName,
    $studentId,
    $gender,
    $dateOfBirth,
    $grade,
    $section,
    $email,
    $phone,
    $passwordHash
);


if (!$stmt->execute()) {

    $message = $stmt->errno == 1062
        ? 'That email or Student ID is already registered.'
        : 'Could not create the account.';

    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => $message
    ], 400);
}


$stmt->close();


jsonResponse([
    'success' => true,
    'message' => 'Account created successfully.'
]);