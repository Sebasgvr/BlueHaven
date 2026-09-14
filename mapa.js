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

// Objetos 3D estáticos del mapa (posición en píxeles de mundo)
const OBJETOS = [
  {
    x: TAMAÑO_CELDA * 8.5,
    y: TAMAÑO_CELDA * 8.5,
    escala: 1,       // ajustá esto según el tamaño real del .obj
    rotacionY: 0,       // radianes, si el modelo mira para el lado equivocado
  },
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
