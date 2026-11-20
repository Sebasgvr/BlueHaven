const ANCHO_JUEGO = 480;
const ALTO_JUEGO = 270;

let jugador;
let sistemaCaptura;
let spritesPeces = {};
let texturaAgua = null;
let catalogoEspecies = [];

let escena3D;
let camara3D;
let renderizador3D;
let ratonBloqueado = false;

function preload() {
  for (const especie of CATALOGO_ESPECIES) {
    if (especie.sprite)
      spritesPeces[especie.sprite] = loadImage(
        "textures/peces/" + especie.sprite,
      );
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  clear();
  pixelDensity(1);
  document.addEventListener("wheel", manejarRuedaEnciclopedia, {
    passive: false,
  });
  const interfaz = document.querySelector("canvas");
  interfaz.style.position = "fixed";
  interfaz.style.inset = "0";
  interfaz.style.zIndex = "2";
  interfaz.style.pointerEvents = "none";

  // Spawn en la parte superior de la escalera del muelle, mirando hacia el mar
  jugador = new Jugador(1755, 1220);
  jugador.angulo = Math.PI;
  jugador.alturaPiso = 28.8;
  sistemaCaptura = new SistemaCaptura();
  TIENDA.posicion = createVector(
    TAMAÑO_CELDA * TIENDA_COLUMNA,
    TAMAÑO_CELDA * TIENDA_FILA,
  );

  inicializarEscena3D();
  noLoop();
  window.juegoPreparado = true;
  window.dispatchEvent(new Event("juego-preparado"));
}

// auth.js llama a esta función cuando el login/registro en el backend sale bien
async function iniciarJuego() {
  if (!window.juegoPreparado) {
    await new Promise((resolve) =>
      window.addEventListener("juego-preparado", resolve, { once: true }),
    );
  }
  reiniciarEstadoEnMemoria();
  cargarProgresoLocal();
  if (!window.modoInvitado) await cargarDatosUsuario();
  window.TutorialJuego?.evaluarInicio();
  loop();
}

async function cargarDatosUsuario() {
  const estado = await BaseDatos.estado();
  if (
    !estado?.perfil ||
    !Array.isArray(estado.catalogo) ||
    !Array.isArray(estado.inventario)
  ) {
    throw new Error("No se pudo cargar tu partida de Supabase.");
  }
  window.sesionUsuario = estado.perfil;
  catalogoEspecies = estado.catalogo;
  inventario = estado.inventario;
  CATALOGO_ESPECIES.splice(
    0,
    CATALOGO_ESPECIES.length,
    ...catalogoEspecies.map((p) => ({
      ...p.datos,
      ...p,
      sprite: SPRITES_ESPECIES[p.nombre] || p.sprite || p.datos?.sprite,
    })),
  );
  for (const k in REGISTRO_CAPTURAS) delete REGISTRO_CAPTURAS[k];
  for (const especie of catalogoEspecies) {
    if (especie.descubierto)
      REGISTRO_CAPTURAS[especie.nombre] = {
        capturas: Number(especie.cantidad_capturada),
        mejorCalidadId: especie.mejorCalidadId,
        mejorPrecio: especie.mejorPrecio,
      };
  }
  dinero = Number(estado.perfil.dinero) || 0;
  tieneCañaBambu = estado.perfil.tiene_bambu === true;
  cañaEquipada =
    tieneCañaBambu && cañaEquipada === "bambu" ? "bambu" : "basica";
  await cargarEquipoRemoto();
  guardarProgresoLocal();
}

function draw() {
  if (document.hidden) return;
  clear();
  actualizarRendimiento();

  const guiaActiva =
    typeof bienvenidaActiva === "function" && bienvenidaActiva();

  // Ocultar la caña del jugador mientras esté la Guía del Pescador
  if (cañaPesca) {
    cañaPesca.visible = !guiaActiva;
  }
  if (lineaPesca && guiaActiva) lineaPesca.visible = false;
  if (anzueloPesca && guiaActiva) anzueloPesca.visible = false;

  // Bloquear toda interacción del jugador mientras la bienvenida esté activa
  if (!guiaActiva && !interfazBloqueada()) {
    if (
      !interfazBloqueada() &&
      sistemaCaptura.estado === "inactivo" &&
      menuTienda === "cerrado" &&
      estadoLanzamiento === "reposo" &&
      !preparandoLance
    ) {
      jugador.actualizar();
    }

    actualizarEncuadrePesca(Math.min(deltaTime / 1000, 0.05));
    actualizarCamara3D();
    actualizarLanzamientoAnzuelo();
    actualizarFlotadorPesca(Math.min(deltaTime / 1000, 0.05));
    actualizarCañaPesca();
    actualizarAgua();
    actualizarAnimacionCañaTienda();
    if (typeof actualizarVidaMundo === "function")
      actualizarVidaMundo(Math.min(deltaTime / 1000, 0.05));
  } else {
    // Si la guía está activa, mantener agua y cámara vivas de fondo
    actualizarCamara3D();
    actualizarAgua();
    actualizarAnimacionCañaTienda();
    if (typeof actualizarVidaMundo === "function")
      actualizarVidaMundo(Math.min(deltaTime / 1000, 0.05));
  }

  actualizarCartelRanking();
  renderizador3D.render(escena3D, camara3D);

  if (!guiaActiva && !interfazBloqueada()) {
    enEspacioPesca(() => sistemaCaptura.actualizar());
    enEspacioPesca(() => sistemaCaptura.dibujar(), true);

    if (menuTienda === "cerrado" && sistemaCaptura.estado === "inactivo") {
      if (cercaDeTienda()) {
        if (mirandoCañaTienda()) dibujarIndicadorCañaTienda();
        else dibujarIndicadorTienda();
      } else if (cercaDelAgua() || estadoLanzamiento !== "reposo") {
        dibujarIndicadorPesca();
      }
    }

    dibujarHUD();

    if (ratonBloqueado) dibujarPuntero();

    dibujarEnciclopedia();
  }

  // La bienvenida siempre se dibuja encima de todo
  dibujarBienvenida();
  window.TutorialJuego?.actualizar();
  actualizarControlesTactiles();
}

function mouseMoved(evento) {
  moverCamaraConMouse(evento);
}

function moverCamaraConMouse(evento) {
  if (ENCICLOPEDIA.abierta) {
    actualizarHoverEnciclopedia(evento.clientX, evento.clientY);
    return;
  }
  if (
    interfazBloqueada() ||
    !ratonBloqueado ||
    sistemaCaptura.estado !== "inactivo"
  )
    return;

  jugador.girarMouse(evento.movementX);
  jugador.mirarMouse(-evento.movementY);
}

function dibujarPuntero() {
  const cx = width / 2;
  const cy = height / 2;

  stroke(255, 255, 255, 220);
  strokeWeight(2);
  line(cx - 9, cy, cx - 3, cy);
  line(cx + 3, cy, cx + 9, cy);
  line(cx, cy - 9, cx, cy - 3);
  line(cx, cy + 3, cx, cy + 9);
  noStroke();
}

function cercaDelAgua() {
  if (!jugador) return false;

  const px = jugador.posicion.x;
  const pz = jugador.posicion.y;
  const celdaX = Math.floor(px / TAMAÑO_CELDA);
  const celdaZ = Math.floor(pz / TAMAÑO_CELDA);
  if (MAPA[celdaZ] && MAPA[celdaZ][celdaX] === 3) return false;

  const radioBusqueda = 2;
  const distanciaMaxima = TAMAÑO_CELDA * 1.15;
  for (
    let fila = celdaZ - radioBusqueda;
    fila <= celdaZ + radioBusqueda;
    fila++
  ) {
    for (
      let columna = celdaX - radioBusqueda;
      columna <= celdaX + radioBusqueda;
      columna++
    ) {
      if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO)
        continue;
      if (MAPA[fila][columna] !== 3) continue;

      const minX = columna * TAMAÑO_CELDA;
      const maxX = minX + TAMAÑO_CELDA;
      const minZ = fila * TAMAÑO_CELDA;
      const maxZ = minZ + TAMAÑO_CELDA;
      const dx = Math.max(minX - px, 0, px - maxX);
      const dz = Math.max(minZ - pz, 0, pz - maxZ);
      if (Math.hypot(dx, dz) <= distanciaMaxima) return true;
    }
  }
  return false;
}

