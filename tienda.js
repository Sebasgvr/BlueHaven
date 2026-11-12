const TIENDA = {
  posicion: null,
  objetoMundo: null,
  anchoColision: 0,
  profundidadColision: 0,
};

// Escala de la tienda (se puede cambiar para agrandar/achicar todo)
const TIENDA_ESCALA = 27.0;
const TIENDA_ESCALA_BASE = 19.0;
const TIENDA_FACTOR = TIENDA_ESCALA / TIENDA_ESCALA_BASE;
const TIENDA_AJUSTE_ALTURA = 15;
const TIENDA_ESCALON_MAXIMO =
  TAMAÑO_CELDA * 0.35 * TIENDA_FACTOR + Math.abs(TIENDA_AJUSTE_ALTURA);

function tiendaInicializar() {
  // Coordenadas de columna y fila de la tienda
  TIENDA.posicion = createVector(TAMAÑO_CELDA * 22.5, TAMAÑO_CELDA * 13);
}

function tiendaColisiona(posicion) {
  // Permite al jugador entrar al interior de la tienda y caminar libremente adentro
  return false;
}

// Versión simplificada: la tienda no registra colisiones 3D.
function tiendaRegistrarColisiones(modelo) {}
function tiendaAlturaPiso(x, z, referencia = 0) {
  return 0;
}
