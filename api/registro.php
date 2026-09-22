<?php
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$usuario = trim($data["usuario"] ?? "");
$email = trim($data["email"] ?? "");
$pass = $data["password"] ?? "";

if (!$usuario || !$email || strlen($pass) < 6) {
    http_response_code(400);
    echo json_encode(["error" => "Datos inválidos"]);
    exit;
}

$hash = password_hash($pass, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)"
    );
    $stmt->execute([$usuario, $email, $hash]);
    echo json_encode(["ok" => true, "usuario_id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode(["error" => "Usuario o email ya existe"]);
}