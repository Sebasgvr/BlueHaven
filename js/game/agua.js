// Subsistema del lago y superficie de agua optimizada
let materialLago = null;
let mallaLago = null;

function crearSuperficieLago() {
  let minColumna = MAPA_ANCHO;
  let maxColumna = -1;
  let minFila = MAPA_ALTO;
  let maxFila = -1;

  for (let fila = 0; fila < MAPA_ALTO; fila++) {
    for (let columna = 0; columna < MAPA_ANCHO; columna++) {
      if (MAPA[fila][columna] !== 3) continue;
      minColumna = Math.min(minColumna, columna);
      maxColumna = Math.max(maxColumna, columna);
      minFila = Math.min(minFila, fila);
      maxFila = Math.max(maxFila, fila);
    }
  }

  if (maxColumna < 0) return;

  const ancho = (maxColumna - minColumna + 1) * TAMAÑO_CELDA;
  const profundidad = (maxFila - minFila + 1) * TAMAÑO_CELDA;

  materialLago = new THREE.MeshStandardMaterial({
    roughness: 0.15,
    metalness: 0.1,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const cargador = new THREE.TextureLoader();
  cargador.load("textures/mundo/Agua.gif", (tex) => {
    if (typeof configurarTexturaTerreno === "function") {
      configurarTexturaTerreno(tex);
    }
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.repeat.set(
      ancho / (TAMAÑO_CELDA * 1.5),
      profundidad / (TAMAÑO_CELDA * 1.5),
    );
    texturaAgua = tex;
    materialLago.map = tex;
    materialLago.needsUpdate = true;
  });

  const geometria = new THREE.PlaneGeometry(ancho, profundidad);
  mallaLago = new THREE.Mesh(geometria, materialLago);
  mallaLago.rotation.x = -Math.PI / 2;

  const centroX = ((minColumna + maxColumna + 1) / 2) * TAMAÑO_CELDA;
  const centroZ = ((minFila + maxFila + 1) / 2) * TAMAÑO_CELDA;
  mallaLago.position.set(centroX, -0.05, centroZ);
  mallaLago.receiveShadow = true;
  escena3D.add(mallaLago);
}

function actualizarAgua() {
  if (!texturaAgua) return;
  const factor = (typeof deltaTime !== "undefined" ? deltaTime : 16) / 1000;
  texturaAgua.offset.x = (texturaAgua.offset.x + 0.05 * factor) % 1;
  texturaAgua.offset.y = (texturaAgua.offset.y + 0.03 * factor) % 1;
}
