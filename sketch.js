const ANCHO_JUEGO = 480;
const ALTO_JUEGO  = 270;

let jugador;
let sistemaCaptura;

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

function preload() {
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

    jugador = new Jugador(
        TAMAÑO_CELDA * 7.5,
        TAMAÑO_CELDA * 5.5
    );

    sistemaCaptura = new SistemaCaptura();
    tiendaInicializar();
  inicializarEscena3D();
}

function draw() {
  clear();

    if (sistemaCaptura.estado === 'inactivo') {
        jugador.actualizar();
    }

    actualizarCamara3D();
    actualizarLanzamientoAnzuelo();
    actualizarCañaPesca();
    renderizador3D.render(escena3D, camara3D);

    sistemaCaptura.actualizar();
    sistemaCaptura.dibujar();

    if (sistemaCaptura.estado === 'inactivo' && cercaDelAgua()) {
        dibujarIndicadorPesca();
    }

    if (ratonBloqueado) dibujarPuntero();
}

function mouseMoved(evento) {
  moverCamaraConMouse(evento);
}

function moverCamaraConMouse(evento) {
  if (!ratonBloqueado || sistemaCaptura.estado !== 'inactivo') return;

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
    const cx = Math.floor(jugador.posicion.x / TAMAÑO_CELDA);
    const cy = Math.floor(jugador.posicion.y / TAMAÑO_CELDA);
  return (
    cx >= 0 &&
    cy >= 0 &&
    cx < MAPA_ANCHO &&
    cy < MAPA_ALTO &&
    MAPA[cy][cx] === 3
  );
}

function dibujarIndicadorPesca() {
    const pulso = (sin(frameCount * 0.08) + 1) / 2;

    fill(0, 0, 0, 135);
    noStroke();
    rect(width / 2 - 115, height * 0.85 - 20, 230, 36, 8);

    fill(255, 240, 100, 185 + pulso * 70);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('[F]  Pescar', width / 2, height * 0.85 - 2);
    textAlign(LEFT, BASELINE);

}

function keyPressed() {
    if (keyCode === ESCAPE) {
      cancelarPesca();
      return false;
    }
    if ((key === 'f' || key === 'F') && sistemaCaptura.estado === 'inactivo' && cercaDelAgua()) {
    if (estadoLanzamiento === "reposo") {
      sistemaCaptura.iniciar(random(PECES_CAPTURA));
    }
    return false;
    }
    if (keyCode === 32) {
      if (sistemaCaptura.estado === 'inactivo') {
        jugador.saltar();
      } else {
        sistemaCaptura.presionarBoton();
      }
        return false;
    }
}

function keyReleased() {
    if (keyCode === 32) {
        sistemaCaptura.soltarBoton();
        return false;
    }
}

function mousePressed() {
    if (sistemaCaptura.estado !== 'inactivo') {
        sistemaCaptura.presionarBoton();
    }
}

function mouseReleased() {
    if (sistemaCaptura.estado !== 'inactivo') {
        sistemaCaptura.soltarBoton();
    }
}

function controlarClicEscena() {
  if (sistemaCaptura.estado !== 'inactivo') {
    sistemaCaptura.presionarBoton();
    return;
  }

  if (estadoLanzamiento === "reposo") iniciarLanzamientoAnzuelo();
  else if (estadoLanzamiento === "en_agua" || estadoLanzamiento === "esperando") retraerAnzuelo();
  renderizador3D.domElement.requestPointerLock();
}

function cancelarPesca() {
  if (
    sistemaCaptura.estado === "inactivo" &&
    estadoLanzamiento === "reposo"
  ) return;

  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

function iniciarLanzamientoAnzuelo() {
  lanzamientoCaeEnAgua = calcularImpactoEnAgua();
  anzueloLanzado = true;
  estadoLanzamiento = "lanzando";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
}

function calcularImpactoEnAgua() {
  const direccion = new THREE.Vector3();
  camara3D.getWorldDirection(direccion);
  if (direccion.y >= -0.05) return false;

  const distancia = -camara3D.position.y / direccion.y;
  if (distancia <= 0 || distancia > TAMAÑO_CELDA * 20) return false;

  const impacto = camara3D.position.clone().add(direccion.multiplyScalar(distancia));
  const columna = Math.floor(impacto.x / TAMAÑO_CELDA);
  const fila = Math.floor(impacto.z / TAMAÑO_CELDA);
  return (
    fila >= 0 &&
    columna >= 0 &&
    fila < MAPA_ALTO &&
    columna < MAPA_ANCHO &&
    MAPA[fila][columna] === 3
  );
}

function retraerAnzuelo() {
  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

function actualizarLanzamientoAnzuelo() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  if (estadoLanzamiento === "lanzando") {
    progresoLanzamiento = Math.min(1, progresoLanzamiento + dt * 1.35);
    if (progresoLanzamiento >= 1) {
      if (lanzamientoCaeEnAgua) {
        estadoLanzamiento = "en_agua";
        esperaMordida = random(2, 6);
      } else {
        estadoLanzamiento = "retrayendo";
      }
    }
  } else if (estadoLanzamiento === "retrayendo") {
    progresoLanzamiento = Math.max(0, progresoLanzamiento - dt * 2.4);
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
    66,
    windowWidth / windowHeight,
    0.01,
    TAMAÑO_CELDA * 40,
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
  renderizador3D.domElement.addEventListener("pointerdown", controlarClicEscena);
  renderizador3D.domElement.addEventListener("mouseup", () => {
    if (sistemaCaptura.estado !== "inactivo") sistemaCaptura.soltarBoton();
  });
  document.addEventListener("pointerlockchange", actualizarEstadoRaton);
  document.addEventListener("mousemove", moverCamaraConMouse);

  escena3D.add(new THREE.HemisphereLight(0xbfe9ff, 0x42633c, 1.8));
  const sol = new THREE.DirectionalLight(0xfff0c7, 2.4);
  sol.position.set(-300, 500, 200);
  escena3D.add(sol);

  const cargador = new THREE.TextureLoader();
  const cielo = cargador.load("textures/cielo.png");
  cielo.magFilter = THREE.NearestFilter;
  cielo.minFilter = THREE.NearestFilter;
  escena3D.background = cielo;

  const texturaPared3D = cargador.load("textures/pared.png");
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
      } else if (MAPA[fila][columna] !== 2 && MAPA[fila][columna] !== 3) {
        escena3D.add(crearBaldosaSuelo(cargador, MAPA[fila][columna], x, z));
      }
    }
  }

  crearBordeLago();
  crearSuperficieLago();

  cargarTiendaEnEscena();
  cargarCañaPesca();
}

