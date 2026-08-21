<?php

require_once __DIR__ . '/../config.php';

requireMethod('GET');
startAuthSession();


// Make sure someone is logged in
if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}


$teacherId = (int) $_SESSION['student_id'];


// Make sure the logged-in user is actually a teacher
$stmt = $conn->prepare(
    'SELECT id, firstName, lastName, teacherId, role
     FROM users
     WHERE id = ?
     LIMIT 1'
);

$stmt->bind_param('i', $teacherId);
$stmt->execute();

$result = $stmt->get_result();
$teacher = $result->fetch_assoc();

$stmt->close();


if (!$teacher || $teacher['role'] !== 'teacher') {
    jsonResponse([
        'success' => false,
        'message' => 'Teacher access required.'
    ], 403);
}


// Get only this teacher's assigned classes
$stmt = $conn->prepare(
    'SELECT
        ta.id AS assignment_id,
        ta.subject,
        c.id AS class_id,
        c.grade,
        c.section
     FROM teacher_assignments ta
     INNER JOIN classes c ON ta.class_id = c.id
     WHERE ta.teacher_id = ?
     ORDER BY CAST(c.grade AS UNSIGNED), c.section, ta.subject'
);

$stmt->bind_param('i', $teacherId);
$stmt->execute();

$result = $stmt->get_result();

$classes = [];

while ($row = $result->fetch_assoc()) {

    $classes[] = [
        'assignmentId' => $row['assignment_id'],
        'classId' => $row['class_id'],
        'grade' => $row['grade'],
        'section' => $row['section'],
        'subject' => $row['subject']
    ];

}

$stmt->close();


jsonResponse([
    'success' => true,

    'teacher' => [
        'id' => $teacher['id'],
        'firstName' => $teacher['firstName'],
        'lastName' => $teacher['lastName'],
        'teacherId' => $teacher['teacherId']
    ],

    'classes' => $classes
]);