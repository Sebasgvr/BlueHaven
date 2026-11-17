// Subsistema del lago y superficie de agua optimizada
let materialLago = null;
let mallaLago = null;

const AGUA_NIVEL_Y = -0.05;
// Cantidad de celdas del mapa que ocupa una repetición de la textura del agua.
const AGUA_CELDAS_POR_TEXTURA = 2;

// Textura de agua con aspecto pixel-art generada en un canvas.
// Es perfectamente repetible (celdas de Voronoi con envoltura), por lo que no
// aparecen cortes ni bordes de arena al repetirla sobre todo el lago.
function crearTexturaAgua() {
  const TAM = 64;
  const CELDAS = 6;
  const paso = TAM / CELDAS;
  const canvas = document.createElement("canvas");
  canvas.width = TAM;
  canvas.height = TAM;
  const ctx = canvas.getContext("2d");
  const imagen = ctx.createImageData(TAM, TAM);

  // Generador pseudoaleatorio con semilla fija: el agua siempre luce igual.
  let semilla = 20261117;
  const azar = () => {
    semilla = (semilla + 0x6d2b79f5) >>> 0;
    let t = semilla;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const puntos = [];
  for (let j = 0; j < CELDAS; j++)
    for (let i = 0; i < CELDAS; i++)
      puntos.push([
        (i + 0.15 + azar() * 0.7) * paso,
        (j + 0.15 + azar() * 0.7) * paso,
      ]);

  const PALETA = {
    espuma: [232, 252, 255],
    brillo: [150, 228, 255],
    claro: [92, 190, 250],
    medio: [58, 150, 244],
    hondo: [44, 118, 236],
  };
  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [px, py] of puntos) {
        // Distancia con envoltura para que los bordes encajen entre sí.
        let dx = Math.abs(x + 0.5 - px);
        let dy = Math.abs(y + 0.5 - py);
        if (dx > TAM / 2) dx = TAM - dx;
        if (dy > TAM / 2) dy = TAM - dy;
        const d = Math.hypot(dx, dy);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) d2 = d;
      }
      const borde = d2 - d1;
      const centro = d1 / paso;
      let color;
      if (borde < 0.9) color = PALETA.espuma;
      else if (borde < 1.9) color = PALETA.brillo;
      else if (centro < 0.2) color = PALETA.hondo;
      else if (centro < 0.34) color = PALETA.medio;
      else color = PALETA.claro;
      const o = (y * TAM + x) * 4;
      imagen.data[o] = color[0];
      imagen.data[o + 1] = color[1];
      imagen.data[o + 2] = color[2];
      imagen.data[o + 3] = 255;
    }
  }
  ctx.putImageData(imagen, 0, 0);

  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  // Con mipmaps el agua lejana se suaviza en lugar de formar rayas (efecto moiré).
  if (typeof configurarTexturaTerreno === "function")
    configurarTexturaTerreno(textura);
  textura.repeat.set(1, 1);
  return textura;
}

// La superficie se construye únicamente sobre las celdas de agua. Así no queda
// ningún plano de agua tapando (ni compitiendo con) el suelo de arena o pasto.
function crearSuperficieLago() {
  const posiciones = [];
  const uvs = [];
  const indices = [];
  const periodo = TAMAÑO_CELDA * AGUA_CELDAS_POR_TEXTURA;

  for (let fila = 0; fila < MAPA_ALTO; fila++) {
    for (let columna = 0; columna < MAPA_ANCHO; columna++) {
      if (MAPA[fila][columna] !== 3) continue;
      const x0 = columna * TAMAÑO_CELDA;
      const x1 = x0 + TAMAÑO_CELDA;
      const z0 = fila * TAMAÑO_CELDA;
      const z1 = z0 + TAMAÑO_CELDA;
      const base = posiciones.length / 3;
      posiciones.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);
      // UV en coordenadas de mundo: el patrón continúa sin cortes entre celdas.
      uvs.push(
        x0 / periodo,
        z0 / periodo,
        x1 / periodo,
        z0 / periodo,
        x1 / periodo,
        z1 / periodo,
        x0 / periodo,
        z1 / periodo,
      );
      indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  if (!posiciones.length) return;

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(posiciones, 3),
  );
  geometria.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(
      new Array(posiciones.length / 3).fill([0, 1, 0]).flat(),
      3,
    ),
  );
  geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setIndex(indices);
  geometria.computeBoundingSphere();

  texturaAgua = crearTexturaAgua();
  materialLago = new THREE.MeshStandardMaterial({
    map: texturaAgua,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.FrontSide,
  });

  mallaLago = new THREE.Mesh(geometria, materialLago);
  mallaLago.position.y = AGUA_NIVEL_Y;
  mallaLago.frustumCulled = false;
  escena3D.add(mallaLago);
}

function actualizarAgua() {
  if (!texturaAgua) return;
  const factor = (typeof deltaTime !== "undefined" ? deltaTime : 16) / 1000;
  texturaAgua.offset.x = (texturaAgua.offset.x + 0.02 * factor) % 1;
  texturaAgua.offset.y = (texturaAgua.offset.y + 0.012 * factor) % 1;
}
