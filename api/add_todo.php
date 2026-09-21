
<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);
$text = trim($input["text"] ?? "");

if (!$userId || !$text) {
    respond(false, "User ID and text are required.");
}

$stmt = $pdo->prepare("INSERT INTO todos (user_id, text) VALUES (?, ?)");
$stmt->execute([$userId, $text]);

respond(true, "Todo added!", [
    "id" => (int)$pdo->lastInsertId(),
    "text" => $text,
    "completed" => false
]);
?>