const _rayoHoverKiwifina = new THREE.Raycaster();
const _centroHoverKiwifina = new THREE.Vector2(0, 0);

function posicionKiwifina() {
  if (window.modeloKiwifina) {
    return window.modeloKiwifina.position;
  }
  if (!TIENDA.posicion) return null;
  return new THREE.Vector3(
    TIENDA.posicion.x + 28 * TIENDA_FACTOR,
    20,
    TIENDA.posicion.y - 28 * TIENDA_FACTOR,
  );
}

function mirandoKiwifina() {
  if (!window.modeloKiwifina || !camara3D || !jugador) return false;
  const kPos = posicionKiwifina();
  if (!kPos) return false;
  const dist = Math.hypot(jugador.posicion.x - kPos.x, jugador.posicion.y - kPos.z);
  if (dist > TAMAÑO_CELDA * 2.2 * TIENDA_FACTOR) return false;

  _rayoHoverKiwifina.setFromCamera(_centroHoverKiwifina, camara3D);
  const hits = _rayoHoverKiwifina.intersectObject(window.modeloKiwifina, true);
  return hits.length > 0;
}

function cercaDeKiwifina() {
  if (!TIENDA.posicion || !jugador) return false;
  if (mirandoKiwifina()) return true;

  const kPos = posicionKiwifina();
  if (!kPos) return false;
  const dist = Math.hypot(jugador.posicion.x - kPos.x, jugador.posicion.y - kPos.z);

  // Si ya estás dentro de la tienda
  if (TIENDA.regreso) {
    return dist <= TAMAÑO_CELDA * 1.8 * TIENDA_FACTOR;
  }

  // Si estás afuera, tenés que estar cerca del mostrador / ventana de Kiwifina
  return dist <= TAMAÑO_CELDA * 1.35 * TIENDA_FACTOR;
}

