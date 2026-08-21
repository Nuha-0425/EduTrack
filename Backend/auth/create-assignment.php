<?php

require_once __DIR__ . '/../config.php';

requireMethod('POST');
startAuthSession();


// Make sure the teacher is logged in
if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}


$teacherId = (int) $_SESSION['student_id'];


// Get input
$data = getJsonInput();

if (
    !$data ||
    empty($data['teacher_assignment_id']) ||
    empty($data['title']) ||
    empty($data['due_date'])
) {
    jsonResponse([
        'success' => false,
        'message' => 'Class, title, and due date are required.'
    ], 400);
}


$teacherAssignmentId =
    (int) $data['teacher_assignment_id'];

$title =
    trim($data['title']);

$description =
    trim($data['description'] ?? '');

$dueDate =
    trim($data['due_date']);


// Verify that this assignment belongs to the logged-in teacher
$stmt = $conn->prepare(
    'SELECT
        ta.id,
        ta.subject,
        c.grade,
        c.section
     FROM teacher_assignments ta
     INNER JOIN classes c
        ON ta.class_id = c.id
     WHERE ta.id = ?
     AND ta.teacher_id = ?
     LIMIT 1'
);

$stmt->bind_param(
    'ii',
    $teacherAssignmentId,
    $teacherId
);

$stmt->execute();

$result =
    $stmt->get_result();

$teacherAssignment =
    $result->fetch_assoc();

$stmt->close();


if (!$teacherAssignment) {

    jsonResponse([
        'success' => false,
        'message' => 'You are not assigned to this class.'
    ], 403);

}


// Create assignment
$subject =
    $teacherAssignment['subject'];


$stmt = $conn->prepare(
    'INSERT INTO assignments
    (teacher_assignment_id, subject, title, description, due_date)
    VALUES (?, ?, ?, ?, ?)'
);

$stmt->bind_param(
    'issss',
    $teacherAssignmentId,
    $subject,
    $title,
    $description,
    $dueDate
);


if (!$stmt->execute()) {

    $stmt->close();

    jsonResponse([
        'success' => false,
        'message' => 'Failed to create assignment.'
    ], 500);

}


$assignmentId =
    $stmt->insert_id;

$stmt->close();


jsonResponse([
    'success' => true,
    'message' => 'Assignment published successfully.',
    'assignment' => [
        'id' => $assignmentId,
        'subject' => $subject,
        'title' => $title,
        'description' => $description,
        'due_date' => $dueDate
    ]
]);