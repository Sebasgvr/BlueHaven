const ANCHO_JUEGO = 480;
const ALTO_JUEGO = 270;

let jugador;

let texturaPared;
let texturaCielo;
let texturaPisos;

let pantallaJuego;

let datosPisos;
let anchoPisos;
let bufferPiso;

let modeloTienda;
let texturaTienda;
let bufferModelos;
let zBuffer;

let escena3D;
let camara3D;
let renderizador3D;
let cargandoTexturas3D;

function preload() {
  texturaPared = loadImage("textures/pared.png");
  texturaCielo = loadImage("textures/cielo.png");
  texturaPisos = loadImage("assets/sprites/pisos/FloorTiles.png");

  // Poné el .obj y el .mtl/textura en una carpeta "modelos/" de tu proyecto
  modeloTienda = loadModel("models/tienda/store.obj", true);
  texturaTienda = loadImage(
    "models/tienda/textures/Tienda_02_initialShadingGroup_BaseColor.10.png",
  );
}

function setup() {
  const canvasJuego = createCanvas(windowWidth, windowHeight);
  canvasJuego.elt.style.display = "none";
  pixelDensity(1);
  noSmooth();

  pantallaJuego = createGraphics(ANCHO_JUEGO, ALTO_JUEGO);
  pantallaJuego.noSmooth();

  const offCanvas = document.createElement("canvas");
  offCanvas.width = texturaPisos.width;
  offCanvas.height = texturaPisos.height;
  const offCtx = offCanvas.getContext("2d");
  offCtx.drawImage(texturaPisos.canvas, 0, 0);
  datosPisos = offCtx.getImageData(
    0,
    0,
    offCanvas.width,
    offCanvas.height,
  ).data;
  anchoPisos = offCanvas.width;

  bufferPiso = pantallaJuego.drawingContext.createImageData(
    ANCHO_JUEGO,
    ALTO_JUEGO / 2,
  );

  // ...(tu código existente de pisos)...

  zBuffer = new Array(ANCHO_JUEGO).fill(Infinity);

  bufferModelos = createGraphics(ANCHO_JUEGO, ALTO_JUEGO, WEBGL);
  bufferModelos.noStroke();

  texturaPared.loadPixels();
  jugador = new Jugador(TAMAÑO_CELDA * 7.5, TAMAÑO_CELDA * 5.5);

  texturaPared.loadPixels();

  jugador = new Jugador(TAMAÑO_CELDA * 7.5, TAMAÑO_CELDA * 5.5);
  tiendaInicializar();
  remInicializar();

  inicializarEscena3D();
}

function draw() {
  jugador.actualizar();
  actualizarCamara3D();
  renderizador3D.render(escena3D, camara3D);
}
function dibujarObjetos3D() {
  bufferModelos.clear();
  bufferModelos.push();

  // FOV vertical equivalente al horizontal que ya usás
  const aspecto = ANCHO_JUEGO / ALTO_JUEGO;
  const fovV = 2 * Math.atan(Math.tan(jugador.fov / 2) / aspecto);
  bufferModelos.perspective(fovV, aspecto, 5, 5000);

  // Cámara alineada con el jugador (X mundo -> X, Y mundo -> Z, altura -> Y)
  const dirX = cos(jugador.angulo);
  const dirY = sin(jugador.angulo);
  bufferModelos.camera(0, 0, 0, dirX, 0, dirY, 0, 1, 0);

  for (const obj of OBJETOS) {
    const relX = obj.x - jugador.posicion.x;
    const relZ = obj.y - jugador.posicion.y;
    obj._distancia = Math.hypot(relX, relZ);

    bufferModelos.push();
    bufferModelos.translate(relX, TAMAÑO_CELDA / 2, relZ);
    if (obj.rotacionY) bufferModelos.rotateY(obj.rotacionY);
    bufferModelos.scale(obj.escala);
    bufferModelos.texture(texturaTienda);
    bufferModelos.model(modeloTienda);
    bufferModelos.pop();
  }

  bufferModelos.pop();
}

