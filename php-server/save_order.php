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
}
catch (Exception $e) {
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

$required_fields = ['customer_name', 'phone', 'order_data', 'total_amount'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Missing required field: $field"
        ]);
        $conn->close();
        exit;
    }
}

$customer_name = trim($data['customer_name']);
$phone = trim($data['phone']);
$total_amount = floatval($data['total_amount']);

if (strlen($customer_name) < 3 || strlen($customer_name) > 100) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Customer name must be between 3 and 100 characters"
    ]);
    $conn->close();
    exit;
}

if (!preg_match('/^0[2-9][0-9]{8}$/', $phone)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid phone number format"
    ]);
    $conn->close();
    exit;
}

if ($total_amount <= 0 || $total_amount > 10000) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid total amount (must be between 0 and 10000 RON)"
    ]);
    $conn->close();
    exit;
}

if (!is_array($data['order_data']) || empty($data['order_data'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Order data must be a non-empty array"
    ]);
    $conn->close();
    exit;
}

$order_data_json = json_encode($data['order_data']);

$stmt = $conn->prepare(
    "INSERT INTO orders (customer_name, phone, order_data, total_amount) 
     VALUES (?, ?, ?, ?)"
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

$stmt->bind_param("sssd", $customer_name, $phone, $order_data_json, $total_amount);

try {
    $stmt->execute();
    $order_id = $stmt->insert_id;

    echo json_encode([
        "success" => true,
        "order_id" => $order_id,
        "message" => "Order saved successfully!"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to save order"
    ]);
}

$stmt->close();
$conn->close();
