<?php
include 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $customer_name = $data['customer_name'];
    $phone = $data['phone'];
    $order_data = json_encode($data['order_data']);
    $total_amount = $data['total_amount'];

    $sql = "INSERT INTO orders (customer_name, phone, order_data, total_amount) 
            VALUES (:customer_name, :phone, :order_data, :total_amount)";

    $stmt = $conn->prepare($sql);

    try {
        $stmt->execute([
            ':customer_name' => $customer_name,
            ':phone' => $phone,
            ':order_data' => $order_data,
            ':total_amount' => $total_amount
        ]);

        $order_id = $conn->lastInsertId();

        echo json_encode([
            "success" => true,
            "order_id" => $order_id,
            "message" => "Order saved successfully!"
        ]);
    } catch(PDOException $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
}
