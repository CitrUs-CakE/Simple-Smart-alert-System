<?php
require_once "config.php"; // database connection ($conn)

// Read raw JSON from ESP32
$input = file_get_contents("php://input");

if (!$input) {
    echo "No Data";
    exit();
}

// Decode JSON
$data = json_decode($input, true);

if (!$data) {
    echo "Invalid JSON";
    exit();
}

// Get values safely
$temp = isset($data['temp']) ? floatval($data['temp']) : 0;
$hum  = isset($data['hum']) ? floatval($data['hum']) : 0;
$gas  = isset($data['gas']) ? intval($data['gas']) : 0;
$state = isset($data['actual_state']) ? intval($data['actual_state']) : 0;

// Get current alert command from latest row
$alert = 0;
$result = $conn->query("SELECT alert FROM sensorv ORDER BY id DESC LIMIT 1");

if ($result && $row = $result->fetch_assoc()) {
    $alert = intval($row['alert']);
}

// Insert new sensor data
$stmt = $conn->prepare("INSERT INTO sensorv (temp, hum, gas, alert, actual_state) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("ddiii", $temp, $hum, $gas, $alert, $state);

if ($stmt->execute()) {
    echo "OK";
} else {
    echo "DB Error: " . $conn->error;
}

$stmt->close();
$conn->close();
?>