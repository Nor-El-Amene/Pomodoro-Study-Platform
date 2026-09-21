<?php

require_once "config.php";

$input = getInput();
$userId = (int)($input["user_id"] ?? 0);

if (!$userId) {
    respond(false, "User ID is required.");
}

$stmt = $pdo->prepare("DELETE FROM todos WHERE user_id = ? AND completed = 1");
$stmt->execute([$userId]);

respond(true, "Cleared completed todos!", [
    "deleted" => $stmt->rowCount()
]);
?>