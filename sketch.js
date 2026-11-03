const ANCHO_JUEGO = 480;
const ALTO_JUEGO = 270;

let jugador;
let sistemaCaptura;
let spritesPeces = {};
let texturaAgua = null;

let escena3D;
let camara3D;
let renderizador3D;
let ratonBloqueado = false;
let cañaPesca;
let grupoAnzuelo;
let lineaPesca;
let anzueloPesca;
let anzueloLanzado = false;
let estadoLanzamiento = "reposo";
let progresoLanzamiento = 0;
let tiempoEnAgua = 0;
let esperaMordida = 0;
let lanzamientoCaeEnAgua = false;
let puntaCaña = new THREE.Vector3(0.12, -0.22, -0.72);
let destinoPescaMundo = new THREE.Vector3();
let inicioLanzamientoMundo = new THREE.Vector3();
let posicionAnzueloMundo = new THREE.Vector3();
let flotadorPesca = null;
let ondasFlotador = [];
let faseSalpicadura = 0;
let ajusteMiradaPesca = null;

function preload() {
  spritesPeces["Atun.png"] = loadImage("textures/peces/Atun.png");
  spritesPeces["Calamar.png"] = loadImage("textures/peces/Calamar.png");
  spritesPeces["Ballena_azul.png"] = loadImage(
    "textures/peces/Ballena_azul.png",
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  clear();
  pixelDensity(1);
  const interfaz = document.querySelector("canvas");
  interfaz.style.position = "fixed";
  interfaz.style.inset = "0";
  interfaz.style.zIndex = "2";
  interfaz.style.pointerEvents = "none";

  jugador = new Jugador(TAMAÑO_CELDA * 32, TAMAÑO_CELDA * 19);

  sistemaCaptura = new SistemaCaptura();
  TIENDA.posicion = createVector(TAMAÑO_CELDA * 28.5, TAMAÑO_CELDA * 19);
  inicializarEscena3D();
}

function draw() {
  clear();

  if (
    sistemaCaptura.estado === "inactivo" &&
    menuTienda === "cerrado" &&
    estadoLanzamiento === "reposo"
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
  renderizador3D.render(escena3D, camara3D);

  sistemaCaptura.actualizar();
  sistemaCaptura.dibujar();

  if (menuTienda !== "cerrado") {
    if (menuTienda === "tienda") dibujarPanelVenta();
    else if (menuTienda === "comprar_caña") dibujarPanelComprarCaña();
    else dibujarPanelInventario();
  } else if (sistemaCaptura.estado === "inactivo") {
    if (mirandoCañaTienda()) dibujarIndicadorCañaTienda();
    else if (cercaDelAgua()) dibujarIndicadorPesca();
    else if (cercaDeTienda()) dibujarIndicadorTienda();
  }

  dibujarHUD();

  if (ratonBloqueado) dibujarPuntero();

  dibujarEnciclopedia();
}

function mouseMoved(evento) {
  moverCamaraConMouse(evento);
}

function moverCamaraConMouse(evento) {
  if (!ratonBloqueado || sistemaCaptura.estado !== "inactivo") return;

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
  for (let fila = celdaZ - radioBusqueda; fila <= celdaZ + radioBusqueda; fila++) {
    for (let columna = celdaX - radioBusqueda; columna <= celdaX + radioBusqueda; columna++) {
      if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO) continue;
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

function cercaDeTienda() {
  if (!TIENDA.posicion) return false;
  return (
    p5.Vector.dist(jugador.posicion, TIENDA.posicion) <= TAMAÑO_CELDA * 3.2
  );
}

function dibujarIndicadorPesca() {
  const pulso = (sin(frameCount * 0.08) + 1) / 2;

  fill(0, 0, 0, 135);
  noStroke();
  rect(width / 2 - 115, height * 0.85 - 20, 230, 36, 8);

  fill(255, 240, 100, 185 + pulso * 70);
  textAlign(CENTER, CENTER);
  textSize(14);
  let instruccion = "Mirá hacia el agua para lanzar";
  if (estadoLanzamiento === "reposo" && buscarPuntoPescaEnfrente()) {
    instruccion = "[F]  Lanzar la caña";
  } else if (estadoLanzamiento === "en_agua" || estadoLanzamiento === "esperando") {
    instruccion = "[F]  Recoger la línea";
  } else if (estadoLanzamiento === "lanzando") {
    instruccion = "Lanzando...";
  } else if (estadoLanzamiento === "retrayendo") {
    instruccion = "Recogiendo...";
  }
  text(instruccion, width / 2, height * 0.85 - 2);
  textAlign(LEFT, BASELINE);
}

function keyPressed() {
  // Si la enciclopedia está abierta, capturar todas las teclas
  if (ENCICLOPEDIA.abierta) {
    if (key === "w" || key === "W" || keyCode === UP_ARROW) navegarEnciclopedia(-1);
    else if (key === "s" || key === "S" || keyCode === DOWN_ARROW) navegarEnciclopedia(1);
    else if (key === "e" || key === "E" || keyCode === ESCAPE || key === "l" || key === "L") cerrarEnciclopedia();
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
    if (menuTienda === "comprar_caña") {
      if (tecla === "e") comprarCañaTienda();
      else if (tecla === "q" || keyCode === ESCAPE) cerrarMenu();
      return false;
    }
    if (tecla === "b" && menuTienda === "tienda") venderTodos();
    else if (tecla === "e" || tecla === "i" || tecla === "b" || keyCode === ESCAPE) cerrarMenu();
    return false;
  }
  if (key === "i" || key === "I") {
    if (sistemaCaptura.estado === "inactivo" && estadoLanzamiento === "reposo") {
      abrirMenuInventario();
    }
    return false;
  }
  if (key === "l" || key === "L") {
    if (sistemaCaptura.estado === "inactivo" && estadoLanzamiento === "reposo" && menuTienda === "cerrado") {
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
      if (inventario.length > 0) abrirMenuTienda();
      else mostrarMensaje("No tenés peces para vender.");
    }
    return false;
  }
  if (key === "f" || key === "F") {
    if (sistemaCaptura.estado === "esperando_mordida" && anzueloLanzado) {
      sistemaCaptura.cancelar();
      iniciarRecogidaAnzuelo();
    } else if (sistemaCaptura.estado === "inactivo") {
      if (estadoLanzamiento === "reposo" && cercaDelAgua()) {
        const destino = buscarPuntoPescaEnfrente();
        if (destino) iniciarLanzamientoAnzuelo(destino);
        else mostrarMensaje("Mirá hacia el agua para lanzar la caña.");
      } else if (estadoLanzamiento === "en_agua" || estadoLanzamiento === "esperando") {
        iniciarRecogidaAnzuelo();
      }
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

function keyReleased() {
  if (keyCode === 32) {
    sistemaCaptura.soltarBoton();
    return false;
  }
}

function mousePressed() {
  if (sistemaCaptura.estado !== "inactivo") {
    sistemaCaptura.presionarBoton({ x: mouseX, y: mouseY });
  }
}

function mouseReleased() {
  if (sistemaCaptura.estado !== "inactivo") {
    sistemaCaptura.soltarBoton();
  }
}

function controlarClicEscena(evento) {
  if (menuTienda === "tienda") {
    manejarClicVenta(evento.clientX, evento.clientY);
    return;
  }
  if (menuTienda === "comprar_caña") {
    manejarClicComprarCaña(evento.clientX, evento.clientY);
    return;
  }
  if (menuTienda === "inventario") {
    cerrarMenu();
    return;
  }

  if (mirandoCañaTienda()) {
    abrirMenuComprarCaña();
    return;
  }

  if (sistemaCaptura.estado !== "inactivo") {
    sistemaCaptura.presionarBoton();
    return;
  }

  if (!ratonBloqueado) renderizador3D.domElement.requestPointerLock();
}

function cancelarPesca() {
  if (sistemaCaptura.estado === "inactivo" && estadoLanzamiento === "reposo")
    return;

  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  ajusteMiradaPesca = null;
  if (flotadorPesca) flotadorPesca.visible = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

function iniciarLanzamientoAnzuelo(destino) {
  if (!destino) return;
  destinoPescaMundo.copy(destino);
  const distanciaHorizontal = Math.hypot(
    destino.x - jugador.posicion.x,
    destino.z - jugador.posicion.y,
  );
  const inclinacionObjetivo = -Math.atan2(
    Math.max(8, camara3D.position.y - 0.8),
    Math.max(20, distanciaHorizontal),
  );
  ajusteMiradaPesca = {
    origen: jugador.inclinacion,
    destino: Math.min(jugador.inclinacion, constrain(inclinacionObjetivo, -0.74, 0.1)),
    progreso: 0,
  };
  inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
  posicionAnzueloMundo.copy(inicioLanzamientoMundo);
  lanzamientoCaeEnAgua = true;
  anzueloLanzado = true;
  estadoLanzamiento = "lanzando";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  faseSalpicadura = 0;
  if (flotadorPesca) flotadorPesca.visible = false;
}

function actualizarEncuadrePesca(dt) {
  if (!ajusteMiradaPesca) return;
  ajusteMiradaPesca.progreso = Math.min(1, ajusteMiradaPesca.progreso + dt * 2.4);
  const t = ajusteMiradaPesca.progreso;
  const suave = t * t * (3 - 2 * t);
  jugador.inclinacion = lerp(
    ajusteMiradaPesca.origen,
    ajusteMiradaPesca.destino,
    suave,
  );
  if (t >= 1) ajusteMiradaPesca = null;
}

function buscarPuntoPescaEnfrente() {
  if (!camara3D || !jugador) return null;

  const direccion = new THREE.Vector3();
  camara3D.getWorldDirection(direccion);
  direccion.y = 0;
  if (direccion.lengthSq() < 0.0001) return null;
  direccion.normalize();

  const origenX = jugador.posicion.x;
  const origenZ = jugador.posicion.y;
  const paso = 8;
  const distanciaMaxima = TAMAÑO_CELDA * 9;
  for (let distancia = TAMAÑO_CELDA * 0.35; distancia <= distanciaMaxima; distancia += paso) {
    const x = origenX + direccion.x * distancia;
    const z = origenZ + direccion.z * distancia;
    const columna = Math.floor(x / TAMAÑO_CELDA);
    const fila = Math.floor(z / TAMAÑO_CELDA);
    if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO) break;
    if (MAPA[fila][columna] === 3) {
      return new THREE.Vector3(
        (columna + 0.5) * TAMAÑO_CELDA,
        0.08,
        (fila + 0.5) * TAMAÑO_CELDA,
      );
    }
  }
  return null;
}

function calcularPuntaCañaMundo() {
  const puntaLocal = new THREE.Vector3(3.0, -3.0, -1.4).add(puntaCaña);
  return puntaLocal.applyQuaternion(camara3D.quaternion).add(camara3D.position);
}

function actualizarPosicionAnzueloEnArco(progreso) {
  posicionAnzueloMundo.copy(inicioLanzamientoMundo).lerp(destinoPescaMundo, progreso);
  const distancia = inicioLanzamientoMundo.distanceTo(destinoPescaMundo);
  const alturaArco = Math.min(18, Math.max(7, distancia * 0.08));
  posicionAnzueloMundo.y += Math.sin(progreso * Math.PI) * alturaArco;
}

function iniciarRecogidaAnzuelo() {
  if (!anzueloLanzado || sistemaCaptura.estado !== "inactivo") return;
  estadoLanzamiento = "retrayendo";
  progresoLanzamiento = 1;
  tiempoEnAgua = 0;
}

function retraerAnzuelo() {
  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  if (flotadorPesca) flotadorPesca.visible = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

function actualizarLanzamientoAnzuelo() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  if (estadoLanzamiento === "lanzando") {
    progresoLanzamiento = Math.min(1, progresoLanzamiento + dt * 1.05);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento >= 1) {
      if (lanzamientoCaeEnAgua) {
        estadoLanzamiento = "en_agua";
        posicionAnzueloMundo.copy(destinoPescaMundo);
        faseSalpicadura = 1;
        esperaMordida = random(2, 6);
      } else {
        estadoLanzamiento = "retrayendo";
      }
    }
  } else if (estadoLanzamiento === "retrayendo") {
    progresoLanzamiento = Math.max(0, progresoLanzamiento - dt * 1.8);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento === 0) retraerAnzuelo();
  } else if (estadoLanzamiento === "en_agua") {
    tiempoEnAgua += dt;
    if (tiempoEnAgua >= esperaMordida) {
      estadoLanzamiento = "esperando";
      sistemaCaptura.iniciar(random(PECES_CAPTURA));
    }
  }
}

function actualizarEstadoRaton() {
  ratonBloqueado = document.pointerLockElement === renderizador3D.domElement;
}

function inicializarEscena3D() {
  escena3D = new THREE.Scene();
  camara3D = new THREE.PerspectiveCamera(
    58,
    windowWidth / windowHeight,
    0.01,
    TAMAÑO_CELDA * 80,
  );
  camara3D.rotation.order = "YXZ";
  renderizador3D = new THREE.WebGLRenderer({ antialias: false });
  renderizador3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  escena3D.fog = new THREE.Fog(0xc8e8f8, TAMAÑO_CELDA * 15, TAMAÑO_CELDA * 65);

  inicializarTexturasSuelo();

  const cargador = new THREE.TextureLoader();

  const texturaPared3D = cargador.load("textures/mundo/pared.png");
  texturaPared3D.wrapS = THREE.RepeatWrapping;
  texturaPared3D.wrapT = THREE.RepeatWrapping;
  texturaPared3D.magFilter = THREE.NearestFilter;
  texturaPared3D.minFilter = THREE.NearestFilter;
  texturaPared3D.repeat.set(1, 1);

  const materialPared = new THREE.MeshLambertMaterial({ map: texturaPared3D });
  for (let fila = 0; fila < MAPA_ALTO; fila++) {
    for (let columna = 0; columna < MAPA_ANCHO; columna++) {
      const x = (columna + 0.5) * TAMAÑO_CELDA;
      const z = (fila + 0.5) * TAMAÑO_CELDA;
      if (MAPA[fila][columna] === 1) {
        const pared = new THREE.Mesh(
          new THREE.BoxGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA, TAMAÑO_CELDA),
          materialPared,
        );
        pared.position.set(x, TAMAÑO_CELDA / 2, z);
        escena3D.add(pared);
      } else if (MAPA[fila][columna] === 0 || MAPA[fila][columna] === 2) {
        escena3D.add(crearBaldosaSuelo(fila, columna, x, z));
      }
    }
  }

  crearSuperficieLago();

  cargarTiendaEnEscena();
  cargarKiwifinaEnEscena();
  cargarCañaTiendaEnEscena();
  cargarCañaPesca();
}

let modeloCañaTienda = null;
let grupoCañaTienda = null;
let elevacionHoverCaña = 0;
let posicionBaseCaña = new THREE.Vector3();
let mallaHitboxCaña = null;

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
      const escala = (TAMAÑO_CELDA * 0.82) / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modeloCañaTienda.position.sub(centro);
      modeloCañaTienda.scale.setScalar(escala);

      // Hitbox cilíndrica invisible adherida al nodo de la caña ('Rod') para seguir su rotación y forma real
      const nodoRod = modeloCañaTienda.getObjectByName("Rod") || modeloCañaTienda;
      const geoHitbox = new THREE.CylinderGeometry(0.1, 0.1, 4.8, 8);
      const matHitbox = new THREE.MeshBasicMaterial({ visible: false, wireframe: false });
      mallaHitboxCaña = new THREE.Mesh(geoHitbox, matHitbox);
      mallaHitboxCaña.position.set(0, 0.1, 0);
      mallaHitboxCaña.name = "HitboxCañaTienda";
      nodoRod.add(mallaHitboxCaña);

      // Contenedor colocado dentro de la tienda
      grupoCañaTienda = new THREE.Group();
      grupoCañaTienda.add(modeloCañaTienda);

      // ROTACIÓN: Inclinada apoyada contra la pared interior
      modeloCañaTienda.rotation.set(1.5, -0.25, 0.2);

      // Posición dentro de la casa de pesca
      posicionBaseCaña.set(
        TIENDA.posicion.x - 10,
        38,
        TIENDA.posicion.y - 44,
      );

      grupoCañaTienda.position.copy(posicionBaseCaña);
      escena3D.add(grupoCañaTienda);
    },
    undefined,
    (error) => console.error("No se pudo cargar la caña de bambú en la tienda:", error),
  );
}

function actualizarAnimacionCañaTienda() {
  if (!grupoCañaTienda || !modeloCañaTienda) return;

  const estaMirando = mirandoCañaTienda();
  const objetivoHover = estaMirando ? 1 : 0;
  elevacionHoverCaña = THREE.MathUtils.lerp(elevacionHoverCaña, objetivoHover, 0.16);

  // Se levanta suavemente cuando el cursor está encima y flota ligeramente
  const offsetLevantamiento = elevacionHoverCaña * 7.5 + (estaMirando ? Math.sin(frameCount * 0.12) * 1.5 : 0);
  grupoCañaTienda.position.y = posicionBaseCaña.y + offsetLevantamiento;

  // Ilumina los bordes / materiales con un resplandor verde brillante
  modeloCañaTienda.traverse((objeto) => {
    if (objeto.name && objeto.name.toLowerCase().includes("robe")) {
      objeto.visible = false;
      return;
    }
    if (objeto.isMesh && objeto.material && objeto !== mallaHitboxCaña) {
      if (objeto.material.emissive) {
        objeto.material.emissive.setHex(0x768F49); // Verde luminoso
        objeto.material.emissiveIntensity = elevacionHoverCaña * 0.45;
      }
    }
  });
}

function mirandoCañaTienda() {
  if (!modeloCañaTienda || !camara3D || !TIENDA.posicion) return false;

  const dx = jugador.posicion.x - posicionBaseCaña.x;
  const dz = jugador.posicion.y - posicionBaseCaña.z;
  const distJugador = Math.hypot(dx, dz);
  if (distJugador > TAMAÑO_CELDA * 3.5) return false;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camara3D);

  const intersecciones = raycaster.intersectObject(modeloCañaTienda, true);

  for (let i = 0; i < intersecciones.length; i++) {
    const hit = intersecciones[i];
    if (hit.object && hit.object.name && hit.object.name.toLowerCase().includes("robe")) {
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

function equiparCañaBambu() {
  if (!cañaPesca) return;
  const cargador = new THREE.GLTFLoader();
  cargador.load(
    "models/bamboo_fishing_rod/scene.gltf",
    (resultado) => {
      while (cañaPesca.children.length > 0) {
        cañaPesca.remove(cañaPesca.children[0]);
      }
      const modelo = resultado.scene;
      const caja = new THREE.Box3().setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = 3.5 / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.position.set(6, -0.8, 6);
      modelo.rotation.set(0.4, 0.2, 0.5);
      modelo.traverse((objeto) => {
        if (objeto.name && objeto.name.toLowerCase().includes("robe")) {
          objeto.visible = false;
          return;
        }
        if (!objeto.isMesh || !objeto.material) return;
        objeto.material.side = THREE.DoubleSide;
        objeto.material.depthTest = false;
        objeto.material.needsUpdate = true;
      });
      modelo.renderOrder = 20;
      cañaPesca.add(modelo);
    },
    undefined,
    (error) => console.error("No se pudo equipar la caña de bambú:", error),
  );
}


function cargarKiwifinaEnEscena() {
  if (!TIENDA.posicion) return;

  const escalaRelativa = 0.70; // Mismo tamaño que el jugador (altura ~45 unidades)
  const offsetX = 28;
  const offsetZ = -28;
  const rotacionY = -Math.PI / 2;
  const posYExtra = -5;

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

function cargarCañaPesca() {
  cañaPesca = new THREE.Group();
  cañaPesca.visible = true;
  escena3D.add(cañaPesca);

  // Este grupo vive en el mundo, no en la cámara: así el flotador no gira con la mirada.
  grupoAnzuelo = new THREE.Group();
  escena3D.add(grupoAnzuelo);

  const cargador = new THREE.GLTFLoader();
  cargador.load(
    "models/fishing_rod/scene.gltf",
    (resultado) => {
      const modelo = resultado.scene;
      const caja = new THREE.Box3().setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = 3.5 / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.position.set(6, -0.8, 6);
      modelo.rotation.set(0.4, 0.2, 0.5);
      modelo.traverse((objeto) => {
        if (!objeto.isMesh || !objeto.material) return;
        objeto.material.side = THREE.DoubleSide;
        objeto.material.depthTest = false;
        objeto.material.needsUpdate = true;
      });
      modelo.renderOrder = 20;
      cañaPesca.add(modelo);
    },
    undefined,
    (error) => console.error("No se pudo cargar la caña:", error),
  );

  const puntosLinea = Array.from({ length: 13 }, () => new THREE.Vector3());
  const geometriaLinea = new THREE.BufferGeometry().setFromPoints(puntosLinea);
  lineaPesca = new THREE.Line(
    geometriaLinea,
    new THREE.LineBasicMaterial({
      color: 0xf5f2dd,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  );
  lineaPesca.frustumCulled = false;
  lineaPesca.visible = false;
  grupoAnzuelo.add(lineaPesca);

  anzueloPesca = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI * 1.55),
    new THREE.MeshStandardMaterial({
      color: 0xe7d9b0,
      metalness: 0.58,
      roughness: 0.36,
    }),
  );
  anzueloPesca.rotation.set(0.5, 0, 0);
  anzueloPesca.visible = false;
  grupoAnzuelo.add(anzueloPesca);

  crearFlotadorPesca();
}

function crearFlotadorPesca() {
  flotadorPesca = new THREE.Group();
  flotadorPesca.visible = false;

  const rojo = new THREE.MeshStandardMaterial({
    color: 0xe34b42,
    roughness: 0.78,
    flatShading: true,
  });
  const marfil = new THREE.MeshStandardMaterial({
    color: 0xf3e8c8,
    roughness: 0.84,
    flatShading: true,
  });
  const dorado = new THREE.MeshStandardMaterial({
    color: 0xd9a94e,
    metalness: 0.35,
    roughness: 0.55,
    flatShading: true,
  });

  const radioCuerpo = 0.92;
  const arriba = new THREE.Mesh(
    new THREE.SphereGeometry(radioCuerpo, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    rojo,
  );
  arriba.scale.set(1, 0.76, 1);
  arriba.castShadow = true;
  flotadorPesca.add(arriba);

  const abajo = new THREE.Mesh(
    new THREE.SphereGeometry(radioCuerpo, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    marfil,
  );
  abajo.scale.set(1, 0.76, 1);
  flotadorPesca.add(abajo);

  const banda = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.075, 4, 10),
    dorado,
  );
  banda.rotation.x = Math.PI / 2;
  flotadorPesca.add(banda);

  const antena = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.11, 0.64, 6),
    rojo,
  );
  antena.position.y = 1.16;
  flotadorPesca.add(antena);

  const puntaAntena = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 6, 4),
    dorado,
  );
  puntaAntena.position.y = 1.5;
  flotadorPesca.add(puntaAntena);

  ondasFlotador = [];
  for (let indice = 0; indice < 2; indice++) {
    const onda = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.86, 12),
      new THREE.MeshBasicMaterial({
        color: 0xbdefff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    onda.rotation.x = -Math.PI / 2;
    onda.position.y = 0.035 + indice * 0.006;
    flotadorPesca.add(onda);
    ondasFlotador.push(onda);
  }

  escena3D.add(flotadorPesca);
}

function actualizarFlotadorPesca(dt) {
  if (!flotadorPesca) return;
  faseSalpicadura = Math.max(0, faseSalpicadura - dt * 1.7);

  if (!anzueloLanzado || estadoLanzamiento === "lanzando") {
    flotadorPesca.visible = false;
    return;
  }

  flotadorPesca.visible = true;
  const fase = frameCount * 0.085;
  let tiron = 0;
  if (sistemaCaptura.estado === "tiron_suave") {
    tiron = -0.18 * Math.abs(Math.sin(fase * 2));
  } else if (sistemaCaptura.estado === "doble_tiron") {
    tiron = -0.36 * Math.abs(Math.sin(fase * 3));
  } else if (sistemaCaptura.estado === "tiron_fuerte") {
    tiron = -0.62 - 0.12 * Math.abs(Math.sin(fase * 4));
  }

  if (estadoLanzamiento === "retrayendo") {
    flotadorPesca.position.copy(posicionAnzueloMundo);
  } else {
    flotadorPesca.position.set(
      destinoPescaMundo.x,
      0.08 + Math.sin(fase) * 0.075 + tiron,
      destinoPescaMundo.z,
    );
    flotadorPesca.rotation.z = Math.sin(fase * 0.6) * 0.035;
  }

  ondasFlotador.forEach((onda, indice) => {
    const ciclo = (frameCount * 0.018 + indice * 0.48) % 1;
    const escala = 0.55 + ciclo * 1.15 + faseSalpicadura * 0.9;
    onda.scale.setScalar(escala);
    onda.material.opacity = Math.min(0.34, (1 - ciclo) * 0.15 + faseSalpicadura * 0.32);
  });
}

function actualizarCañaPesca() {
  if (!cañaPesca || !lineaPesca || !anzueloPesca) return;

  camara3D.updateMatrixWorld(true);
  const desplazamiento = new THREE.Vector3(3.0, -3.0, -1.4);
  desplazamiento.applyQuaternion(camara3D.quaternion);
  cañaPesca.position.copy(camara3D.position).add(desplazamiento);
  cañaPesca.quaternion.copy(camara3D.quaternion);

  const animacionLanzamiento =
    estadoLanzamiento === "lanzando"
      ? Math.sin(progresoLanzamiento * Math.PI)
      : estadoLanzamiento === "retrayendo"
        ? Math.sin(progresoLanzamiento * Math.PI) * 0.45
        : 0;
  const animacionTiron = sistemaCaptura.estado === "tiron_fuerte"
    ? Math.sin(frameCount * 0.65) * 0.12
    : 0;
  cañaPesca.rotateX(0.12 + animacionLanzamiento * 0.42 + animacionTiron);
  cañaPesca.rotateZ(-0.18 - animacionLanzamiento * 0.12);

  const visible = anzueloLanzado;
  lineaPesca.visible = visible;
  anzueloPesca.visible = visible;
  if (!visible) return;

  const inicio = calcularPuntaCañaMundo();
  const final = new THREE.Vector3();
  if (estadoLanzamiento === "lanzando" || estadoLanzamiento === "retrayendo") {
    final.copy(posicionAnzueloMundo);
  } else {
    final.set(destinoPescaMundo.x, flotadorPesca.position.y + 0.12, destinoPescaMundo.z);
  }

  const posiciones = lineaPesca.geometry.attributes.position.array;
  const cantidadPuntos = posiciones.length / 3;
  const distancia = inicio.distanceTo(final);
  for (let indice = 0; indice < cantidadPuntos; indice++) {
    const tramo = indice / (cantidadPuntos - 1);
    const punto = inicio.clone().lerp(final, tramo);
    const sag = Math.sin(tramo * Math.PI) * Math.min(3.2, distancia * 0.008);
    punto.y -= sag;
    posiciones[indice * 3] = punto.x;
    posiciones[indice * 3 + 1] = punto.y;
    posiciones[indice * 3 + 2] = punto.z;
  }
  lineaPesca.geometry.attributes.position.needsUpdate = true;
  lineaPesca.geometry.computeBoundingSphere();

  if (estadoLanzamiento === "lanzando" || estadoLanzamiento === "retrayendo") {
    anzueloPesca.position.copy(posicionAnzueloMundo);
  } else {
    anzueloPesca.position.set(destinoPescaMundo.x, -0.42, destinoPescaMundo.z);
  }
  anzueloPesca.rotation.z = Math.sin(frameCount * 0.08) * 0.18;
}

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
    roughness: 0.2,
    metalness: 0.05,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  fetch("textures/mundo/Agua.gif")
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const rawFrames64 = decodificarFramesAgua(buf);
      texturasAguaAnimacion = rawFrames64.map((frame64) => {
        const lienzoLago = componerLienzoLagoParaFrame(
          frame64,
          minColumna,
          maxColumna,
          minFila,
          maxFila,
        );
        const tex = new THREE.CanvasTexture(lienzoLago);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.repeat.set(1, 1);
        return tex;
      });
      if (texturasAguaAnimacion.length > 0) {
        texturaAgua = texturasAguaAnimacion[0];
        materialLago.map = texturaAgua;
        materialLago.needsUpdate = true;
      }
    })
    .catch((err) => {
      console.warn("Fallback carga textura agua:", err);
      const cargador = new THREE.TextureLoader();
      texturaAgua = cargador.load("textures/mundo/Agua.gif");
      texturaAgua.wrapS = THREE.RepeatWrapping;
      texturaAgua.wrapT = THREE.RepeatWrapping;
      texturaAgua.magFilter = THREE.NearestFilter;
      texturaAgua.minFilter = THREE.NearestFilter;
      texturaAgua.repeat.set(ancho / 16, profundidad / 16);
      materialLago.map = texturaAgua;
      materialLago.needsUpdate = true;
    });

  const lago = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, profundidad),
    materialLago,
  );

  lago.rotation.x = -Math.PI / 2;
  lago.position.set(
    ((minColumna + maxColumna + 1) / 2) * TAMAÑO_CELDA,
    0.06,
    ((minFila + maxFila + 1) / 2) * TAMAÑO_CELDA,
  );
  escena3D.add(lago);
}

