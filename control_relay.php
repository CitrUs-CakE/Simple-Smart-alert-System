<?php
require_once "config.php"; // provides $conn

// ------------------------------
// PART A : DASHBOARD SET COMMAND
// ------------------------------
if (isset($_GET['set_state'])) {

    $cmd = intval($_GET['set_state']);

    // Allow only valid commands
    if ($cmd < 0 || $cmd > 3) {
        echo "0";
        exit();
    }

    // Update latest row command
    $stmt = $conn->prepare("UPDATE sensorv SET alert=? ORDER BY id DESC LIMIT 1");
    $stmt->bind_param("i", $cmd);

    if ($stmt->execute()) {
        echo $cmd; // return command
    } else {
        echo "0";
    }

    $stmt->close();
    $conn->close();
    exit();
}


// ------------------------------
// PART B : ESP32 READ COMMAND
// ------------------------------
$cmd = 0;

$result = $conn->query("SELECT alert FROM sensorv ORDER BY id DESC LIMIT 1");

if ($result && $row = $result->fetch_assoc()) {
    $cmd = intval($row['alert']);
}

// ESP32 expects only a number
echo $cmd;

$conn->close();
?>