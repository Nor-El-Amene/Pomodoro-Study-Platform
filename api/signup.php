<?php

require_once "config.php";

$input = getInput();
$name = trim($input["name"] ?? "");
$email = strtolower(trim($input["email"] ?? ""));
$password = $input["password"] ?? "";

if (!$name || !$email || !$password) {
    respond(false, "All fields are required.");
}

if (strlen($password) < 6) {
    respond(false, "Password must be at least 6 characters.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, "Invalid email address.");
}

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->fetch()) {
    respond(false, "An account with this email already exists.");
}

// Create user
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
$stmt->execute([$name, $email, $hashedPassword]);

$userId = $pdo->lastInsertId();

respond(true, "Account created!", [
    "id" => (int)$userId,
    "name" => $name,
    "email" => $email
]);
?>