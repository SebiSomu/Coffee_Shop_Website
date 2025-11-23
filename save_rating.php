<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

    if (!isset($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
        echo json_encode(["success" => false, "error" => "Invalid rating. Must be between 1 and 5."]);
        $conn->close();
        exit;
    }

    $rating = intval($data['rating']);
    $customer_name = isset($data['customer_name']) ? $conn->real_escape_string($data['customer_name']) : 'Anonymous';
    $review_text = isset($data['review_text']) ? $conn->real_escape_string($data['review_text']) : '';

    if (empty(trim($customer_name))) {
        $customer_name = 'Anonymous';
    }

    $sql = "INSERT INTO ratings (customer_name, rating, review_text) 
            VALUES ('$customer_name', $rating, '$review_text')";

    if ($conn->query($sql) === TRUE) {
        $rating_id = $conn->insert_id;
        echo json_encode([
            "success" => true,
            "rating_id" => $rating_id,
            "message" => "Thank you for your feedback!"
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Database error: " . $conn->error]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method. Use POST."]);
}