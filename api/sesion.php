<?php
// api/sesion.php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["usuario_id"])) {
    echo json_encode(["autenticado" => false]);
    exit;
}

$stmt = $pdo->prepare("SELECT dinero FROM usuarios WHERE id = ?");
$stmt->execute([$_SESSION["usuario_id"]]);
$u = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode(["autenticado" => true, "dinero" => $u["dinero"] ?? 0]);