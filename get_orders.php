<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$admin_password = "CoffeeTime+2025!";

$provided_password = isset($_SERVER['HTTP_X_ADMIN_PASSWORD'])
    ? $_SERVER['HTTP_X_ADMIN_PASSWORD']
    : '';

if ($provided_password !== $admin_password) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "error" => "Unauthorized access"
    ]);
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

$stmt = $conn->prepare(
    "SELECT id, customer_name, phone, order_data, total_amount, order_date 
     FROM orders 
     ORDER BY order_date DESC 
     LIMIT 100"
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

try {
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];

    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            'id' => intval($row['id']),
            'customer_name' => htmlspecialchars($row['customer_name'], ENT_QUOTES, 'UTF-8'),
            'phone' => htmlspecialchars($row['phone'], ENT_QUOTES, 'UTF-8'),
            'order_data' => $row['order_data'], // JSON este deja safe
            'total_amount' => floatval($row['total_amount']),
            'order_date' => $row['order_date']
        ];
    }

    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to fetch orders"
    ]);
}

$stmt->close();
$conn->close();
