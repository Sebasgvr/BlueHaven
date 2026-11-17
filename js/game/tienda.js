// BVH: descarta grupos de triángulos antes de consultar colisiones precisas.
THREE.BufferGeometry.prototype.computeBoundsTree = MeshBVHLib.computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = MeshBVHLib.disposeBoundsTree;
THREE.Mesh.prototype.raycast = MeshBVHLib.acceleratedRaycast;
function acelerarMallas(modelo) {
  modelo.traverse((m) => {
    if (m.isMesh && !m.isSkinnedMesh && !m.geometry.boundsTree)
      m.geometry.computeBoundsTree();
  });
}
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
_tiendaRaycaster.firstHitOnly = true;
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
  acelerarMallas(modelo);
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

// Entrada accesible desde la zona de interacción: busca un punto libre dentro del edificio.
TIENDA.regreso = null;
function puntoInteriorTienda() {
  if (!TIENDA.mallasParedes.length) return null;
  const casa = TIENDA.mallasParedes.find((m) =>
    (m.name || "").toLowerCase().includes("house"),
  );
  if (!casa) return null;
  const caja = new THREE.Box3().setFromObject(casa),
    centro = caja.getCenter(new THREE.Vector3());
  for (const radio of [0, 20, 40, 60, 80])
    for (let i = 0; i < 8; i++) {
      const pos = createVector(
        centro.x + Math.cos((i * Math.PI) / 4) * radio,
        centro.z + Math.sin((i * Math.PI) / 4) * radio,
      );
      if (
        pos.x < caja.min.x + 15 ||
        pos.x > caja.max.x - 15 ||
        pos.y < caja.min.z + 15 ||
        pos.y > caja.max.z - 15
      )
        continue;
      if (!tiendaColisiona(pos)) return pos;
    }
  return null;
}
function entrarALaTienda() {
  if (TIENDA.regreso) return true;
  const destino = puntoInteriorTienda();
  if (!destino) return false;
  TIENDA.regreso = {
    x: jugador.posicion.x,
    y: jugador.posicion.y,
    angulo: jugador.angulo,
    inclinacion: jugador.inclinacion,
    alturaPiso: jugador.alturaPiso,
    alturaSalto: jugador.alturaSalto,
    velocidadSalto: jugador.velocidadSalto,
  };
  jugador.posicion.set(destino);
  jugador.angulo = -Math.PI / 2;
  jugador.inclinacion = 0;
  jugador.alturaPiso = tiendaAlturaPiso(destino.x, destino.y, 0);
  jugador.alturaSalto = 0;
  return true;
}
function salirDeLaTienda() {
  if (!TIENDA.regreso) return;
  const p = TIENDA.regreso;
  jugador.posicion.set(p.x, p.y);
  jugador.angulo = p.angulo;
  jugador.inclinacion = p.inclinacion;
  jugador.alturaPiso = p.alturaPiso;
  jugador.alturaSalto = p.alturaSalto;
  jugador.velocidadSalto = p.velocidadSalto;
  TIENDA.regreso = null;
}

// ===== OBJETOS Y MODELOS 3D DE LA TIENDA =====
function cargarCañaTiendaEnEscena() {
  if (!TIENDA.posicion || !escena3D) return;

  const cargador = new THREE.GLTFLoader();
  cargador.load(
    "models/bamboo_fishing_rod/scene.gltf",
    (resultado) => {
      modeloCañaTienda = resultado.scene;

      // Ocultar la cuerda/línea vertical 'Robe' que venía en el modelo y subía hacia el cielo
      modeloCañaTienda.traverse((objeto) => {
        if (objeto.name && objeto.name.toLowerCase().includes("robe")) {
          objeto.visible = false;
        }
        if (!objeto.isMesh) return;
        objeto.material.side = THREE.DoubleSide;
        objeto.castShadow = true;
      });

      const caja = new THREE.Box3().setFromObject(modeloCañaTienda);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala =
        (TAMAÑO_CELDA * 0.82 * TIENDA_FACTOR) /
        Math.max(tamaño.x, tamaño.y, tamaño.z);

      modeloCañaTienda.position.sub(centro);
      modeloCañaTienda.scale.setScalar(escala);

      // Hitbox cilíndrica invisible adherida al nodo de la caña ('Rod') para seguir su rotación y forma real
      const nodoRod =
        modeloCañaTienda.getObjectByName("Rod") || modeloCañaTienda;
      const geoHitbox = new THREE.CylinderGeometry(0.1, 0.1, 4.8, 8);
      const matHitbox = new THREE.MeshBasicMaterial({
        visible: false,
        wireframe: false,
      });
      mallaHitboxCaña = new THREE.Mesh(geoHitbox, matHitbox);
      mallaHitboxCaña.position.set(0, 0.1, 0);
      mallaHitboxCaña.name = "HitboxCañaTienda";
      nodoRod.add(mallaHitboxCaña);

      acelerarMallas(modeloCañaTienda);
      // Contenedor colocado dentro de la tienda
      grupoCañaTienda = new THREE.Group();
      grupoCañaTienda.add(modeloCañaTienda);

      // ROTACIÓN: Inclinada apoyada contra la pared interior
      modeloCañaTienda.rotation.set(1.5, -0.25, 0.2);

      // Posición dentro de la casa de pesca
      posicionBaseCaña.set(
        TIENDA.posicion.x - 10 * TIENDA_FACTOR,
        38 * TIENDA_FACTOR + TIENDA_AJUSTE_ALTURA,
        TIENDA.posicion.y - 44 * TIENDA_FACTOR,
      );

      grupoCañaTienda.position.copy(posicionBaseCaña);
      escena3D.add(grupoCañaTienda);
    },
    undefined,
    (error) =>
      console.error("No se pudo cargar la caña de bambú en la tienda:", error),
  );
}