function cercaDeTienda() {
  return cercaDeKiwifina();
}

function dibujarIndicadorPesca() {
  const pulso = (sin(frameCount * 0.08) + 1) / 2;

  fill(0, 0, 0, 135);
  noStroke();
  rect(width / 2 - 115, height * 0.85 - 20, 230, 36, 8);

  fill(255, 240, 100, 185 + pulso * 70);
  textAlign(CENTER, CENTER);
  textSize(14);
  let instruccion = "[F] Lanzar la caña";
  if (estadoLanzamiento === "reposo" && buscarPuntoPescaEnfrente()) {
    instruccion = "[F] Lanzar al agua";
  } else if (
    estadoLanzamiento === "en_agua" ||
    estadoLanzamiento === "esperando"
  ) {
    instruccion = "[F] Recoger la línea";
  } else if (estadoLanzamiento === "lanzando") {
    instruccion = "Lanzando...";
  } else if (estadoLanzamiento === "retrayendo") {
    // El anzuelo vuelve a la punta de la caña (que se mueve), no a donde estaba al lanzar
    inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
    instruccion = "Recogiendo...";
  }
  text(instruccion, width / 2, height * 0.85 - 2);
  textAlign(LEFT, BASELINE);
}

function keyPressed() {
  // Con el chat abierto ignoramos las teclas del juego para poder escribir en el input
  if (interfazBloqueada()) return;
  // Cerrar la pantalla de bienvenida con cualquier tecla
  if (bienvenidaActiva()) {
    cerrarBienvenida();
    return false;
  }

  // Si la enciclopedia está abierta, capturar todas las teclas
  if (ENCICLOPEDIA.abierta) {
    const anterior =
      key === "w" ||
      key === "W" ||
      keyCode === UP_ARROW ||
      key === "a" ||
      key === "A" ||
      keyCode === LEFT_ARROW;
    const siguiente =
      key === "s" ||
      key === "S" ||
      keyCode === DOWN_ARROW ||
      key === "d" ||
      key === "D" ||
      keyCode === RIGHT_ARROW;
    if (anterior) navegarEnciclopedia(-1);
    else if (siguiente) navegarEnciclopedia(1);
    else if (
      key === "e" ||
      key === "E" ||
      keyCode === ESCAPE ||
      key === "l" ||
      key === "L"
    )
      cerrarEnciclopedia();
    return false;
  }

  if (keyCode === ESCAPE) {
    if (menuTienda !== "cerrado") {
      cerrarMenu();
      return false;
    }
    cancelarPesca();
    return false;
  }
  if (menuTienda !== "cerrado") {
    const tecla = (key || "").toLowerCase();
    if (tecla === "e" || tecla === "i" || keyCode === ESCAPE) {
      cerrarMenu();
    }
    return false;
  }
  if (key === "i" || key === "I") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo"
    ) {
      abrirMenuInventario();
    }
    return false;
  }
  if (key === "l" || key === "L") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo" &&
      menuTienda === "cerrado"
    ) {
      abrirEnciclopedia();
    }
    return false;
  }
  if (key === "e" || key === "E") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo" &&
      cercaDeTienda()
    ) {
      abrirMenuTienda();
    }
    return false;
  }
  if (key === "f" || key === "F") {
    ejecutarAccionPesca();
    return false;
  }
  if (key === "h" || key === "H") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo" &&
      menuTienda === "cerrado"
    ) {
      window.TutorialJuego?.abrirModal("general");
    }
    return false;
  }

  if (keyCode === 32) {
    if (sistemaCaptura.estado === "inactivo") {
      jugador.saltar();
    } else {
      sistemaCaptura.presionarBoton();
    }
    return false;
  }
  if (sistemaCaptura.estado !== "inactivo") {
    const tecla = (key || "").toLowerCase();
    if (["a", "s", "d", "z", "x", "c"].indexOf(tecla) !== -1) {
      sistemaCaptura.presionarTecla(key, keyCode);
      return false;
    }
  }
}

