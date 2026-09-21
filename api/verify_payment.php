<?php

require_once "config.php";

$paymentId = (int)($_GET["payment_id"] ?? 0);
$userId = (int)($_GET["user_id"] ?? 0);

if (!$paymentId || !$userId) {
    respond(false, "Payment ID and User ID are required.");
}

$stmt = $pdo->prepare("
    SELECT p.*, r.name as room_name
    FROM payments p
    JOIN study_rooms r ON p.room_id = r.id
    WHERE p.id = ? AND p.user_id = ?
");
$stmt->execute([$paymentId, $userId]);
$payment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$payment) {
    respond(false, "Payment not found.");
}

respond(true, "Payment status", [
    "status" => $payment["status"],
    "room_name" => $payment["room_name"],
    "room_id" => (int)$payment["room_id"],
    "amount" => (float)$payment["amount"]
]);
?>