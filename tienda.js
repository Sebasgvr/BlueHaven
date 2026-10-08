const TIENDA = {
  posicion: null,
  objetoMundo: null,
  anchoColision: TAMAÑO_CELDA * 1.25,
  profundidadColision: TAMAÑO_CELDA * 1.1,
};

function tiendaInicializar() {
  // Mueve la tienda cambiando estas coordenadas de columna y fila.
  TIENDA.posicion = createVector(TAMAÑO_CELDA * 9, TAMAÑO_CELDA * 10);
}

function tiendaColisiona(posicion) {
  if (!TIENDA.posicion) return false;

  const mitadAncho = TIENDA.anchoColision / 2;
  const mitadProfundidad = TIENDA.profundidadColision / 2;

  return (
    Math.abs(posicion.x - TIENDA.posicion.x) <= mitadAncho &&
    Math.abs(posicion.y - TIENDA.posicion.y) <= mitadProfundidad
  );
}
