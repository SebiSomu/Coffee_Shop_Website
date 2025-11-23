<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$sql = "SELECT id, customer_name, rating, review_text, created_at 
        FROM ratings 
        ORDER BY created_at DESC 
        LIMIT 8";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $ratings = [];
    while ($row = $result->fetch_assoc()) {
        $ratings[] = $row;
    }
    echo json_encode(["success" => true, "ratings" => $ratings]);
} else {
    echo json_encode(["success" => true, "ratings" => []]);
}

$conn->close();
