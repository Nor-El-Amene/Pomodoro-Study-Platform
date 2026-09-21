<?php

require_once "config.php";
require_once "payment_config.php";

// Get the webhook payload
$payload = file_get_contents("php://input");
$signature = $_SERVER["HTTP_SIGNATURE"] ?? "";

// Verify webhook signature from Chargily
$expectedSignature = hash_hmac("sha256", $payload, CHARGILY_API_SECRET);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid signature"]);
    exit;
}

$data = json_decode($payload, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid payload"]);
    exit;
}

$status   = $data["status"] ?? "";
$metadata = $data["metadata"] ?? [];
$paymentId = (int)($metadata["payment_id"] ?? 0);
$userId    = (int)($metadata["user_id"] ?? 0);
$roomId    = (int)($metadata["room_id"] ?? 0);

if (!$paymentId || !$userId || !$roomId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing metadata"]);
    exit;
}

if ($status === "paid") {
    // Mark payment as paid
    $stmt = $pdo->prepare("UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = ?");
    $stmt->execute([$paymentId]);

    // Activate the user's membership
    $stmt = $pdo->prepare("
        UPDATE room_members SET payment_status = 'paid', payment_id = ?
        WHERE room_id = ? AND user_id = ?
    ");
    $stmt->execute([$paymentId, $roomId, $userId]);

    // If the payer is the room owner, activate the room itself
    $stmt = $pdo->prepare("
        UPDATE study_rooms SET is_active = 1
        WHERE id = ? AND owner_id = ?
    ");
    $stmt->execute([$roomId, $userId]);

    http_response_code(200);
    echo json_encode(["success" => true]);

} elseif ($status === "failed") {
    // Mark payment as failed
    $stmt = $pdo->prepare("UPDATE payments SET status = 'failed' WHERE id = ?");
    $stmt->execute([$paymentId]);

    // If owner's payment failed, delete the room entirely so it doesn't linger
    $stmt = $pdo->prepare("SELECT owner_id FROM study_rooms WHERE id = ?");
    $stmt->execute([$roomId]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($room && (int)$room["owner_id"] === $userId) {
        $pdo->prepare("DELETE FROM room_members WHERE room_id = ?")->execute([$roomId]);
        $pdo->prepare("DELETE FROM study_rooms WHERE id = ?")->execute([$roomId]);
    }

    http_response_code(200);
    echo json_encode(["success" => true]);
}
?>