function cargarCañaPesca() {
  cañaPesca = new THREE.Group();
  cañaPesca.position.set(0, 0, 0);
  cañaPesca.rotation.set(0, 0, 0);
  cañaPesca.visible = true;
  escena3D.add(cañaPesca);
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

  const geometriaLinea = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 9 }, () => puntaCaña.clone()),
  );
  lineaPesca = new THREE.Line(
    geometriaLinea,
    new THREE.LineBasicMaterial({ color: 0xf5f2dd, transparent: true, opacity: 0.9 }),
  );
  lineaPesca.visible = false;
  grupoAnzuelo.add(lineaPesca);

  anzueloPesca = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.009, 6, 12, Math.PI * 1.55),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.8, roughness: 0.25 }),
  );
  anzueloPesca.rotation.set(0.5, 0, 0);
  anzueloPesca.visible = false;
  grupoAnzuelo.add(anzueloPesca);

}

function actualizarCañaPesca() {
  if (!cañaPesca || !lineaPesca || !anzueloPesca) return;

  camara3D.updateMatrixWorld(true);
  const desplazamiento = new THREE.Vector3(3.0, -3.0, -1.4);
  desplazamiento.applyQuaternion(camara3D.quaternion);
  cañaPesca.position.copy(camara3D.position).add(desplazamiento);
  cañaPesca.quaternion.copy(camara3D.quaternion);
  cañaPesca.rotateZ(-0.18);
  grupoAnzuelo.position.copy(camara3D.position);
  grupoAnzuelo.quaternion.copy(camara3D.quaternion);

  const pescando = sistemaCaptura.estado !== "inactivo";
  cañaPesca.visible = true;
  lineaPesca.visible = anzueloLanzado;
  anzueloPesca.visible = anzueloLanzado;

  const progreso = estadoLanzamiento === "lanzando"
    ? progresoLanzamiento
    : anzueloLanzado
      ? 1
      : 0;
  const tiron = sistemaCaptura.estado === "tiron_fuerte" ? 0.08 : 0;
  const destino = new THREE.Vector3(0.28, -0.72 - tiron, -3.2);
  const posicionAnzuelo = puntaCaña.clone().lerp(destino, progreso);
  const posiciones = lineaPesca.geometry.attributes.position.array;
  for (let indice = 0; indice < 9; indice++) {
    const tramo = indice / 8;
    const punto = puntaCaña.clone().lerp(posicionAnzuelo, tramo);
    const sag = Math.sin(tramo * Math.PI) * 0.16 * progreso;
    punto.y -= sag;
    posiciones[indice * 3] = punto.x;
    posiciones[indice * 3 + 1] = punto.y;
    posiciones[indice * 3 + 2] = punto.z;
  }
  lineaPesca.geometry.attributes.position.needsUpdate = true;
  anzueloPesca.position.copy(posicionAnzuelo);
  if (estadoLanzamiento === "en_agua" || estadoLanzamiento === "esperando") {
    anzueloPesca.position.y += Math.sin(frameCount * 0.08) * 0.025;
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

  const textura = crearTexturaLago();
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(maxColumna - minColumna + 1, maxFila - minFila + 1);
  textura.magFilter = THREE.LinearFilter;
  textura.minFilter = THREE.LinearMipMapLinearFilter;

  const ancho = (maxColumna - minColumna + 1) * TAMAÑO_CELDA;
  const profundidad = (maxFila - minFila + 1) * TAMAÑO_CELDA;
  const lago = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, profundidad),
    new THREE.MeshStandardMaterial({
      map: textura,
      color: 0x68c9d8,
      emissive: 0x123d55,
      emissiveIntensity: 0.22,
      roughness: 0.18,
      metalness: 0.08,
      side: THREE.DoubleSide,
    }),
  );

  lago.rotation.x = -Math.PI / 2;
  lago.position.set(
    ((minColumna + maxColumna + 1) / 2) * TAMAÑO_CELDA,
    0.04,
    ((minFila + maxFila + 1) / 2) * TAMAÑO_CELDA,
  );
  escena3D.add(lago);
}

