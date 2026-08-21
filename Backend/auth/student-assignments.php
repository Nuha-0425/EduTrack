<?php

require_once __DIR__ . '/../config.php';

requireMethod('GET');
startAuthSession();


// Make sure the student is logged in
if (empty($_SESSION['student_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'You must be logged in.'
    ], 401);
}


$studentId = (int) $_SESSION['student_id'];


// Get the student's grade and section
$stmt = $conn->prepare(
    'SELECT
        id,
        firstName,
        lastName,
        studentId,
        grade,
        section,
        role
     FROM users
     WHERE id = ?
     LIMIT 1'
);

$stmt->bind_param('i', $studentId);
$stmt->execute();

$result = $stmt->get_result();
$student = $result->fetch_assoc();

$stmt->close();


if (!$student) {
    jsonResponse([
        'success' => false,
        'message' => 'Student account not found.'
    ], 404);
}


// Make sure this is a student account
if ($student['role'] !== 'student') {
    jsonResponse([
        'success' => false,
        'message' => 'Student access required.'
    ], 403);
}


$grade = $student['grade'];
$section = strtoupper($student['section']);


// Find assignments for this student's class
$stmt = $conn->prepare(
    'SELECT
        a.id,
        a.subject,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        c.grade,
        c.section,
        u.firstName AS teacher_firstName,
        u.lastName AS teacher_lastName
     FROM assignments a

     INNER JOIN teacher_assignments ta
        ON a.teacher_assignment_id = ta.id

     INNER JOIN classes c
        ON ta.class_id = c.id

     INNER JOIN users u
        ON ta.teacher_id = u.id

     WHERE TRIM(c.grade) = TRIM(?)
       AND UPPER(TRIM(c.section)) = UPPER(TRIM(?))

     ORDER BY a.due_date ASC, a.created_at DESC'
);


$stmt->bind_param(
    'ss',
    $grade,
    $section
);

$stmt->execute();

$result = $stmt->get_result();

$assignments = [];


while ($row = $result->fetch_assoc()) {

    $assignments[] = [
        'id' => $row['id'],
        'subject' => $row['subject'],
        'title' => $row['title'],
        'description' => $row['description'],
        'dueDate' => $row['due_date'],
        'createdAt' => $row['created_at'],
        'grade' => $row['grade'],
        'section' => $row['section'],
        'teacher' =>
            $row['teacher_firstName'] .
            ' ' .
            $row['teacher_lastName']
    ];

}


$stmt->close();


jsonResponse([
    'success' => true,

    'student' => [
        'firstName' => $student['firstName'],
        'lastName' => $student['lastName'],
        'studentId' => $student['studentId'],
        'grade' => $grade,
        'section' => $section
    ],

    'assignments' => $assignments
]);