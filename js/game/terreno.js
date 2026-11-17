// Sistema de baldosas y clasificación de terreno 3D
const materialesSueloCache = new Map();
let imagenSueloOriginal = null;
let texturaSueloCargada = false;

function clasificarTerreno(f, c) {
  if (f < 0 || c < 0 || f >= MAPA_ALTO || c >= MAPA_ANCHO) return "pared";
  if (MAPA[f][c] === 1) return "pared";
  if (MAPA[f][c] === 4) return "pasto";
  if (MAPA[f][c] === 3) return "agua";
  if (MAPA[f][c] === 2) return "arena";
  if (obtenerSuelo(f, c) === 5) return "tierra";
  return "pasto";
}

function obtenerClaveBaldosa(f, c) {
  const tipo = clasificarTerreno(f, c);

  if (tipo === "pasto") {
    const N =
      clasificarTerreno(f - 1, c) === "tierra" ||
      clasificarTerreno(f - 1, c) === "arena";
    const S =
      clasificarTerreno(f + 1, c) === "tierra" ||
      clasificarTerreno(f + 1, c) === "arena";
    const O =
      clasificarTerreno(f, c - 1) === "tierra" ||
      clasificarTerreno(f, c - 1) === "arena";
    const E =
      clasificarTerreno(f, c + 1) === "tierra" ||
      clasificarTerreno(f, c + 1) === "arena";

    // Esquinas interiores (cóncavas): dos bordes cardinales tocan tierra -> casi toda la celda es tierra y solo una punta es pasto
    if (S && E) return "pasto_esq_int_NO"; // Punta de pasto en Noroeste
    if (S && O) return "pasto_esq_int_NE"; // Punta de pasto en Noreste
    if (N && E) return "pasto_esq_int_SO"; // Punta de pasto en Suroeste
    if (N && O) return "pasto_esq_int_SE"; // Punta de pasto en Sureste

    // Bordes rectos
    if (S) return "pasto_borde_S";
    if (N) return "pasto_borde_N";
    if (E) return "pasto_borde_E";
    if (O) return "pasto_borde_O";

    // Esquinas exteriores (convexas): lados cardinales son pasto, pero una diagonal toca tierra
    const NE =
      clasificarTerreno(f - 1, c + 1) === "tierra" ||
      clasificarTerreno(f - 1, c + 1) === "arena";
    const NO =
      clasificarTerreno(f - 1, c - 1) === "tierra" ||
      clasificarTerreno(f - 1, c - 1) === "arena";
    const SE =
      clasificarTerreno(f + 1, c + 1) === "tierra" ||
      clasificarTerreno(f + 1, c + 1) === "arena";
    const SO =
      clasificarTerreno(f + 1, c - 1) === "tierra" ||
      clasificarTerreno(f + 1, c - 1) === "arena";

    if (SE) return "pasto_esq_ext_SE"; // Tierra en la esquina Sureste
    if (SO) return "pasto_esq_ext_SO"; // Tierra en la esquina Suroeste
    if (NE) return "pasto_esq_ext_NE"; // Tierra en la esquina Noreste
    if (NO) return "pasto_esq_ext_NO"; // Tierra en la esquina Noroeste

    return "pasto_puro";
  }

  if (tipo === "arena") {
    const N =
      clasificarTerreno(f - 1, c) === "tierra" ||
      clasificarTerreno(f - 1, c) === "pasto";
    const S =
      clasificarTerreno(f + 1, c) === "tierra" ||
      clasificarTerreno(f + 1, c) === "pasto";
    const O =
      clasificarTerreno(f, c - 1) === "tierra" ||
      clasificarTerreno(f, c - 1) === "pasto";
    const E =
      clasificarTerreno(f, c + 1) === "tierra" ||
      clasificarTerreno(f, c + 1) === "pasto";

    if (S && E) return "arena_esq_int_NO";
    if (S && O) return "arena_esq_int_NE";
    if (N && E) return "arena_esq_int_SO";
    if (N && O) return "arena_esq_int_SE";

    if (S) return "arena_borde_S";
    if (N) return "arena_borde_N";
    if (E) return "arena_borde_E";
    if (O) return "arena_borde_O";

    const NE =
      clasificarTerreno(f - 1, c + 1) === "tierra" ||
      clasificarTerreno(f - 1, c + 1) === "pasto";
    const NO =
      clasificarTerreno(f - 1, c - 1) === "tierra" ||
      clasificarTerreno(f - 1, c - 1) === "pasto";
    const SE =
      clasificarTerreno(f + 1, c + 1) === "tierra" ||
      clasificarTerreno(f + 1, c + 1) === "pasto";
    const SO =
      clasificarTerreno(f + 1, c - 1) === "tierra" ||
      clasificarTerreno(f + 1, c - 1) === "pasto";

    if (SE) return "arena_esq_ext_SE";
    if (SO) return "arena_esq_ext_SO";
    if (NE) return "arena_esq_ext_NE";
    if (NO) return "arena_esq_ext_NO";

    return "arena_pura";
  }

  return "tierra_pura";
}

