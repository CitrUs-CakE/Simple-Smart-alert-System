<?php

require_once "config.php";
header('Content-Type: application/json');

// ---------- SAFE INPUT ----------
$type  = $_GET['type']  ?? 'temp';
$range = $_GET['range'] ?? 'today';

$allowedTypes = ['temp','hum','gas'];
if (!in_array($type, $allowedTypes)) {
    $type = 'temp';
}

$range = ($range === 'month') ? 'month' : 'today';

$labels = [];
$values = [];

// ---------- QUERY BUILD ----------
if ($range === 'month') {

    $sql = "
        SELECT 
            DATE_FORMAT(dnt,'%Y-%m-%d %H:00') AS label,
            AVG($type) AS value
        FROM sensorv
        WHERE dnt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY label
        ORDER BY label ASC
    ";

} else {

    $sql = "
        SELECT value,label FROM
        (
            SELECT 
                $type AS value,
                DATE_FORMAT(dnt,'%H:%i') AS label,
                dnt
            FROM sensorv
            ORDER BY dnt DESC
            LIMIT 100
        ) x
        ORDER BY dnt ASC
    ";
}

// ---------- EXECUTE ----------
$result = $conn->query($sql);

if ($result) {

    while ($row = $result->fetch_assoc()) {

        $labels[] = $row['label'];
        $values[] = round((float)$row['value'],2);

    }

}

// ---------- OUTPUT ----------
echo json_encode([
    "labels"=>$labels,
    "values"=>$values,
    "count"=>count($values)
]);

$conn->close();

?>