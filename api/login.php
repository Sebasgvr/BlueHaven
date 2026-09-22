<?php
session_start();
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$usuario = trim($data["usuario"] ?? "");
$pass = $data["password"] ?? "";

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
$stmt->execute([$usuario]);
$u = $stmt->fetch(PDO::FETCH_ASSOC);

if ($u && password_verify($pass, $u["password_hash"])) {
    $_SESSION["usuario_id"] = $u["id"];
    echo json_encode([
        "ok" => true,
        "usuario" => $u["usuario"],
        "dinero" => $u["dinero"]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Usuario o contraseña incorrectos"]);
}