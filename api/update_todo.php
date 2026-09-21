<?php

require_once "config.php";

$input = getInput();
$todoId = (int)($input["todo_id"] ?? 0);
$completed = (int)($input["completed"] ?? 0);

if (!$todoId) {
    respond(false, "Todo ID is required.");
}

$stmt = $pdo->prepare("UPDATE todos SET completed = ? WHERE id = ?");
$stmt->execute([$completed, $todoId]);

respond(true, "Todo updated!");
?>