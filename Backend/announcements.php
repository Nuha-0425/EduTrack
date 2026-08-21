<?php

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query(
        'SELECT id, title, content, created_at
         FROM announcements
         ORDER BY created_at DESC'
    );

    if (!$result) {
        jsonResponse(['success' => false, 'message' => 'Failed to load announcements.'], 500);
    }

    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }

    jsonResponse([
        'success' => true,
        'announcements' => $announcements
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    startAuthSession();

    if (empty($_SESSION['student_id'])) {
        jsonResponse(['success' => false, 'message' => 'You must be logged in.'], 401);
    }

    $userId = (int) $_SESSION['student_id'];
    $stmt = $conn->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse(['success' => false, 'message' => 'Admin access required.'], 403);
    }

    $data = getJsonInput();
    $title = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');

    if ($title === '' || $content === '') {
        jsonResponse(['success' => false, 'message' => 'Title and content are required.'], 400);
    }

    if (mb_strlen($title) > 255) {
        jsonResponse(['success' => false, 'message' => 'Title is too long.'], 400);
    }

    $stmt = $conn->prepare(
        'INSERT INTO announcements (title, content) VALUES (?, ?)'
    );
    $stmt->bind_param('ss', $title, $content);

    if (!$stmt->execute()) {
        $stmt->close();
        jsonResponse(['success' => false, 'message' => 'Failed to create announcement.'], 500);
    }

    $id = $stmt->insert_id;
    $stmt->close();

    jsonResponse([
        'success' => true,
        'message' => 'Announcement created successfully.',
        'id' => $id
    ]);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
