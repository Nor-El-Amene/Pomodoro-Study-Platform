<?php
require_once "config.php";
$data = getInput();
$roomId = (int)($data['room_id'] ?? 0);
$userId = (int)($data['user_id'] ?? 0);
if (!$roomId || !$userId) respond(false, "Missing fields.");
$stmt = $pdo->prepare("SELECT owner_id FROM study_rooms WHERE id = ?");
$stmt->execute([$roomId]);
$room = $stmt->fetch();
if (!$room) respond(false, "Room not found.");
if ((int)$room['owner_id'] === $userId) respond(false, "Owner cannot leave. Delete the room instead.");
$pdo->prepare("DELETE FROM room_members WHERE room_id = ? AND user_id = ?")->execute([$roomId, $userId]);
respond(true, "Left room.");
?>