function renderizarTileEnCanvas(ctx, img, clave) {
  function draw(sx, sy, rot = 0, flipX = false, flipY = false) {
    ctx.save();
    ctx.translate(8, 8);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    if (rot !== 0) ctx.rotate(rot);
    ctx.drawImage(img, sx, sy, 16, 16, -8, -8, 16, 16);
    ctx.restore();
  }

  ctx.clearRect(0, 0, 16, 16);

  if (clave === "pasto_puro") {
    draw(0, 0);
  } else if (clave === "arena_pura") {
    draw(0, 16);
  } else if (clave === "tierra_pura") {
    draw(64, 0);
  } else if (clave.startsWith("pasto_")) {
    draw(64, 0); // Fondo de tierra

    // Bordes rectos de pasto (Tile 2, x: 32, y: 0)
    if (clave === "pasto_borde_S") draw(32, 0, 0);
    else if (clave === "pasto_borde_N") draw(32, 0, Math.PI);
    else if (clave === "pasto_borde_E") draw(32, 0, -Math.PI / 2);
    else if (clave === "pasto_borde_O") draw(32, 0, Math.PI / 2);
    // Esquinas exteriores (convexas) (Tile 1, x: 16, y: 0): mayormente pasto con esquina de tierra
    else if (clave === "pasto_esq_ext_SE") draw(16, 0, 0);
    else if (clave === "pasto_esq_ext_SO") draw(16, 0, 0, true, false);
    else if (clave === "pasto_esq_ext_NE") draw(16, 0, 0, false, true);
    else if (clave === "pasto_esq_ext_NO") draw(16, 0, Math.PI);
    // Esquinas interiores (cóncavas) (Tile 3, x: 48, y: 0): mayormente tierra con esquina de pasto
    else if (clave === "pasto_esq_int_NO") draw(48, 0, 0);
    else if (clave === "pasto_esq_int_NE") draw(48, 0, 0, true, false);
    else if (clave === "pasto_esq_int_SO") draw(48, 0, 0, false, true);
    else if (clave === "pasto_esq_int_SE") draw(48, 0, Math.PI);
    else draw(0, 0);
  } else if (clave.startsWith("arena_")) {
    draw(64, 0); // Fondo de tierra

    if (clave === "arena_borde_S") draw(32, 16, 0);
    else if (clave === "arena_borde_N") draw(32, 16, Math.PI);
    else if (clave === "arena_borde_E") draw(32, 16, -Math.PI / 2);
    else if (clave === "arena_borde_O") draw(32, 16, Math.PI / 2);
    else if (clave === "arena_esq_ext_SE") draw(16, 16, 0);
    else if (clave === "arena_esq_ext_SO") draw(16, 16, 0, true, false);
    else if (clave === "arena_esq_ext_NE") draw(16, 16, 0, false, true);
    else if (clave === "arena_esq_ext_NO") draw(16, 16, Math.PI);
    else if (clave === "arena_esq_int_NO") draw(48, 16, 0);
    else if (clave === "arena_esq_int_NE") draw(48, 16, 0, true, false);
    else if (clave === "arena_esq_int_SO") draw(48, 16, 0, false, true);
    else if (clave === "arena_esq_int_SE") draw(48, 16, Math.PI);
    else draw(0, 16);
  }
}

function inicializarTexturasSuelo() {
  if (imagenSueloOriginal) return;

  imagenSueloOriginal = new Image();
  imagenSueloOriginal.onload = () => {
    texturaSueloCargada = true;
    for (const [clave, item] of materialesSueloCache.entries()) {
      renderizarTileEnCanvas(
        item.canvas.getContext("2d"),
        imagenSueloOriginal,
        clave,
      );
      item.texture.needsUpdate = true;
    }
  };
  imagenSueloOriginal.src = "textures/mundo/Materiales_Suelo.png";
}

function obtenerMaterialBaldosa(clave) {
  if (materialesSueloCache.has(clave)) {
    return materialesSueloCache.get(clave).material;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.NearestFilter;
  configurarTexturaTerreno(tex);

  const mat = new THREE.MeshLambertMaterial({ map: tex });
  materialesSueloCache.set(clave, {
    material: mat,
    texture: tex,
    canvas: canvas,
  });

  if (imagenSueloOriginal && texturaSueloCargada) {
    renderizarTileEnCanvas(canvas.getContext("2d"), imagenSueloOriginal, clave);
    tex.needsUpdate = true;
  }
  return mat;
}

function crearBaldosaSuelo(fila, columna, x, z) {
  const clave = obtenerClaveBaldosa(fila, columna);
  const mat = obtenerMaterialBaldosa(clave);

  const baldosa = new THREE.Mesh(
    new THREE.PlaneGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA),
    mat,
  );
  baldosa.rotation.x = -Math.PI / 2;
  baldosa.position.set(x, 0, z);
  return baldosa;
}

// Distancia de Chebyshev de una celda a la celda de agua más cercana.
function distanciaAlAgua(fila, columna) {
  for (let radio = 1; radio <= 3; radio++) {
    for (let df = -radio; df <= radio; df++) {
      for (let dc = -radio; dc <= radio; dc++) {
        if (Math.abs(df) !== radio && Math.abs(dc) !== radio) continue;
        const f = fila + df;
        const c = columna + dc;
        if (f < 0 || c < 0 || f >= MAPA_ALTO || c >= MAPA_ANCHO) continue;
        if (MAPA[f][c] === 3) return radio;
      }
    }
  }
  return 99;
}

// Costa irregular: plena cerca del agua y manchas que se desvanecen hacia afuera.
function esArenaEnCosta(fila, columna) {
  const d = distanciaAlAgua(fila, columna);
  if (d <= 1) return random() < 0.85;
  if (d === 2) return random() < 0.45;
  if (d === 3) return random() < 0.15;
  return false;
}