function crearBordeLago() {
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

  const ancho = (maxColumna - minColumna + 3) * TAMAÑO_CELDA;
  const profundidad = (maxFila - minFila + 3) * TAMAÑO_CELDA;
  const borde = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, profundidad),
    new THREE.MeshStandardMaterial({
      map: crearTexturaOrilla(),
      color: 0xc8996c,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );

  borde.rotation.x = -Math.PI / 2;
  borde.position.set(
    ((minColumna + maxColumna + 1) / 2) * TAMAÑO_CELDA,
    0.012,
    ((minFila + maxFila + 1) / 2) * TAMAÑO_CELDA,
  );
  escena3D.add(borde);
}

function crearTexturaOrilla() {
  const lienzo = document.createElement("canvas");
  lienzo.width = 128;
  lienzo.height = 128;
  const contexto = lienzo.getContext("2d");

  contexto.fillStyle = "#c8996c";
  contexto.fillRect(0, 0, 128, 128);
  contexto.fillStyle = "rgba(255, 225, 185, 0.18)";

  for (let y = 12; y < 128; y += 25) {
    for (let x = 10; x < 128; x += 28) {
      contexto.fillRect(x + ((y / 25) % 2) * 8, y, 14, 4);
    }
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(3, 3);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function crearTexturaLago() {
  const lienzo = document.createElement("canvas");
  lienzo.width = 128;
  lienzo.height = 128;
  const contexto = lienzo.getContext("2d");

  contexto.fillStyle = "#58bfd2";
  contexto.fillRect(0, 0, 128, 128);
  contexto.lineWidth = 3;
  contexto.lineCap = "round";

  for (let fila = 8; fila < 128; fila += 18) {
    contexto.strokeStyle = fila % 36 === 8 ? "rgba(220, 250, 250, 0.5)" : "rgba(25, 135, 165, 0.32)";
    contexto.beginPath();
    for (let x = -8; x <= 136; x += 8) {
      const y = fila + Math.sin(x * 0.08) * 2;
      if (x === -8) contexto.moveTo(x, y);
      else contexto.lineTo(x, y);
    }
    contexto.stroke();
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function cargarTiendaEnEscena() {
  const cargadorOBJ = new THREE.OBJLoader();
  cargadorOBJ.load(
    "models/tienda/source/Tienda_02.obj",
    (modelo) => {
      const textura = new THREE.TextureLoader().load(
        "models/tienda/textures/Tienda_02_initialShadingGroup_BaseColor.10.png",
      );
      textura.colorSpace = THREE.SRGBColorSpace;

      modelo.traverse((objeto) => {
        if (!objeto.isMesh) return;
        objeto.material = new THREE.MeshStandardMaterial({
          map: textura,
          roughness: 0.82,
          metalness: 0,
          side: THREE.DoubleSide,
        });
      });

      const caja = new THREE.Box3().setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = (TAMAÑO_CELDA * 1.8) / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.rotation.y = Math.PI;
      modelo.position.set(TIENDA.posicion.x, 0, TIENDA.posicion.y);
      escena3D.add(modelo);
      TIENDA.objetoMundo = modelo;
    },
    undefined,
    (error) => console.error("No se pudo cargar la tienda 3D:", error),
  );
}

function crearBaldosaSuelo(cargador, tipo, x, z) {
  const textura = cargador.load("assets/sprites/pisos/FloorTiles.png");
  const columna = obtenerColumnaSprite(tipo);
  textura.wrapS = THREE.ClampToEdgeWrapping;
  textura.wrapT = THREE.ClampToEdgeWrapping;
  textura.magFilter = THREE.NearestFilter;
  textura.minFilter = THREE.NearestFilter;
  textura.repeat.set(1 / 16, 1);
  textura.offset.set(columna / 16, 0);
  const material = tipo === 3
    ? new THREE.MeshStandardMaterial({
        map: textura,
        color: 0x4faed0,
        emissive: 0x123d55,
        emissiveIntensity: 0.35,
        roughness: 0.22,
        metalness: 0.08,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide });
  const baldosa = new THREE.Mesh(
    new THREE.PlaneGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA),
    material,
  );
  baldosa.rotation.x = -Math.PI / 2;
  baldosa.position.set(x, tipo === 3 ? 0.04 : 0, z);
  return baldosa;
}

function actualizarCamara3D() {
  camara3D.position.set(
    jugador.posicion.x,
    TAMAÑO_CELDA * 0.56 + jugador.alturaSalto,
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
