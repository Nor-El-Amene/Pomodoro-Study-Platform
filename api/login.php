<?php

require_once "config.php";

$input = getInput();
$email = strtolower(trim($input["email"] ?? ""));
$password = $input["password"] ?? "";

if (!$email || !$password) {
    respond(false, "Email and password are required.");
}

$stmt = $pdo->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    respond(false, "No account found with this email.");
}

if (!password_verify($password, $user["password"])) {
    respond(false, "Incorrect password.");
}

respond(true, "Welcome back!", [
    "id" => (int)$user["id"],
    "name" => $user["name"],
    "email" => $user["email"]
]);
?>