function ejecutarAccionPesca() {
  if (sistemaCaptura.estado === "decidiendo_riesgo") {
    sistemaCaptura.elegirRiesgo(true);
    return false;
  }
  if (sistemaCaptura.estado === "esperando_mordida" && anzueloLanzado) {
    sistemaCaptura.cancelar();
    iniciarRecogidaAnzuelo();
  } else if (sistemaCaptura.estado === "inactivo") {
    if (
      estadoLanzamiento === "reposo" ||
      estadoLanzamiento === "en_agua" ||
      estadoLanzamiento === "esperando"
    ) {
      lanzarORecogerCaña();
    }
  }
}

function keyReleased() {
  if (interfazBloqueada()) return;
  if (keyCode === 32) {
    sistemaCaptura.soltarBoton();
    return false;
  }
  if (sistemaCaptura.estado !== "inactivo") {
    const tecla = (key || "").toLowerCase();
    if (["a", "s", "d", "z", "x", "c"].indexOf(tecla) !== -1) {
      sistemaCaptura.soltarTecla(key, keyCode);
      return false;
    }
  }
}

let _ignorarSiguienteClic = false;

function controlarClicEscena(evento) {
  // En teléfonos los gestos los administra el controlador táctil, no el clic de escritorio.
  if (window.ControlTactil?.activo) return;
  if (interfazBloqueada()) return;
  // Cerrar la pantalla de bienvenida con clic
  if (bienvenidaActiva()) {
    cerrarBienvenida();
    return;
  }

  if (ENCICLOPEDIA.abierta) {
    manejarClicEnciclopedia(evento.clientX, evento.clientY);
    return;
  }

  if (cercaDeTienda() && mirandoCañaTienda()) {
    abrirMenuComprarCaña();
    return;
  }

  if (sistemaCaptura.estado !== "inactivo") {
    sistemaCaptura.presionarBoton({ x: evento.clientX, y: evento.clientY });
    return;
  }

  // Si el mouse no estaba bloqueado, este clic es para bloquearlo —
  // no cuenta como acción de juego. Se ignora el siguiente evento también
  // porque algunos navegadores disparan el pointerdown antes de confirmar el lock.
  if (!ratonBloqueado) {
    _ignorarSiguienteClic = true;
    renderizador3D.domElement.requestPointerLock();
    return;
  }

  // Primer clic tras adquirir el pointer lock: lo descartamos para no
  // activar acciones de pesca/minijuego con el mismo clic que bloqueó.
  if (_ignorarSiguienteClic) {
    _ignorarSiguienteClic = false;
    return;
  }
}

function actualizarEstadoRaton() {
  const bloqueadoAntes = ratonBloqueado;
  ratonBloqueado = document.pointerLockElement === renderizador3D.domElement;
  // Si se acaba de desbloquear, el próximo clic para re-bloquearlo no debe
  // activar acciones de juego.
  if (bloqueadoAntes && !ratonBloqueado) {
    _ignorarSiguienteClic = true;
  }
}

