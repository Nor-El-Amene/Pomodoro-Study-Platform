<?php

require_once "config.php";

$userId = (int)($_GET["user_id"] ?? 0);

if (!$userId) {
    respond(false, "User ID is required.");
}

$stmt = $pdo->prepare("SELECT id, text, completed FROM todos WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$userId]);
$todos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format
$formatted = [];
foreach ($todos as $todo) {
    $formatted[] = [
        "id" => (int)$todo["id"],
        "text" => $todo["text"],
        "completed" => (bool)$todo["completed"]
    ];
}

respond(true, "Todos loaded", $formatted);
?>