// Compone el mapa completo del lago (esquinas, bordes y centro de agua) para un frame del GIF
function componerLienzoLagoParaFrame(frame64Canvas, minCol, maxCol, minF, maxF) {
  const cols = maxCol - minCol + 1;
  const filas = maxF - minF + 1;
  const canvas = document.createElement("canvas");
  canvas.width = cols * 16;
  canvas.height = filas * 16;
  const ctx = canvas.getContext("2d");

  for (let fIdx = 0; fIdx < filas; fIdx++) {
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const f = minF + fIdx;
      const c = minCol + cIdx;
      if (MAPA[f] && MAPA[f][c] !== 3) continue;

      const n = (f === minF || (MAPA[f - 1] && MAPA[f - 1][c] !== 3));
      const s = (f === maxF || (MAPA[f + 1] && MAPA[f + 1][c] !== 3));
      const o = (c === minCol || (MAPA[f] && MAPA[f][c - 1] !== 3));
      const e = (c === maxCol || (MAPA[f] && MAPA[f][c + 1] !== 3));

      const destX = cIdx * 16;
      const destY = fIdx * 16;

      function drawSubTile(sx, sy, rot = 0, flipX = false, flipY = false) {
        ctx.save();
        ctx.translate(destX + 8, destY + 8);
        if (flipX) ctx.scale(-1, 1);
        if (flipY) ctx.scale(1, -1);
        if (rot !== 0) ctx.rotate(rot);
        ctx.drawImage(frame64Canvas, sx, sy, 16, 16, -8, -8, 16, 16);
        ctx.restore();
      }

      // Esquinas con transición de arena y espuma de Agua.gif (Tile 0, x: 0, y: 0)
      if (n && o) {
        drawSubTile(0, 0, 0); // Esquina Noroeste
      } else if (n && e) {
        drawSubTile(0, 0, 0, true, false); // Esquina Noreste
      } else if (s && o) {
        drawSubTile(0, 0, 0, false, true); // Esquina Suroeste
      } else if (s && e) {
        drawSubTile(0, 0, Math.PI); // Esquina Sureste
      }
      // Bordes rectos con orilla de arena y espuma (Tile 1, x: 16, y: 0)
      else if (n) {
        drawSubTile(16, 0, 0); // Borde Norte (arena arriba)
      } else if (s) {
        drawSubTile(16, 0, Math.PI); // Borde Sur (arena abajo)
      } else if (o) {
        drawSubTile(16, 0, -Math.PI / 2); // Borde Oeste (arena izquierda)
      } else if (e) {
        drawSubTile(16, 0, Math.PI / 2); // Borde Este (arena derecha)
      }
      // Centro de agua pura animada (Tile 3, x: 48, y: 0)
      else {
        drawSubTile(48, 0, 0);
      }
    }
  }
  return canvas;
}

