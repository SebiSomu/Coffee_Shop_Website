<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "coffee_shop";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed"
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Invalid request method. Use POST."
    ]);
    $conn->close();
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON data"
    ]);
    $conn->close();
    exit;
}

if (!isset($data['rating']) || !is_numeric($data['rating'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Rating is required and must be numeric"
    ]);
    $conn->close();
    exit;
}

$rating = intval($data['rating']);

if ($rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Rating must be between 1 and 5"
    ]);
    $conn->close();
    exit;
}

$customer_name = isset($data['customer_name']) && !empty(trim($data['customer_name']))
    ? trim($data['customer_name'])
    : 'Anonymous';

$review_text = isset($data['review_text'])
    ? trim($data['review_text'])
    : '';

if (strlen($customer_name) > 100) {
    $customer_name = substr($customer_name, 0, 100);
}

if (strlen($review_text) > 1000) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Review text is too long (max 1000 characters)"
    ]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO ratings (customer_name, rating, review_text) 
     VALUES (?, ?, ?)"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare statement"
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("sis", $customer_name, $rating, $review_text);

try {
    $stmt->execute();
    $rating_id = $stmt->insert_id;

    echo json_encode([
        "success" => true,
        "rating_id" => $rating_id,
        "message" => "Thank you for your feedback!"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to save rating"
    ]);
}

$stmt->close();
$conn->close();
