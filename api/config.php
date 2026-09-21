<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$host = getenv("DB_HOST") ?: "127.0.0.1";
$port = getenv("DB_PORT") ?: "3307";
$dbname = getenv("DB_NAME") ?: "focus_app";
$username = getenv("DB_USER") ?: "root";
$password = getenv("DB_PASSWORD") ?: "";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed."
    ]);
    exit;
}

function respond($success, $message = "", $data = null) {
    $response = ["success" => $success, "message" => $message];
    if ($data !== null) $response["data"] = $data;
    echo json_encode($response);
    exit;
}

function getInput() {
    return json_decode(file_get_contents("php://input"), true);
}

function sanitize($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

function validEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function getClientIP() {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rateLimit($pdo, $identifier, $maxRequests = 60, $windowSeconds = 60) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as cnt FROM rate_limits
        WHERE identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    $stmt->execute([$identifier, $windowSeconds]);
    $count = (int)$stmt->fetch(PDO::FETCH_ASSOC)["cnt"];

    if ($count >= $maxRequests) {
        http_response_code(429);
        echo json_encode(["success" => false, "message" => "Too many requests. Please wait."]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO rate_limits (identifier) VALUES (?)");
    $stmt->execute([$identifier]);
}
?>
