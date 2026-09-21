<?php

require_once "config.php";

$input = getInput();
$todoId = (int)($input["todo_id"] ?? 0);

if (!$todoId) {
    respond(false, "Todo ID is required.");
}

$stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
$stmt->execute([$todoId]);

respond(true, "Todo deleted!");
?>