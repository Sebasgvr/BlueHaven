<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) { http_response_code(401); exit; }
$usuario_id = $_SESSION["usuario_id"];

$stmt = $pdo->prepare("
  SELECT ip.id, p.id AS pez_id, p.nombre, p.rareza, p.sprite
  FROM inventario_peces ip
  JOIN peces p ON p.id = ip.pez_id
  WHERE ip.usuario_id = ?
  ORDER BY ip.id
");
$stmt->execute([$usuario_id]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
