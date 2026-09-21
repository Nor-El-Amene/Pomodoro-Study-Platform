<?php

require_once "config.php";

$userId = (int)($_GET["user_id"] ?? 0);

if (!$userId) {
    respond(false, "User ID is required.");
}

// Get all study data for this user
$stmt = $pdo->prepare("
    SELECT session_date, sessions_count, minutes_studied
    FROM study_sessions
    WHERE user_id = ?
    ORDER BY session_date DESC
");
$stmt->execute([$userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format as date => {sessions, minutes}
$data = [];
foreach ($rows as $row) {
    $data[$row["session_date"]] = [
        "sessions" => (int)$row["sessions_count"],
        "minutes" => (int)$row["minutes_studied"]
    ];
}

respond(true, "Stats loaded", $data);
?>