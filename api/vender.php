<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) { http_response_code(401); exit; }
$usuario_id = $_SESSION["usuario_id"];

$data = json_decode(file_get_contents("php://input"), true);
$inventario_id = $data["inventario_id"] ?? null;

if (!$inventario_id) {
    http_response_code(400);
    echo json_encode(["error" => "Falta inventario_id"]);
    exit;
}

$precios = [1 => 50, 2 => 120, 3 => 300, 4 => 800, 5 => 2000];

// Verifica que el pez sea de ESTE usuario y trae su rareza para calcular el precio
$stmt = $pdo->prepare("
  SELECT ip.id, p.rareza
  FROM inventario_peces ip
  JOIN peces p ON p.id = ip.pez_id
  WHERE ip.id = ? AND ip.usuario_id = ?
");
$stmt->execute([$inventario_id, $usuario_id]);
$fila = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$fila) {
    http_response_code(404);
    echo json_encode(["error" => "Ese pez no está en tu mochila"]);
    exit;
}

$precio = $precios[$fila["rareza"]] ?? 10;

$pdo->beginTransaction();
$pdo->prepare("DELETE FROM inventario_peces WHERE id = ?")->execute([$inventario_id]);
$pdo->prepare("UPDATE usuarios SET dinero = dinero + ? WHERE id = ?")->execute([$precio, $usuario_id]);
$pdo->commit();

echo json_encode(["ok" => true, "precio" => $precio]);
