<?php
// api/chatbot.php
// Bot de reglas: detecta la especie en la pregunta y arma la respuesta
// con los datos reales de la base de datos. Al final guarda la consulta
// en la tabla `preguntas_chatbot` para ver qué preguntan los usuarios.
session_start();
header("Content-Type: application/json; charset=utf-8");
require "db.php";

// Si la tabla de log no existe todavía (falta importar el .sql), la creamos sola
// para que el bot nunca deje de responder por ese motivo.
$pdo->exec("CREATE TABLE IF NOT EXISTS preguntas_chatbot (
    id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_id INT(11) DEFAULT NULL,
    pez_id INT(11) DEFAULT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT DEFAULT NULL,
    creado_en DATETIME DEFAULT current_timestamp(),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

$entrada = json_decode(file_get_contents("php://input"), true);
if (!is_array($entrada)) {
    $entrada = ["pregunta" => $_GET["pregunta"] ?? ""];
}
$pregunta = trim($entrada["pregunta"] ?? "");
if ($pregunta === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Escribí una pregunta."]);
    exit;
}

$usuario_id = $_SESSION["usuario_id"] ?? null;

function normalizar($texto)
{
    $texto = function_exists("mb_strtolower")
        ? mb_strtolower($texto, "UTF-8")
        : strtolower($texto);
    $mapa = [
        "á" => "a", "é" => "e", "í" => "i", "ó" => "o", "ú" => "u",
        "ü" => "u", "ñ" => "n",
    ];
    $texto = strtr($texto, $mapa);
    return preg_replace('/[^a-z0-9 ]/', " ", $texto);
}

function contiene($texto, array $terminos)
{
    foreach ($terminos as $t) {
        if (strpos($texto, $t) !== false) {
            return true;
        }
    }
    return false;
}

function etiquetaRareza($r)
{
    $mapa = [
        1 => "Común",
        2 => "Poco común",
        3 => "Raro",
        4 => "Épico",
        5 => "Legendario",
    ];
    return $mapa[(int) $r] ?? "¿?";
}

// ---- Cargamos todas las especies desde MySQL ----
$stmt = $pdo->query("
    SELECT id, nombre, rareza, velocidad, habitat, anzuelo_recomendado,
           linea_recomendada, cebo_recomendado, `tamaño_cm`, peso_kg, descripcion
    FROM peces
    ORDER BY rareza, nombre
");
$peces = $stmt->fetchAll(PDO::FETCH_ASSOC);

$norm = normalizar($pregunta);

// ---- Detecta el nombre del pez dentro de la pregunta ----
// Prueba el nombre completo primero y después palabra por palabra
// (así "atún" matchea a "Atún", "ballena" a "Ballena Azul", etc.).
$pez = null;
$mejorLongitud = 0;
foreach ($peces as $p) {
    $nombreNorm = normalizar($p["nombre"]);
    if ($nombreNorm !== "" && strpos($norm, $nombreNorm) !== false) {
        if (strlen($nombreNorm) > $mejorLongitud) {
            $mejorLongitud = strlen($nombreNorm);
            $pez = $p;
        }
        continue;
    }
    foreach (preg_split('/\s+/', $nombreNorm) as $token) {
        if (strlen($token) >= 4 && strpos($norm, $token) !== false) {
            if (strlen($token) > $mejorLongitud) {
                $mejorLongitud = strlen($token);
                $pez = $p;
            }
            break;
        }
    }
}

// ---- Detecta la intención de la pregunta (reglas) ----
$intentos = [];
if (contiene($norm, ["habitat", "vive", "donde", "zona", "lugar", "encontra", "habita", "rio", "lago", "mar", "cost", "ambiente", "proviene", "frecuent"])) {
    $intentos["habitat"] = ["habitat", "Hábitat", "🌍"];
}
if (contiene($norm, ["anzuelo"])) {
    $intentos["anzuelo"] = ["anzuelo_recomendado", "Anzuelo recomendado", "🪝"];
}
if (contiene($norm, ["linea", "hilo"])) {
    $intentos["linea"] = ["linea_recomendada", "Línea recomendada", "🧵"];
}
if (contiene($norm, ["cebo", "senuelo", "señuelo", "carnada", "carnad", "artificial", "mosca"])) {
    $intentos["cebo"] = ["cebo_recomendado", "Cebo / señuelo", "🪱"];
}
if (contiene($norm, ["tamañ", "taman", "mide", "largo", "grande", "centimetr", "medida"])) {
    $intentos["tamano"] = ["tamaño_cm", "Tamaño", "📏"];
}
if (contiene($norm, ["peso", "pesa", "kilo", "kg"])) {
    $intentos["peso"] = ["peso_kg", "Peso", "⚖️"];
}
if (contiene($norm, ["rapid", "veloc"])) {
    $intentos["velocidad"] = ["velocidad", "Velocidad", "💨"];
}
if (contiene($norm, ["estrella", "raro", "rara", "comun", "dificil", "difícil", "legendari", "epico"])) {
    $intentos["rareza"] = ["rareza", "Rareza", "⭐"];
}

$esSaludo   = contiene($norm, ["hola", "holi", "buenas", "buen dia", "que tal", "hey"]);
$esAyuda    = contiene($norm, ["ayuda", "que haces", "que sabes", "como funciona", "que podes", "instruccion"]);
$esCatalogo = contiene($norm, ["que peces", "cuales peces", "catalogo", "listad", "especies", "que especies"]);

// ---- Construye una ficha completa con los datos disponibles ----
function construirReporte($pez)
{
    $lineas = [];
    $lineas[] = "🐟 " . $pez["nombre"];
    if ($pez["descripcion"] !== null && $pez["descripcion"] !== "") {
        $lineas[] = $pez["descripcion"];
    }
    $lineas[] = "⭐ Rareza: " . str_repeat("★", (int) $pez["rareza"]) . " (" . etiquetaRareza($pez["rareza"]) . ")";
    if ($pez["habitat"] !== null && $pez["habitat"] !== "") {
        $lineas[] = "🌍 Hábitat: " . $pez["habitat"];
    }
    if ($pez["anzuelo_recomendado"] !== null && $pez["anzuelo_recomendado"] !== "") {
        $lineas[] = "🪝 Anzuelo: " . $pez["anzuelo_recomendado"];
    }
    if ($pez["linea_recomendada"] !== null && $pez["linea_recomendada"] !== "") {
        $lineas[] = "🧵 Línea: " . $pez["linea_recomendada"];
    }
    if ($pez["cebo_recomendado"] !== null && $pez["cebo_recomendado"] !== "") {
        $lineas[] = "🪱 Cebo: " . $pez["cebo_recomendado"];
    }
    if ($pez["tamaño_cm"] !== null && $pez["tamaño_cm"] !== "") {
        $lineas[] = "📏 Tamaño: " . $pez["tamaño_cm"] . " cm";
    }
    if ($pez["peso_kg"] !== null && $pez["peso_kg"] !== "") {
        $lineas[] = "⚖️ Peso: " . $pez["peso_kg"] . " kg";
    }
    if ($pez["velocidad"] !== null && $pez["velocidad"] !== "") {
        $lineas[] = "💨 Velocidad: " . $pez["velocidad"];
    }
    return implode("\n", $lineas);
}

// ---- Responde según lo detectado ----
if ($pez) {
    if ($intentos) {
        // El usuario pidió datos puntuales: respondemos solo esos campos.
        $lineas = ["🐟 " . $pez["nombre"] . ":"];
        foreach ($intentos as $config) {
            [$campo, $etiqueta, $icono] = $config;
            $valor = $pez[$campo];
            if ($campo === "rareza") {
                $valor = str_repeat("★", (int) $pez["rareza"]) . " (" . etiquetaRareza($pez["rareza"]) . ")";
            }
            if ($valor === null || $valor === "") {
                $lineas[] = "$icono $etiqueta: todavía no tengo ese dato cargado.";
            } else {
                $sufijo = $campo === "tamaño_cm" ? " cm" : ($campo === "peso_kg" ? " kg" : "");
                $lineas[] = "$icono $etiqueta: $valor$sufijo";
            }
        }
        $respuesta = implode("\n", $lineas);
    } else {
        // Sin una intención clara: ficha completa con todo lo que hay.
        $respuesta = construirReporte($pez);
    }
} elseif ($esCatalogo) {
    $nombres = array_map(fn ($p) => $p["nombre"] . " (" . str_repeat("★", (int) $p["rareza"]) . ")", $peces);
    $respuesta = "Estas son las especies que tengo en la base:\n" .
        implode("\n", $nombres) .
        "\n\nEscribí el nombre de una y te cuento todo sobre ella.";
} elseif ($esSaludo) {
    $respuesta = "¡Hola! 🎣 Soy tu guía de BlueHaven.\n" .
        "Preguntame por cualquier pez, por ejemplo: \"¿cómo pescar el Atún?\" o \"¿dónde vive la Carpa?\".";
} elseif ($esAyuda) {
    $respuesta = "Puedo contarte sobre las especies de BlueHaven 🐟.\n" .
        "Probá preguntas como:\n" .
        "- \"¿Cómo pescar la Trucha Arcoíris?\"\n" .
        "- \"¿Qué cebo usa el Atún?\"\n" .
        "- \"¿De qué tamaño es la Carpa?\"\n" .
        "- \"¿Qué peces hay?\"";
} else {
    $nombres = array_map(fn ($p) => $p["nombre"], $peces);
    $respuesta = "No encontré ninguna especie parecida a \"$pregunta\" 😅.\n" .
        "Probá con una de estas:\n" . implode(", ", $nombres) . ".";
}

// ---- Guardamos la consulta para ver qué preguntan los usuarios ----
// Va en try/catch: si por algo falla el log, igual devolvemos la respuesta.
try {
    $stmt = $pdo->prepare(
        "INSERT INTO preguntas_chatbot (usuario_id, pez_id, pregunta, respuesta)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$usuario_id, $pez ? $pez["id"] : null, $pregunta, $respuesta]);
} catch (Exception $e) {
    // se ignora el error de guardado; lo importante es responder al usuario
}

echo json_encode([
    "ok" => true,
    "respuesta" => $respuesta,
    "pez" => $pez ? $pez["nombre"] : null,
]);