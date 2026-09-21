<?php

require_once "config.php";

$userId = (int)($_GET["user_id"] ?? 0);

if (!$userId) {
    respond(false, "User ID is required.");
}

$stmt = $pdo->prepare("
    SELECT setting_value FROM user_settings
    WHERE user_id = ? AND setting_key = 'timer_state'
");
$stmt->execute([$userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    respond(true, "Timer state loaded", json_decode($row["setting_value"], true));
} else {
    respond(true, "No saved state", null);
}
?>