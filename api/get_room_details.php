<?php

require_once "config.php";

$roomId = (int)($_GET["room_id"] ?? 0);
$userId = (int)($_GET["user_id"] ?? 0);

if (!$roomId || !$userId) {
    respond(false, "Room ID and User ID are required.");
}

// Check if user is a member
$stmt = $pdo->prepare("
    SELECT payment_status FROM room_members
    WHERE room_id = ? AND user_id = ? AND payment_status IN ('paid', 'free')
");
$stmt->execute([$roomId, $userId]);

if (!$stmt->fetch()) {
    respond(false, "You are not a member of this room.");
}

// Get room info
$stmt = $pdo->prepare("SELECT r.*, u.name as owner_name FROM study_rooms r JOIN users u ON r.owner_id = u.id WHERE r.id = ?");
$stmt->execute([$roomId]);
$room = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$room) {
    respond(false, "Room not found.");
}

// Get members with their study time
$stmt = $pdo->prepare("
    SELECT
        u.id, u.name,
        COALESCE(SUM(rsl.minutes_studied), 0) as total_minutes
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    LEFT JOIN room_study_logs rsl ON rsl.user_id = u.id AND rsl.room_id = ?
    WHERE rm.room_id = ? AND rm.payment_status IN ('paid', 'free')
    GROUP BY u.id, u.name
    ORDER BY total_minutes DESC
");
$stmt->execute([$roomId, $roomId]);
$members = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get total room progress
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(minutes_studied), 0) as total_minutes
    FROM room_study_logs WHERE room_id = ?
");
$stmt->execute([$roomId]);
$totalMinutes = (int)$stmt->fetch(PDO::FETCH_ASSOC)["total_minutes"];

respond(true, "Room details loaded", [
    "room" => $room,
    "members" => $members,
    "total_minutes" => $totalMinutes,
    "goal_minutes" => (float)$room["goal_hours"] * 60
]);
?>