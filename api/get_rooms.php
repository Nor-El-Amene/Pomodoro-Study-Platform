<?php

require_once "config.php";

$userId = (int)($_GET["user_id"] ?? 0);

if (!$userId) {
    respond(false, "User ID is required.");
}

// Get rooms user is a member of
$stmt = $pdo->prepare("
    SELECT
        r.*,
        rm.payment_status,
        u.name as owner_name,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id AND payment_status IN ('paid', 'free')) as member_count,
        (SELECT COALESCE(SUM(rsl.minutes_studied), 0) FROM room_study_logs rsl WHERE rsl.room_id = r.id AND rsl.user_id = ?) as my_minutes
    FROM study_rooms r
    JOIN room_members rm ON r.id = rm.room_id AND rm.user_id = ?
    JOIN users u ON r.owner_id = u.id
    WHERE r.is_active = 1 AND rm.payment_status IN ('paid', 'free')
    ORDER BY r.created_at DESC
");
$stmt->execute([$userId, $userId]);
$rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

respond(true, "Rooms loaded", $rooms);
?>