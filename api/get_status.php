<?php
require_once "config.php";

$response = [
    "status" => "offline",
    "temp" => 0,
    "hum" => 0,
    "gas" => 0,
    "relay" => 0
];

$sql = "SELECT temp, hum, gas, actual_state, dnt 
        FROM sensorv 
        ORDER BY id DESC 
        LIMIT 1";

$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {

    $lastUpdate = strtotime($row['dnt']);
    $currentTime = time();

    // if ESP32 updated within last 60 seconds
    if (($currentTime - $lastUpdate) < 60) {
        $response["status"] = "online";
    }

    $response["temp"] = floatval($row['temp']);
    $response["hum"]  = floatval($row['hum']);
    $response["gas"]  = intval($row['gas']);
    $response["relay"] = intval($row['actual_state']);
}

echo json_encode($response);

$conn->close();
?>