function actualizarAnimacionCañaTienda() {
  if (!grupoCañaTienda || !modeloCañaTienda) return;

  const estaMirando = mirandoCañaTienda();
  const objetivoHover = estaMirando ? 1 : 0;
  elevacionHoverCaña = THREE.MathUtils.lerp(
    elevacionHoverCaña,
    objetivoHover,
    0.16,
  );

  // Se levanta suavemente cuando el cursor está encima y flota ligeramente
  const offsetLevantamiento =
    elevacionHoverCaña * 7.5 +
    (estaMirando ? Math.sin(frameCount * 0.12) * 1.5 : 0);
  grupoCañaTienda.position.y = posicionBaseCaña.y + offsetLevantamiento;

  // Ilumina los bordes / materiales con un resplandor verde brillante
  modeloCañaTienda.traverse((objeto) => {
    if (objeto.name && objeto.name.toLowerCase().includes("robe")) {
      objeto.visible = false;
      return;
    }
    if (objeto.isMesh && objeto.material && objeto !== mallaHitboxCaña) {
      if (objeto.material.emissive) {
        objeto.material.emissive.setHex(0x768f49); // Verde luminoso
        objeto.material.emissiveIntensity = elevacionHoverCaña * 0.45;
      }
    }
  });
}

let frameHoverCaña = -1,
  resultadoHoverCaña = false;
const rayoHoverCaña = new THREE.Raycaster(),
  centroHoverCaña = new THREE.Vector2(0, 0);
rayoHoverCaña.firstHitOnly = true;
function mirandoCañaTienda() {
  if (frameHoverCaña === frameCount) return resultadoHoverCaña;
  frameHoverCaña = frameCount;
  return (resultadoHoverCaña = calcularHoverCaña());
}
function calcularHoverCaña() {
  if (!modeloCañaTienda || !camara3D || !TIENDA.posicion) return false;

  const dx = jugador.posicion.x - posicionBaseCaña.x;
  const dz = jugador.posicion.y - posicionBaseCaña.z;
  const distJugador = Math.hypot(dx, dz);
  if (distJugador > TAMAÑO_CELDA * 3.5) return false;

  const raycaster = rayoHoverCaña;
  raycaster.setFromCamera(centroHoverCaña, camara3D);

  const intersecciones = raycaster.intersectObject(modeloCañaTienda, true);

  for (let i = 0; i < intersecciones.length; i++) {
    const hit = intersecciones[i];
    if (
      hit.object &&
      hit.object.name &&
      hit.object.name.toLowerCase().includes("robe")
    ) {
      continue;
    }
    if (hit.distance <= TAMAÑO_CELDA * 3.5) {
      return true;
    }
  }

  return false;
}

function dibujarIndicadorCañaTienda() {
  const pulso = (sin(frameCount * 0.08) + 1) / 2;

  fill(0, 0, 0, 150);
  noStroke();
  rect(width / 2 - 140, height * 0.85 - 20, 280, 36, 8);

  fill(120, 230, 255, 185 + pulso * 70);
  textAlign(CENTER, CENTER);
  textSize(15);
  text("🎣 Caña de Bambú  •  [Click] Comprar", width / 2, height * 0.85 - 2);
  textAlign(LEFT, BASELINE);
}