function componerObjetos3D() {
  if (OBJETOS.length === 0) return;

  let distanciaMasCercana = Infinity;
  for (const obj of OBJETOS) {
    distanciaMasCercana = Math.min(distanciaMasCercana, obj._distancia);
  }

  const ctx = pantallaJuego.drawingContext;
  const bufCanvas = bufferModelos.canvas;

  for (let x = 0; x < ANCHO_JUEGO; x++) {
    if (distanciaMasCercana < zBuffer[x]) {
      ctx.drawImage(bufCanvas, x, 0, 1, ALTO_JUEGO, x, 0, 1, ALTO_JUEGO);
    }
  }
}
function renderizarEscena() {
  dibujarCielo();
  dibujarSuelo();
  dibujarObjetos3D(); // renderiza el modelo en el buffer WEBGL (todavía no se ve)
  dibujarParedes();   // dibuja paredes y llena zBuffer
  componerObjetos3D(); // pega el modelo encima, solo donde no lo tapa una pared
}

function dibujarCielo() {
  pantallaJuego.image(texturaCielo, 0, 0, ANCHO_JUEGO, ALTO_JUEGO / 2);
}

function dibujarSuelo() {
  const buf = bufferPiso.data;
  const altoBuf = ALTO_JUEGO / 2;
  const horizonte = ALTO_JUEGO / 2;

  const halfFovTan = Math.tan(jugador.fov / 2);
  const dirX = Math.cos(jugador.angulo);
  const dirY = Math.sin(jugador.angulo);
  const planoX = -dirY * halfFovTan;
  const planoY = dirX * halfFovTan;

  const rayIzqX = dirX - planoX;
  const rayIzqY = dirY - planoY;
  const rayDerX = dirX + planoX;
  const rayDerY = dirY + planoY;

  const posX = jugador.posicion.x / TAMAÑO_CELDA;
  const posY = jugador.posicion.y / TAMAÑO_CELDA;

  for (let filaLocal = 0; filaLocal < altoBuf; filaLocal++) {
    const dist = filaLocal + 1;
    const rowDist = horizonte / dist;

    const pasoX = (rowDist * (rayDerX - rayIzqX)) / ANCHO_JUEGO;
    const pasoY = (rowDist * (rayDerY - rayIzqY)) / ANCHO_JUEGO;

    let mundoX = posX + rowDist * rayIzqX;
    let mundoY = posY + rowDist * rayIzqY;

    for (let x = 0; x < ANCHO_JUEGO; x++) {
      const celdaX = Math.floor(mundoX);
      const celdaY = Math.floor(mundoY);

      let columna = COL_PASTO;
      if (
        celdaX >= 0 &&
        celdaY >= 0 &&
        celdaX < MAPA_ANCHO &&
        celdaY < MAPA_ALTO
      ) {
        const tipo = MAPA[celdaY][celdaX];
        columna = tipo !== 1 ? obtenerColumnaSprite(tipo) : COL_PASTO;
      }

      const texX =
        Math.floor((mundoX - celdaX) * TAMANO_TILE) & (TAMANO_TILE - 1);
      const texY =
        Math.floor((mundoY - celdaY) * TAMANO_TILE) & (TAMANO_TILE - 1);

      const idxTex = (texY * anchoPisos + columna * TAMANO_TILE + texX) * 4;
      const idxBuf = (filaLocal * ANCHO_JUEGO + x) * 4;

      buf[idxBuf] = datosPisos[idxTex];
      buf[idxBuf + 1] = datosPisos[idxTex + 1];
      buf[idxBuf + 2] = datosPisos[idxTex + 2];
      buf[idxBuf + 3] = 255;

      mundoX += pasoX;
      mundoY += pasoY;
    }
  }

  pantallaJuego.drawingContext.putImageData(bufferPiso, 0, ALTO_JUEGO / 2);
}

