<?php
require_once "config.php";
$data = getInput();
$roomId = (int)($data['room_id'] ?? 0);
$userId = (int)($data['user_id'] ?? 0);
if (!$roomId || !$userId) respond(false, "Missing fields.");
$stmt = $pdo->prepare("SELECT id FROM study_rooms WHERE id = ? AND owner_id = ?");
$stmt->execute([$roomId, $userId]);
if (!$stmt->fetch()) respond(false, "Not authorized.");
$pdo->prepare("DELETE FROM room_members WHERE room_id = ?")->execute([$roomId]);
$pdo->prepare("DELETE FROM study_rooms WHERE id = ?")->execute([$roomId]);
respond(true, "Room deleted.");
?>