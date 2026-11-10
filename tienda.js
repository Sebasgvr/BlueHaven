const TIENDA = {
  posicion: null,
  objetoMundo: null,
  anchoColision: 0,
  profundidadColision: 0,
  // Mallas 3D usadas para colisiones (se llenan al cargar el modelo)
  mallasParedes: [],
  mallasPiso: [],
  cajaColision: null,
  cajaPiso: null,
};

// ===== POSICIÓN DE LA TIENDA EN EL MAPA (en celdas) =====
// TIENDA_COLUMNA: izquierda/derecha (menor = más a la izquierda)
// TIENDA_FILA: arriba/abajo en el mapa (menor = más ARRIBA, mayor = más abajo)
const TIENDA_COLUMNA = 28.5;
const TIENDA_FILA = 19;

// ===== ESCALA DE LA TIENDA =====
// Cambiá SOLO este número para agrandar/achicar la tienda. Todo lo demás
// (Kiwifina, caña de la tienda, colisiones, piso, zona de interacción) se
// escala y se mueve automáticamente con ella, usando TIENDA.posicion como centro.
const TIENDA_ESCALA = 27.0;
// Escala con la que se calibraron originalmente las posiciones de los objetos
const TIENDA_ESCALA_BASE = 19.0;
// Factor de escala de la tienda respecto a la base (1 = tamaño original)
const TIENDA_FACTOR = TIENDA_ESCALA / TIENDA_ESCALA_BASE;
// Subir/bajar la tienda (y todo lo que tiene adentro: piso, Kiwifina, caña, colisiones).
// Positivo = sube, negativo = baja. Se suma a la altura calculada automáticamente.
const TIENDA_AJUSTE_ALTURA = 15;

// Altura máxima de escalón que el jugador puede subir al pisar el piso de la tienda
// (incluye el ajuste de altura para poder subir aunque la tienda esté levantada)
const TIENDA_ESCALON_MAXIMO =
  TAMAÑO_CELDA * 0.35 * TIENDA_FACTOR + Math.abs(TIENDA_AJUSTE_ALTURA);
// Alturas (relativas al piso) desde donde se lanzan rayos horizontales contra las paredes
const TIENDA_ALTURAS_RAYOS = [6, 20, 34];

const _tiendaRaycaster = new THREE.Raycaster();
const _tiendaOrigen = new THREE.Vector3();
const _tiendaDireccion = new THREE.Vector3();
const _tiendaDireccionesRayos = (() => {
  const dirs = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    dirs.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  return dirs;
})();

function tiendaInicializar() {
  // Coordenadas de columna y fila de la tienda
  TIENDA.posicion = createVector(
    TAMAÑO_CELDA * TIENDA_COLUMNA,
    TAMAÑO_CELDA * TIENDA_FILA,
  );
}

// Registra las mallas del modelo que bloquean (paredes/objetos) y el piso.
function tiendaRegistrarColisiones(modelo) {
  modelo.updateMatrixWorld(true);
  TIENDA.mallasParedes = [];
  TIENDA.mallasPiso = [];

  modelo.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const nombre = (objeto.name || "").toLowerCase();
    if (nombre.includes("water") || nombre.includes("roof")) return;
    if (nombre.includes("floor")) {
      TIENDA.mallasPiso.push(objeto);
    } else if (nombre.includes("house") || nombre.includes("box")) {
      TIENDA.mallasParedes.push(objeto);
    }
  });

  TIENDA.cajaColision = new THREE.Box3();
  TIENDA.mallasParedes.forEach((m) => TIENDA.cajaColision.expandByObject(m));
  TIENDA.cajaPiso = new THREE.Box3();
  TIENDA.mallasPiso.forEach((m) => TIENDA.cajaPiso.expandByObject(m));

  console.log(
    "Colisiones tienda:",
    TIENDA.mallasParedes.length,
    "paredes,",
    TIENDA.mallasPiso.length,
    "pisos",
  );
}

// Tamaño máximo (en unidades del mundo) de las rendijas entre tablas que se ignoran.
// Si el jugador pisa una rendija, se usa el piso más cercano dentro de este radio,
// así no "cae" entre las maderas. Subilo si todavía hay huecos que lo hacen bajar.
const TIENDA_TOLERANCIA_HUECOS = 9;

// Puntos extra (desplazamientos x, z) donde se busca piso cuando justo debajo hay una rendija
const _tiendaPuntosTolerancia = (() => {
  const puntos = [];
  for (const factor of [0.45, 1]) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      puntos.push([
        Math.cos(a) * TIENDA_TOLERANCIA_HUECOS * factor,
        Math.sin(a) * TIENDA_TOLERANCIA_HUECOS * factor,
      ]);
    }
  }
  return puntos;
})();

function _tiendaGolpePiso(x, z, referencia) {
  _tiendaOrigen.set(x, referencia + TIENDA_ESCALON_MAXIMO, z);
  _tiendaDireccion.set(0, -1, 0);
  _tiendaRaycaster.set(_tiendaOrigen, _tiendaDireccion);
  _tiendaRaycaster.far = TIENDA_ESCALON_MAXIMO + 400;
  const golpes = _tiendaRaycaster.intersectObjects(TIENDA.mallasPiso, false);
  return golpes.length ? golpes[0].point.y : null;
}

// Altura del piso/puente de la tienda en la posición (x, z). 0 si no hay piso.
// `referencia` es la altura donde está parado el jugador: solo se considera piso
// lo que esté a lo sumo un escalón por encima de ella (sirve para el puente sobre el agua
// y para cualquier altura de la tienda, también negativa).
// Las rendijas entre las maderas se ignoran (ver TIENDA_TOLERANCIA_HUECOS).
function tiendaAlturaPiso(x, z, referencia = 0) {
  if (!TIENDA.mallasPiso.length || !TIENDA.cajaPiso) return 0;
  const c = TIENDA.cajaPiso;
  if (x < c.min.x || x > c.max.x || z < c.min.z || z > c.max.z) return 0;

  let y = _tiendaGolpePiso(x, z, referencia);
  if (y !== null) return y;

  for (const [dx, dz] of _tiendaPuntosTolerancia) {
    y = _tiendaGolpePiso(x + dx, z + dz, referencia);
    if (y !== null) return y;
  }
  return 0;
}

function tiendaColisiona(posicion) {
  if (!TIENDA.mallasParedes.length || !TIENDA.cajaColision) return false;

  const radio = jugador ? jugador.margenColision : 10;
  const c = TIENDA.cajaColision;
  if (
    posicion.x < c.min.x - radio ||
    posicion.x > c.max.x + radio ||
    posicion.y < c.min.z - radio ||
    posicion.y > c.max.z + radio
  ) {
    return false;
  }

  const base = tiendaAlturaPiso(
    posicion.x,
    posicion.y,
    jugador ? jugador.alturaPiso || 0 : 0,
  );
  _tiendaRaycaster.far = radio;
  for (const altura of TIENDA_ALTURAS_RAYOS) {
    _tiendaOrigen.set(posicion.x, base + altura, posicion.y);
    for (const dir of _tiendaDireccionesRayos) {
      _tiendaRaycaster.set(_tiendaOrigen, dir);
      if (_tiendaRaycaster.intersectObjects(TIENDA.mallasParedes, false).length)
        return true;
    }
  }
  return false;
}
