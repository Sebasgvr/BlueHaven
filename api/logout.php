<?php
session_start();
header("Content-Type: application/json");

$_SESSION = [];
session_destroy();

echo json_encode(["ok" => true]);
