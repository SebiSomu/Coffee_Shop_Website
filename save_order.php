<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "coffee_shop";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(["success" => false, "error" => "Invalid JSON data"]);
        $conn->close();
        exit;
    }

    if (!isset($data['customer_name']) || !isset($data['phone']) || !isset($data['order_data']) || !isset($data['total_amount'])) {
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        $conn->close();
        exit;
    }

    $customer_name = $conn->real_escape_string($data['customer_name']);
    $phone = $conn->real_escape_string($data['phone']);
    $order_data = $conn->real_escape_string(json_encode($data['order_data']));
    $total_amount = floatval($data['total_amount']);

    $sql = "INSERT INTO orders (customer_name, phone, order_data, total_amount) 
            VALUES ('$customer_name', '$phone', '$order_data', $total_amount)";

    if ($conn->query($sql) === TRUE) {
        $order_id = $conn->insert_id;
        echo json_encode([
            "success" => true,
            "order_id" => $order_id,
            "message" => "Order saved successfully!"
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Database error: " . $conn->error]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method. Use POST."]);
}