function cargarKiwifinaEnEscena() {
  if (!TIENDA.posicion) return;

  // Todo se multiplica por TIENDA_FACTOR para escalar y moverse junto con la tienda
  const escalaRelativa = 0.7 * TIENDA_FACTOR; // 0.7 = mismo tamaño que el jugador (altura ~45)
  const offsetX = 28 * TIENDA_FACTOR;
  const offsetZ = -28 * TIENDA_FACTOR;
  const rotacionY = -Math.PI / 2;
  const posYExtra = -5 * TIENDA_FACTOR + TIENDA_AJUSTE_ALTURA;

  const cargadorMTL = new THREE.MTLLoader();
  cargadorMTL.setPath("models/3D/");
  cargadorMTL.load(
    "KIWIFINA.mtl",
    (materiales) => {
      materiales.preload();
      const cargadorOBJ = new THREE.OBJLoader();
      cargadorOBJ.setMaterials(materiales);
      cargadorOBJ.load(
        "models/3D/KIWIFINA.obj",
        (modelo) => {
          modelo.traverse((objeto) => {
            if (!objeto.isMesh || !objeto.material) return;
            objeto.material.side = THREE.DoubleSide;
            if (objeto.material.specular) {
              objeto.material.specular.setRGB(0.12, 0.12, 0.12);
            }
            if (objeto.material.shininess !== undefined) {
              objeto.material.shininess = 6;
            }
          });

          const caja = new THREE.Box3().setFromObject(modelo);
          const centro = caja.getCenter(new THREE.Vector3());
          const tamaño = caja.getSize(new THREE.Vector3());
          const escala =
            (TAMAÑO_CELDA * escalaRelativa) /
            Math.max(tamaño.x, tamaño.y, tamaño.z);

          modelo.position.sub(centro);
          modelo.scale.setScalar(escala);
          modelo.rotation.y = rotacionY;
          modelo.position.set(
            TIENDA.posicion.x + offsetX,
            (tamaño.y * escala) / 2 + posYExtra,
            TIENDA.posicion.y + offsetZ,
          );
          escena3D.add(modelo);
        },
        undefined,
        (error) => console.error("No se pudo cargar la kiwifina:", error),
      );
    },
    undefined,
    (error) =>
      console.error("No se pudo cargar el material de kiwifina:", error),
  );
}

function cargarTiendaEnEscena() {
  const cargadorGLTF = new THREE.GLTFLoader();
  cargadorGLTF.load(
    "models/fishing_house/tiendaPesca.glb",
    (gltf) => {
      const modelo = gltf.scene;

      modelo.traverse((objeto) => {
        if (objeto.name && objeto.name.toLowerCase().includes("water")) {
          objeto.visible = false;
        }
        if (objeto.isMesh) {
          objeto.castShadow = false;
          objeto.receiveShadow = false;
          if (objeto.material) {
            objeto.material.side = THREE.DoubleSide;
          }
        }
      });

      const caja = new THREE.Box3();
      modelo.traverse((objeto) => {
        if (
          objeto.isMesh &&
          objeto.visible &&
          !(objeto.name && objeto.name.toLowerCase().includes("water"))
        ) {
          caja.expandByObject(objeto);
        }
      });
      if (caja.isEmpty()) {
        caja.setFromObject(modelo);
      }

      const centro = caja.getCenter(new THREE.Vector3());

      // La escala se controla con TIENDA_ESCALA (tienda.js)
      const escala = TIENDA_ESCALA;

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.rotation.y = -Math.PI / 2;

      // Nivelar para que el piso de madera quede al nivel del suelo caminable.
      // El ajuste se calibró con la escala base y crece proporcionalmente con la escala,
      // así el piso sigue a nivel sin importar el tamaño.
      const alturaPiso =
        ((centro.y - caja.min.y) * TIENDA_ESCALA_BASE - 226.5) * TIENDA_FACTOR +
        TIENDA_AJUSTE_ALTURA;
      modelo.position.set(TIENDA.posicion.x, alturaPiso, TIENDA.posicion.y);
      escena3D.add(modelo);
      TIENDA.objetoMundo = modelo;
      tiendaRegistrarColisiones(modelo);
    },
    undefined,
    (error) => console.error("No se pudo cargar la casa de pesca 3D:", error),
  );
}
