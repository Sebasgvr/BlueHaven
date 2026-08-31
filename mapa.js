const TAMAÑO_CELDA = 64;

const MAPA = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const MAPA_ANCHO = MAPA[0].length;
const MAPA_ALTO = MAPA.length;

function esPared(celdaX, celdaY) {
  if (celdaX < 0 || celdaY < 0 || celdaX >= MAPA_ANCHO || celdaY >= MAPA_ALTO) {
    return true;
  }
  return MAPA[celdaY][celdaX] === 1;
}

const TAMANO_TILE = 16;

const COL_PASTO = 0;
const COL_TIERRA = 1;
const COL_AGUA = 12;

function obtenerColumnaSprite(tipoCelda) {
  if (tipoCelda === 2) return COL_TIERRA;
  if (tipoCelda === 3) return COL_AGUA;
  return COL_PASTO;
}
