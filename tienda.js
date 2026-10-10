const TIENDA = {
  posicion: null,
  objetoMundo: null,
  anchoColision: 0,
  profundidadColision: 0,
};

function tiendaInicializar() {
  // Coordenadas de columna y fila de la tienda
  TIENDA.posicion = createVector(TAMAÑO_CELDA * 28.5, TAMAÑO_CELDA * 19);
}

function tiendaColisiona(posicion) {
  // Permite al jugador entrar al interior de la tienda y caminar libremente adentro
  return false;
}