function dibujarParedes() {
  const distanciaFocal = ANCHO_JUEGO / 2 / tan(jugador.fov / 2);

  for (let x = 0; x < ANCHO_JUEGO; x++) {
    const camX = (2 * x) / ANCHO_JUEGO - 1;
    const anguloRayo = jugador.angulo + atan(camX * tan(jugador.fov / 2));

    const resultado = lanzarRayo(anguloRayo);
    if (resultado === null) continue;

    const distanciaPerp =
      resultado.distancia * cos(anguloRayo - jugador.angulo);

    zBuffer[x] = distanciaPerp; // <-- nuevo

    const alturaPared = (TAMAÑO_CELDA / distanciaPerp) * distanciaFocal;

    const centroY = ALTO_JUEGO / 2;
    const arriba = centroY - alturaPared / 2;
    const abajo = centroY + alturaPared / 2;

    dibujarFranjaPared(x, arriba, abajo, resultado.texturaX, resultado.lado);
  }
}

function dibujarFranjaPared(x, arriba, abajo, texturaX, lado) {
  const posU = floor(texturaX * texturaPared.width);

  pantallaJuego.copy(
    texturaPared,
    posU,
    0,
    1,
    texturaPared.height,
    x,
    arriba,
    1,
    abajo - arriba,
  );

  if (lado === 1) {
    pantallaJuego.fill(0, 0, 0, 80);
    pantallaJuego.noStroke();
    pantallaJuego.rect(x, arriba, 1, abajo - arriba);
  }
}

function inicializarEscena3D() {
  escena3D = new THREE.Scene();
  camara3D = new THREE.PerspectiveCamera(
    66,
    windowWidth / windowHeight,
    1,
    TAMAÑO_CELDA * 40,
  );
  renderizador3D = new THREE.WebGLRenderer({ antialias: false });
  renderizador3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderizador3D.setSize(windowWidth, windowHeight);
  renderizador3D.outputEncoding = THREE.sRGBEncoding;
  renderizador3D.domElement.style.position = "fixed";
  renderizador3D.domElement.style.inset = "0";
  renderizador3D.domElement.style.imageRendering = "pixelated";
  document.body.appendChild(renderizador3D.domElement);

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
      } else {
        escena3D.add(crearBaldosaSuelo(cargador, MAPA[fila][columna], x, z));
      }
    }
  }

  const cargadorOBJ = new THREE.OBJLoader();
  cargadorOBJ.load("models/tienda/source/Tienda_02.obj", (modelo) => {
    const textura = cargador.load(
      "models/tienda/textures/Tienda_02_initialShadingGroup_BaseColor.10.png",
    );
    textura.colorSpace = THREE.SRGBColorSpace;
    modelo.traverse((objeto) => {
      if (objeto.isMesh) {
        objeto.material = new THREE.MeshStandardMaterial({
          map: textura,
          roughness: 0.82,
          metalness: 0,
          side: THREE.DoubleSide,
        });
      }
    });
    const caja = new THREE.Box3().setFromObject(modelo);
    const centro = caja.getCenter(new THREE.Vector3());
    const tamaño = caja.getSize(new THREE.Vector3());
    modelo.position.sub(centro);
    modelo.scale.setScalar(
      (TAMAÑO_CELDA * 1.8) / Math.max(tamaño.x, tamaño.y, tamaño.z),
    );
    modelo.position.set(OBJETOS[0].x, 0, OBJETOS[0].y);
    modelo.rotation.y = OBJETOS[0].rotacionY;
    escena3D.add(modelo);
  });
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
  const baldosa = new THREE.Mesh(
    new THREE.PlaneGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA),
    new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide }),
  );
  baldosa.rotation.x = -Math.PI / 2;
  baldosa.position.set(x, 0, z);
  return baldosa;
}

function actualizarCamara3D() {
  camara3D.position.set(jugador.posicion.x, TAMAÑO_CELDA * 0.56, jugador.posicion.y);
  camara3D.rotation.set(0, -jugador.angulo + Math.PI / 2, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  camara3D.aspect = windowWidth / windowHeight;
  camara3D.updateProjectionMatrix();
  renderizador3D.setSize(windowWidth, windowHeight);
}