// Decodifica los frames completos (64x16) del GIF original conservando sus 4 cuadrantes
function decodificarFramesAgua(buffer) {
  const bytes = new Uint8Array(buffer);
  const gctFlag = bytes[10] & 0x80;
  const gctSize = gctFlag ? 3 * (1 << ((bytes[10] & 0x07) + 1)) : 0;
  const paletaGlobal = [];
  for (let i = 13; i < 13 + gctSize; i += 3) {
    paletaGlobal.push([bytes[i], bytes[i + 1], bytes[i + 2]]);
  }

  function decodeLZW(minCodeSize, data, numPixels) {
    let clearCode = 1 << minCodeSize;
    let eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let codeMask = (1 << codeSize) - 1;
    let dict = [];
    function resetDict() {
      dict = [];
      for (let i = 0; i < clearCode; i++) dict[i] = [i];
      dict[clearCode] = [];
      dict[eoiCode] = null;
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
    }
    resetDict();
    let out = [];
    let bitBuf = 0, bitCount = 0;
    let dataPos = 0;
    let prev = null;
    while (out.length < numPixels && dataPos < data.length) {
      while (bitCount < codeSize && dataPos < data.length) {
        bitBuf |= (data[dataPos++] << bitCount);
        bitCount += 8;
      }
      let code = bitBuf & codeMask;
      bitBuf >>= codeSize;
      bitCount -= codeSize;
      if (code === clearCode) { resetDict(); prev = null; continue; }
      if (code === eoiCode) break;
      let entry = (code < dict.length) ? dict[code] : (code === dict.length && prev ? prev.concat(prev[0]) : null);
      if (!entry) break;
      for (let i = 0; i < entry.length; i++) out.push(entry[i]);
      if (prev && dict.length < 4096) {
        dict.push(prev.concat(entry[0]));
        if (dict.length > codeMask && codeSize < 12) {
          codeSize++;
          codeMask = (1 << codeSize) - 1;
        }
      }
      prev = entry;
    }
    return out;
  }

  let pos = 13 + gctSize;
  const canvases = [];
  while (pos < bytes.length) {
    if (bytes[pos] === 0x3B) break;
    if (bytes[pos] === 0x21) {
      pos += 2;
      while (pos < bytes.length && bytes[pos] !== 0) pos += 1 + bytes[pos];
      pos++;
    } else if (bytes[pos] === 0x2C) {
      const w = bytes[pos + 5] | (bytes[pos + 6] << 8);
      const h = bytes[pos + 7] | (bytes[pos + 8] << 8);
      const packed = bytes[pos + 9];
      const hasLct = packed & 0x80;
      const lctSize = hasLct ? 3 * (1 << ((packed & 0x07) + 1)) : 0;
      let paleta = paletaGlobal;
      if (hasLct) {
        paleta = [];
        for (let i = pos + 10; i < pos + 10 + lctSize; i += 3) {
          paleta.push([bytes[i], bytes[i + 1], bytes[i + 2]]);
        }
      }
      pos += 10 + lctSize;
      const minCodeSize = bytes[pos++];
      const blocks = [];
      while (pos < bytes.length && bytes[pos] !== 0) {
        const len = bytes[pos++];
        blocks.push(bytes.subarray(pos, pos + len));
        pos += len;
      }
      pos++;
      let totalLen = blocks.reduce((acc, b) => acc + b.length, 0);
      let comp = new Uint8Array(totalLen);
      let offset = 0;
      for (let b of blocks) { comp.set(b, offset); offset += b.length; }
      const indices = decodeLZW(minCodeSize, comp, w * h);

      // Decodificar el frame completo de 64x16 con sus 4 tiles
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      const imgData = ctx.createImageData(64, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 64; x++) {
          const idx = indices[y * w + x];
          const rgb = paleta[idx] || [56, 168, 244];
          const outIdx = (y * 64 + x) * 4;
          imgData.data[outIdx] = rgb[0];
          imgData.data[outIdx + 1] = rgb[1];
          imgData.data[outIdx + 2] = rgb[2];
          imgData.data[outIdx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      canvases.push(canvas);
    } else {
      pos++;
    }
  }
  return canvases;
}

let texturasAguaAnimacion = [];
let materialLago = null;
let indiceFrameAgua = 0;
let acumuladorTiempoAgua = 0;

// Reproduce la animación real del GIF cuadro por cuadro
function actualizarAgua() {
  if (!texturasAguaAnimacion || texturasAguaAnimacion.length <= 1) return;
  acumuladorTiempoAgua += deltaTime;
  if (acumuladorTiempoAgua >= 160) {
    acumuladorTiempoAgua = 0;
    indiceFrameAgua = (indiceFrameAgua + 1) % texturasAguaAnimacion.length;
    materialLago.map = texturasAguaAnimacion[indiceFrameAgua];
    materialLago.needsUpdate = true;
  }
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
        if (objeto.isMesh && objeto.visible && !(objeto.name && objeto.name.toLowerCase().includes("water"))) {
          caja.expandByObject(objeto);
        }
      });
      if (caja.isEmpty()) {
        caja.setFromObject(modelo);
      }

      const centro = caja.getCenter(new THREE.Vector3());

      // Escala proporcionada y adecuada para entrar a la casa
      const escala = 19.0;

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.rotation.y = -Math.PI / 2;

      // Nivelar para que el piso de madera quede exactamente al nivel del suelo caminable
      const alturaPiso = (centro.y - caja.min.y) * escala - 226.5;
      modelo.position.set(TIENDA.posicion.x, alturaPiso, TIENDA.posicion.y);
      escena3D.add(modelo);
      TIENDA.objetoMundo = modelo;
    },
    undefined,
    (error) => console.error("No se pudo cargar la casa de pesca 3D:", error),
  );
}

