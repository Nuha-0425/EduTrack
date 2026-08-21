<?php

require_once __DIR__ . '/../config.php';

requireMethod('GET');
startAuthSession();

if (empty($_SESSION['student_id'])) {
    jsonResponse(['success' => false, 'message' => 'You must be logged in.'], 401);
}

$teacherId = (int) $_SESSION['student_id'];

$stmt = $conn->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $teacherId);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || $user['role'] !== 'teacher') {
    jsonResponse(['success' => false, 'message' => 'Teacher access required.'], 403);
}

$stmt = $conn->prepare(
    'SELECT
        a.id,
        a.subject,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        c.grade,
        c.section
     FROM assignments a
     INNER JOIN teacher_assignments ta ON a.teacher_assignment_id = ta.id
     INNER JOIN classes c ON ta.class_id = c.id
     WHERE ta.teacher_id = ?
     ORDER BY a.created_at DESC'
);
$stmt->bind_param('i', $teacherId);
$stmt->execute();

$result = $stmt->get_result();
$assignments = [];

while ($row = $result->fetch_assoc()) {
    $assignments[] = [
        'id' => (int)$row['id'],
        'subject' => $row['subject'],
        'title' => $row['title'],
        'description' => $row['description'],
        'dueDate' => $row['due_date'],
        'createdAt' => $row['created_at'],
        'grade' => $row['grade'],
        'section' => $row['section']
    ];
}

$stmt->close();

jsonResponse([
    'success' => true,
    'assignments' => $assignments
]);
