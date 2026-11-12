<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) { http_response_code(401); exit; }
$usuario_id = $_SESSION["usuario_id"];
$data = json_decode(file_get_contents("php://input"), true);
$pez_id = $data["pez_id"] ?? null;

if (!$pez_id) {
    http_response_code(400);
    echo json_encode(["error" => "Falta pez_id"]);
    exit;
}

// Registra el descubrimiento (o suma cantidad si ya lo tenía)
$pdo->prepare("
  INSERT INTO capturas_usuario (usuario_id, pez_id, cantidad_capturada)
  VALUES (?, ?, 1)
  ON DUPLICATE KEY UPDATE cantidad_capturada = cantidad_capturada + 1
")->execute([$usuario_id, $pez_id]);

// Lo agrega a la mochila actual
$stmt = $pdo->prepare("INSERT INTO inventario_peces (usuario_id, pez_id) VALUES (?, ?)");
$stmt->execute([$usuario_id, $pez_id]);

echo json_encode(["ok" => true, "inventario_id" => $pdo->lastInsertId()]);