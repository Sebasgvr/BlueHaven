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

function preload() {
  texturaPared = loadImage("texturas/pared.png");
  texturaCielo = loadImage("texturas/cielo.png");
  texturaPisos = loadImage("assets/sprites/pisos/FloorTiles.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
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

  texturaPared.loadPixels();

  jugador = new Jugador(TAMAÑO_CELDA * 7.5, TAMAÑO_CELDA * 5.5);
}

function draw() {
  jugador.actualizar();
  renderizarEscena();
  image(pantallaJuego, 0, 0, width, height);
}

function renderizarEscena() {
  dibujarCielo();
  dibujarSuelo();
  dibujarParedes();
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