function inicializarEscena3D() {
  escena3D = new THREE.Scene();
  camara3D = new THREE.PerspectiveCamera(
    58,
    windowWidth / windowHeight,
    CERCA_CAMARA_MUNDO,
    TAMAÑO_CELDA * 80,
  );
  camara3D.rotation.order = "YXZ";
  renderizador3D = new THREE.WebGLRenderer({ antialias: false });
  aplicarCalidadGrafica();
  renderizador3D.setSize(windowWidth, windowHeight);
  renderizador3D.outputEncoding = THREE.sRGBEncoding;
  renderizador3D.domElement.style.position = "fixed";
  renderizador3D.domElement.style.inset = "0";
  renderizador3D.domElement.style.zIndex = "1";
  renderizador3D.domElement.style.imageRendering = "pixelated";
  document.body.appendChild(renderizador3D.domElement);
  renderizador3D.domElement.addEventListener(
    "pointerdown",
    controlarClicEscena,
  );
  renderizador3D.domElement.addEventListener("contextmenu", (e) =>
    e.preventDefault(),
  );
  renderizador3D.domElement.addEventListener("mouseup", () => {
    if (sistemaCaptura.estado !== "inactivo") sistemaCaptura.soltarBoton();
  });
  document.addEventListener("pointerlockchange", actualizarEstadoRaton);
  document.addEventListener("mousemove", moverCamaraConMouse);

  escena3D.add(new THREE.HemisphereLight(0xbfe9ff, 0x42633c, 0.5));
  const sol = new THREE.DirectionalLight(0xfff0c7, 0.5);
  sol.position.set(-300, 500, 200);
  escena3D.add(sol);

  // Cielo con gradiente usando canvas 2D (estilo retro, sin glitches)
  const canvasCielo = document.createElement("canvas");
  canvasCielo.width = 16;
  canvasCielo.height = 256;
  const ctxCielo = canvasCielo.getContext("2d");
  const gradiente = ctxCielo.createLinearGradient(0, 0, 0, 256);
  gradiente.addColorStop(0, "#3a7bd5");
  gradiente.addColorStop(0.5, "#6db3e8");
  gradiente.addColorStop(1, "#c8e8f8");
  ctxCielo.fillStyle = gradiente;
  ctxCielo.fillRect(0, 0, 16, 256);
  const texturaCielo = new THREE.CanvasTexture(canvasCielo);
  texturaCielo.magFilter = THREE.NearestFilter;
  texturaCielo.minFilter = THREE.NearestFilter;
  escena3D.background = texturaCielo;

  // Niebla para profundidad (estilo retro)
  escena3D.fog = new THREE.Fog(0xc8e8f8, TAMAÑO_CELDA * 12, TAMAÑO_CELDA * 38);

  inicializarTexturasSuelo();
  crearEntornoExterior();

  const cargador = new THREE.TextureLoader();

  const texturaPared3D = cargador.load("textures/mundo/pared.png");
  texturaPared3D.wrapS = THREE.RepeatWrapping;
  texturaPared3D.wrapT = THREE.RepeatWrapping;
  texturaPared3D.magFilter = THREE.NearestFilter;
  texturaPared3D.minFilter = THREE.NearestFilter;
  texturaPared3D.repeat.set(1, 1);

  const materialPared = new THREE.MeshLambertMaterial({ map: texturaPared3D });
  construirTerrenoInstanciado(materialPared);

  crearSuperficieLago();

  cargarTiendaEnEscena();
  cargarKiwifinaEnEscena();
  cargarCañaTiendaEnEscena();
  cargarCañaPesca();
  cargarArboles();
  if (typeof inicializarVidaMundo === "function") inicializarVidaMundo(escena3D);
}

let modeloCañaTienda = null;
let grupoCañaTienda = null;
let elevacionHoverCaña = 0;
let posicionBaseCaña = new THREE.Vector3();
let mallaHitboxCaña = null;

function actualizarCamara3D() {
  const descensoAgachado =
    (jugador.factorAgachado || 0) * (TAMAÑO_CELDA * 0.35);
  // Elevación del piso de la tienda bajo el jugador (suavizada)
  const objetivoPiso =
    typeof tiendaAlturaPiso === "function"
      ? tiendaAlturaPiso(
          jugador.posicion.x,
          jugador.posicion.y,
          jugador.alturaPiso || 0,
        )
      : 0;
  jugador.alturaPiso = lerp(jugador.alturaPiso || 0, objetivoPiso, 0.35);
  camara3D.position.set(
    jugador.posicion.x,
    TAMAÑO_CELDA * 0.7 +
      jugador.alturaPiso +
      jugador.alturaSalto -
      descensoAgachado,
    jugador.posicion.y,
  );
  camara3D.rotation.set(jugador.inclinacion, -jugador.angulo - Math.PI / 2, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  aplicarCalidadGrafica();
  if (!camara3D || !renderizador3D) return;
  camara3D.aspect = windowWidth / windowHeight;
  camara3D.updateProjectionMatrix();
  renderizador3D.setSize(windowWidth, windowHeight);
}
