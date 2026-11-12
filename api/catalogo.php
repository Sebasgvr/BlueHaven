<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) { http_response_code(401); exit; }
$usuario_id = $_SESSION["usuario_id"];

$stmt = $pdo->prepare("
  SELECT p.*, 
         cu.cantidad_capturada,
         cu.primera_captura,
         CASE WHEN cu.id IS NULL THEN 0 ELSE 1 END AS descubierto
  FROM peces p
  LEFT JOIN capturas_usuario cu 
         ON cu.pez_id = p.id AND cu.usuario_id = ?
  ORDER BY p.rareza, p.nombre
");
$stmt->execute([$usuario_id]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));