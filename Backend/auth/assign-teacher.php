<?php

require_once __DIR__ . '/../config.php';

requireMethod('POST');
startAuthSession();


// Make sure someone is logged in
if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}


// Make sure the logged-in user is an admin
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


// Get submitted data
$data = getJsonInput();

if (
    !$data ||
    empty($data['teacher_id']) ||
    empty($data['class_id']) ||
    empty($data['subject'])
) {
    jsonResponse([
        'success' => false,
        'message' => 'Teacher, class, and subject are required.'
    ], 400);
}

$teacherId = (int) $data['teacher_id'];
$classId = (int) $data['class_id'];
$subject = trim($data['subject']);


// Check that the selected user is actually a teacher
$stmt = $conn->prepare(
    'SELECT id FROM users
     WHERE id = ? AND role = "teacher"
     LIMIT 1'
);

$stmt->bind_param('i', $teacherId);
$stmt->execute();

$result = $stmt->get_result();
$teacher = $result->fetch_assoc();

$stmt->close();

if (!$teacher) {
    jsonResponse([
        'success' => false,
        'message' => 'Selected user is not a teacher.'
    ], 400);
}


// Get the selected class
$stmt = $conn->prepare(
    'SELECT id, grade, section
     FROM classes
     WHERE id = ?
     LIMIT 1'
);

$stmt->bind_param('i', $classId);
$stmt->execute();

$result = $stmt->get_result();
$class = $result->fetch_assoc();

$stmt->close();

if (!$class) {
    jsonResponse([
        'success' => false,
        'message' => 'Selected class does not exist.'
    ], 400);
}


// Validate the subject according to the class
$grade = (string) $class['grade'];
$section = strtoupper((string) $class['section']);

$validSubjects = [];

if ($grade === '9' || $grade === '10') {

    $validSubjects = [
        'Amharic',
        'English',
        'Maths',
        'Biology',
        'Chemistry',
        'Physics',
        'Geography',
        'Economics',
        'History',
        'Citizenship',
        'Ethics',
        'ICT',
        'HPE'
    ];

} elseif ($grade === '11' || $grade === '12') {

    $validSubjects = [
        'English',
        'Maths',
        'Biology',
        'Chemistry',
        'Physics',
        'Agriculture',
        'ICT',
        'Ethics'
    ];

    if ($section === 'A' || $section === 'B') {
        $validSubjects[] = 'Health';
    }

    if ($section === 'C' || $section === 'D') {
        $validSubjects[] = 'IT';
    }
}


if (!in_array($subject, $validSubjects, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'That subject is not available for the selected class.'
    ], 400);
}


// Check for duplicate assignment
$stmt = $conn->prepare(
    'SELECT id
     FROM teacher_assignments
     WHERE teacher_id = ?
     AND class_id = ?
     AND subject = ?
     LIMIT 1'
);

$stmt->bind_param(
    'iis',
    $teacherId,
    $classId,
    $subject
);

$stmt->execute();

$result = $stmt->get_result();
$existing = $result->fetch_assoc();

$stmt->close();

if ($existing) {
    jsonResponse([
        'success' => false,
        'message' => 'This teacher is already assigned to this subject and class.'
    ], 409);
}


// Create the assignment
$stmt = $conn->prepare(
    'INSERT INTO teacher_assignments
     (teacher_id, class_id, subject)
     VALUES (?, ?, ?)'
);

$stmt->bind_param(
    'iis',
    $teacherId,
    $classId,
    $subject
);

if (!$stmt->execute()) {
    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => 'Failed to assign teacher.'
    ], 500);
}

$assignmentId = $stmt->insert_id;

$stmt->close();


jsonResponse([
    'success' => true,
    'message' => 'Teacher assigned successfully.',
    'assignment' => [
        'id' => $assignmentId,
        'teacher_id' => $teacherId,
        'class_id' => $classId,
        'subject' => $subject
    ]
]);