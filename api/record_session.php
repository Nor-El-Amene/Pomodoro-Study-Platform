<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$minutes = (int)($input["minutes"] ?? 0);
$date = $input["date"] ?? date("Y-m-d");

if (!$userId || !$minutes) {
    respond(false, "User ID and minutes are required.");
}

// Insert or update
$stmt = $pdo->prepare("
    INSERT INTO study_sessions (user_id, session_date, sessions_count, minutes_studied)
    VALUES (?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE
        sessions_count = sessions_count + 1,
        minutes_studied = minutes_studied + VALUES(minutes_studied)
");
$stmt->execute([$userId, $date, $minutes]);

respond(true, "Session recorded!");
?>