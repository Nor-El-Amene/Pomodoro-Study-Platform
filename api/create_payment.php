<?php

require_once "config.php";
require_once "payment_config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$roomId = (int)($input["room_id"] ?? 0);

if (!$userId || !$roomId) {
    respond(false, "User ID and Room ID are required.");
}

// Get room price
$stmt = $pdo->prepare("SELECT * FROM study_rooms WHERE id = ?");
$stmt->execute([$roomId]);
$room = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$room) {
    respond(false, "Room not found.");
}

$amount = (float)$room["price"];

if ($amount <= 0) {
    respond(false, "This room is free.");
}

// Get user info
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Create payment record
$stmt = $pdo->prepare("
    INSERT INTO payments (user_id, room_id, amount, status)
    VALUES (?, ?, ?, 'pending')
");
$stmt->execute([$userId, $roomId, $amount]);
$paymentId = $pdo->lastInsertId();

// Create Chargily checkout
$chargilyData = [
    "amount" => $amount,
    "currency" => "dzd",
    "payment_method" => "dahabia",
    "success_url" => SITE_URL . "/payment-success.html?payment_id=" . $paymentId,
    "failure_url" => SITE_URL . "/payment-failed.html?payment_id=" . $paymentId,
    "webhook_endpoint" => SITE_URL . "/api/payment_webhook.php",
    "description" => "Join study room: " . $room["name"],
    "metadata" => [
        "payment_id" => $paymentId,
        "user_id" => $userId,
        "room_id" => $roomId
    ]
];

$ch = curl_init(CHARGILY_API_URL . "/checkouts");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($chargilyData),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . CHARGILY_API_KEY,
        "Content-Type: application/json"
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300 && isset($result["checkout_url"])) {
    // Save gateway payment ID
    $stmt = $pdo->prepare("UPDATE payments SET gateway_payment_id = ? WHERE id = ?");
    $stmt->execute([$result["id"] ?? "", $paymentId]);

    respond(true, "Payment created", [
        "checkout_url" => $result["checkout_url"],
        "payment_id" => $paymentId
    ]);
} else {
    // Payment creation failed
    $stmt = $pdo->prepare("UPDATE payments SET status = 'failed' WHERE id = ?");
    $stmt->execute([$paymentId]);

    respond(false, "Failed to create payment. Please try again.");
}
?>