const materialesSueloCache = new Map();
let imagenSueloOriginal = null;
let texturaSueloCargada = false;

function clasificarTerreno(f, c) {
  if (f < 0 || c < 0 || f >= MAPA_ALTO || c >= MAPA_ANCHO) return "pared";
  if (MAPA[f][c] === 1) return "pared";
  if (MAPA[f][c] === 3) return "agua";
  if (MAPA[f][c] === 2) return "arena";
  if (obtenerSuelo(f, c) === 5) return "tierra";
  return "pasto";
}

function obtenerClaveBaldosa(f, c) {
  const tipo = clasificarTerreno(f, c);

  if (tipo === "pasto") {
    const N = (clasificarTerreno(f - 1, c) === "tierra" || clasificarTerreno(f - 1, c) === "arena");
    const S = (clasificarTerreno(f + 1, c) === "tierra" || clasificarTerreno(f + 1, c) === "arena");
    const O = (clasificarTerreno(f, c - 1) === "tierra" || clasificarTerreno(f, c - 1) === "arena");
    const E = (clasificarTerreno(f, c + 1) === "tierra" || clasificarTerreno(f, c + 1) === "arena");

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
    const NE = (clasificarTerreno(f - 1, c + 1) === "tierra" || clasificarTerreno(f - 1, c + 1) === "arena");
    const NO = (clasificarTerreno(f - 1, c - 1) === "tierra" || clasificarTerreno(f - 1, c - 1) === "arena");
    const SE = (clasificarTerreno(f + 1, c + 1) === "tierra" || clasificarTerreno(f + 1, c + 1) === "arena");
    const SO = (clasificarTerreno(f + 1, c - 1) === "tierra" || clasificarTerreno(f + 1, c - 1) === "arena");

    if (SE) return "pasto_esq_ext_SE"; // Tierra en la esquina Sureste
    if (SO) return "pasto_esq_ext_SO"; // Tierra en la esquina Suroeste
    if (NE) return "pasto_esq_ext_NE"; // Tierra en la esquina Noreste
    if (NO) return "pasto_esq_ext_NO"; // Tierra en la esquina Noroeste

    return "pasto_puro";
  }

  if (tipo === "arena") {
    const N = (clasificarTerreno(f - 1, c) === "tierra" || clasificarTerreno(f - 1, c) === "pasto");
    const S = (clasificarTerreno(f + 1, c) === "tierra" || clasificarTerreno(f + 1, c) === "pasto");
    const O = (clasificarTerreno(f, c - 1) === "tierra" || clasificarTerreno(f, c - 1) === "pasto");
    const E = (clasificarTerreno(f, c + 1) === "tierra" || clasificarTerreno(f, c + 1) === "pasto");

    if (S && E) return "arena_esq_int_NO";
    if (S && O) return "arena_esq_int_NE";
    if (N && E) return "arena_esq_int_SO";
    if (N && O) return "arena_esq_int_SE";

    if (S) return "arena_borde_S";
    if (N) return "arena_borde_N";
    if (E) return "arena_borde_E";
    if (O) return "arena_borde_O";

    const NE = (clasificarTerreno(f - 1, c + 1) === "tierra" || clasificarTerreno(f - 1, c + 1) === "pasto");
    const NO = (clasificarTerreno(f - 1, c - 1) === "tierra" || clasificarTerreno(f - 1, c - 1) === "pasto");
    const SE = (clasificarTerreno(f + 1, c + 1) === "tierra" || clasificarTerreno(f + 1, c + 1) === "pasto");
    const SO = (clasificarTerreno(f + 1, c - 1) === "tierra" || clasificarTerreno(f + 1, c - 1) === "pasto");

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
      renderizarTileEnCanvas(item.canvas.getContext("2d"), imagenSueloOriginal, clave);
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
  tex.minFilter = THREE.NearestFilter;

  const mat = new THREE.MeshLambertMaterial({ map: tex });
  materialesSueloCache.set(clave, { material: mat, texture: tex, canvas: canvas });

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

function actualizarCamara3D() {
  const descensoAgachado = (jugador.factorAgachado || 0) * (TAMAÑO_CELDA * 0.35);
  camara3D.position.set(
    jugador.posicion.x,
    TAMAÑO_CELDA * 0.7 + jugador.alturaSalto - descensoAgachado,
    jugador.posicion.y,
  );
  camara3D.rotation.set(jugador.inclinacion, -jugador.angulo - Math.PI / 2, 0);


}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  camara3D.aspect = windowWidth / windowHeight;
  camara3D.updateProjectionMatrix();
  renderizador3D.setSize(windowWidth, windowHeight);
}