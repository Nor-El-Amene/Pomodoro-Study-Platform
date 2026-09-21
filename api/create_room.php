<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$name = trim($input["name"] ?? "");
$description = trim($input["description"] ?? "");
$goalHours = (float)($input["goal_hours"] ?? 10);
$price = (float)($input["price"] ?? 0);
$maxMembers = (int)($input["max_members"] ?? 10);
$startsAt = $input["starts_at"] ?? null;
$endsAt = $input["ends_at"] ?? null;

if (!$userId || !$name) {
    respond(false, "User ID and room name are required.");
}

if ($goalHours <= 0) {
    respond(false, "Goal hours must be greater than 0.");
}

if ($price < 0) {
    respond(false, "Price cannot be negative.");
}

// Generate unique invite code
$inviteCode = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));

// If room is paid, mark it inactive until the owner pays.
// If room is free, it's active immediately.
$isActive = ($price > 0) ? 0 : 1;

$stmt = $pdo->prepare("
    INSERT INTO study_rooms (name, description, goal_hours, price, max_members, owner_id, invite_code, starts_at, ends_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$name, $description, $goalHours, $price, $maxMembers, $userId, $inviteCode, $startsAt, $endsAt, $isActive]);

$roomId = $pdo->lastInsertId();

// Free room: owner joins immediately as 'free'
// Paid room: owner is 'pending' until payment confirmed
$ownerStatus = ($price > 0) ? 'pending' : 'free';

$stmt = $pdo->prepare("
    INSERT INTO room_members (room_id, user_id, payment_status)
    VALUES (?, ?, ?)
");
$stmt->execute([$roomId, $userId, $ownerStatus]);

respond(true, "Room created!", [
    "id" => (int)$roomId,
    "name" => $name,
    "invite_code" => $inviteCode,
    "price" => $price,
    "goal_hours" => $goalHours,
    "requires_payment" => $price > 0
]);
?>