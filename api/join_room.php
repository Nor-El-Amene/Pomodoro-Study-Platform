<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$inviteCode = strtoupper(trim($input["invite_code"] ?? ""));

if (!$userId || !$inviteCode) {
    respond(false, "User ID and invite code are required.");
}

// Find room
$stmt = $pdo->prepare("SELECT * FROM study_rooms WHERE invite_code = ? AND is_active = 1");
$stmt->execute([$inviteCode]);
$room = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$room) {
    respond(false, "Room not found or inactive.");
}

// Check if already a member
$stmt = $pdo->prepare("SELECT id, payment_status FROM room_members WHERE room_id = ? AND user_id = ?");
$stmt->execute([$room["id"], $userId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing && in_array($existing["payment_status"], ["paid", "free"])) {
    respond(false, "You are already a member of this room.");
}

// Check member limit
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM room_members WHERE room_id = ? AND payment_status IN ('paid', 'free')");
$stmt->execute([$room["id"]]);
$count = (int)$stmt->fetch(PDO::FETCH_ASSOC)["cnt"];

if ($count >= (int)$room["max_members"]) {
    respond(false, "This room is full.");
}

// If free room, join directly
if ((float)$room["price"] <= 0) {
    if ($existing) {
        $stmt = $pdo->prepare("UPDATE room_members SET payment_status = 'free' WHERE id = ?");
        $stmt->execute([$existing["id"]]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO room_members (room_id, user_id, payment_status) VALUES (?, ?, 'free')");
        $stmt->execute([$room["id"], $userId]);
    }
    respond(true, "Joined room!", ["room_id" => (int)$room["id"], "requires_payment" => false]);
}

// If paid room, return room info for payment
if ($existing) {
    $stmt = $pdo->prepare("UPDATE room_members SET payment_status = 'pending' WHERE id = ?");
    $stmt->execute([$existing["id"]]);
} else {
    $stmt = $pdo->prepare("INSERT INTO room_members (room_id, user_id, payment_status) VALUES (?, ?, 'pending')");
    $stmt->execute([$room["id"], $userId]);
}

respond(true, "Payment required", [
    "room_id" => (int)$room["id"],
    "room_name" => $room["name"],
    "price" => (float)$room["price"],
    "requires_payment" => true
]);
?>