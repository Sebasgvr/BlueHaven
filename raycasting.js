function lanzarRayo(angulo) {
  const dirX = cos(angulo);
  const dirY = sin(angulo);

  let celdaX = floor(jugador.posicion.x / TAMAÑO_CELDA);
  let celdaY = floor(jugador.posicion.y / TAMAÑO_CELDA);

  const pasoX = dirX < 0 ? -1 : 1;
  const pasoY = dirY < 0 ? -1 : 1;

  const deltaX = dirX === 0 ? Infinity : abs(1 / dirX);
  const deltaY = dirY === 0 ? Infinity : abs(1 / dirY);

  let siguienteX =
    dirX < 0
      ? (jugador.posicion.x / TAMAÑO_CELDA - celdaX) * deltaX
      : (celdaX + 1 - jugador.posicion.x / TAMAÑO_CELDA) * deltaX;

  let siguienteY =
    dirY < 0
      ? (jugador.posicion.y / TAMAÑO_CELDA - celdaY) * deltaY
      : (celdaY + 1 - jugador.posicion.y / TAMAÑO_CELDA) * deltaY;

  let distancia = 0;
  let lado = 0;

  for (let i = 0; i < 200; i++) {
    if (siguienteX < siguienteY) {
      distancia = siguienteX;
      siguienteX += deltaX;
      celdaX += pasoX;
      lado = 0;
    } else {
      distancia = siguienteY;
      siguienteY += deltaY;
      celdaY += pasoY;
      lado = 1;
    }

    if (
      celdaX < 0 ||
      celdaY < 0 ||
      celdaX >= MAPA_ANCHO ||
      celdaY >= MAPA_ALTO
    ) {
      return null;
    }

    if (MAPA[celdaY][celdaX] === 1) {
      const distanciaReal = distancia * TAMAÑO_CELDA;

      let punto;
      if (lado === 0) {
        punto = jugador.posicion.y + distancia * TAMAÑO_CELDA * dirY;
      } else {
        punto = jugador.posicion.x + distancia * TAMAÑO_CELDA * dirX;
      }

      let texturaX = (punto % TAMAÑO_CELDA) / TAMAÑO_CELDA;
      if (texturaX < 0) texturaX += 1;

      if (lado === 0 && dirX > 0) texturaX = 1 - texturaX;
      if (lado === 1 && dirY < 0) texturaX = 1 - texturaX;

      return {
        distancia: distanciaReal,
        texturaX: texturaX,
        lado: lado,
      };
    }
  }

  return null;
}
