<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) { http_response_code(401); exit; }
$usuario_id = $_SESSION["usuario_id"];

$precios = [1 => 50, 2 => 120, 3 => 300, 4 => 800, 5 => 2000];

$stmt = $pdo->prepare("
  SELECT p.rareza
  FROM inventario_peces ip
  JOIN peces p ON p.id = ip.pez_id
  WHERE ip.usuario_id = ?
");
$stmt->execute([$usuario_id]);
$peces = $stmt->fetchAll(PDO::FETCH_ASSOC);

$total = 0;
foreach ($peces as $p) {
    $total += $precios[$p["rareza"]] ?? 10;
}

$pdo->beginTransaction();
$pdo->prepare("DELETE FROM inventario_peces WHERE usuario_id = ?")->execute([$usuario_id]);
$pdo->prepare("UPDATE usuarios SET dinero = dinero + ? WHERE id = ?")->execute([$total, $usuario_id]);
$pdo->commit();

echo json_encode(["ok" => true, "total" => $total]);
