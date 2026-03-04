<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$stmt = $conn->prepare(
    "SELECT id, customer_name, rating, review_text, created_at 
     FROM ratings 
     ORDER BY created_at DESC 
     LIMIT 8"
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

    $ratings = [];

    while ($row = $result->fetch_assoc()) {
        $ratings[] = [
            'id' => intval($row['id']),
            'customer_name' => htmlspecialchars($row['customer_name'], ENT_QUOTES, 'UTF-8'),
            'rating' => intval($row['rating']),
            'review_text' => htmlspecialchars($row['review_text'], ENT_QUOTES, 'UTF-8'),
            'created_at' => $row['created_at']
        ];
    }

    echo json_encode([
        "success" => true,
        "ratings" => $ratings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to fetch ratings"
    ]);
}

$stmt->close();
$conn->close();
