<?php

require_once "config.php";

// Handle both JSON body and sendBeacon (which sends as text/plain)
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!$input) {
    respond(false, "Invalid input.");
}

$userId    = (int)($input["user_id"]    ?? 0);
$timerData = $input["timer_data"]       ?? null;

if (!$userId || !$timerData) {
    respond(false, "User ID and timer data are required.");
}

// Rate limit: max 30 saves per minute per user
rateLimit($pdo, "save_timer_{$userId}", 30, 60);

$json = json_encode($timerData);

$stmt = $pdo->prepare("
    INSERT INTO user_settings (user_id, setting_key, setting_value)
    VALUES (?, 'timer_state', ?)
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
");
$stmt->execute([$userId, $json]);

respond(true, "Timer state saved!");
?>