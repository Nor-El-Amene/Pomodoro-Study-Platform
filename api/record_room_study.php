<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$roomId = (int)($input["room_id"] ?? 0);
$minutes = (int)($input["minutes"] ?? 0);
$date = $input["date"] ?? date("Y-m-d");

if (!$userId || !$roomId || !$minutes) {
    respond(false, "User ID, Room ID, and minutes are required.");
}

// Verify user is a paid/free member
$stmt = $pdo->prepare("
    SELECT id FROM room_members
    WHERE room_id = ? AND user_id = ? AND payment_status IN ('paid', 'free')
");
$stmt->execute([$roomId, $userId]);

if (!$stmt->fetch()) {
    respond(false, "You are not an active member of this room.");
}

$stmt = $pdo->prepare("
    INSERT INTO room_study_logs (room_id, user_id, study_date, minutes_studied)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE minutes_studied = minutes_studied + VALUES(minutes_studied)
");
$stmt->execute([$roomId, $userId, $date, $minutes]);

respond(true, "Study time recorded for room!");
?>