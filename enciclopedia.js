const ENCICLOPEDIA = {
  abierta: false,
  indiceSeleccionado: 0,
  scroll: 0,
  hover: -1,
  hoverBoton: "",
  peces: CATALOGO_ESPECIES,
};

function abrirEnciclopedia() {
  ENCICLOPEDIA.abierta = true;
  ENCICLOPEDIA.hover = -1;
  ENCICLOPEDIA.hoverBoton = "";
  _asegurarSeleccionVisible(_layoutEnciclopedia());
  if (document.pointerLockElement) document.exitPointerLock();
}

function cerrarEnciclopedia() {
  ENCICLOPEDIA.abierta = false;
  ENCICLOPEDIA.hover = -1;
  ENCICLOPEDIA.hoverBoton = "";
  if (typeof renderizador3D !== "undefined" && renderizador3D) {
    renderizador3D.domElement.style.cursor = "";
  }
}

function navegarEnciclopedia(direccion) {
  const total = ENCICLOPEDIA.peces.length;
  if (total === 0) return;
  ENCICLOPEDIA.indiceSeleccionado =
    (ENCICLOPEDIA.indiceSeleccionado + direccion + total) % total;
  _asegurarSeleccionVisible(_layoutEnciclopedia());
}

function desplazarListaEnciclopedia(delta) {
  const layout = _layoutEnciclopedia();
  const maxScroll = Math.max(
    0,
    ENCICLOPEDIA.peces.length - layout.filasVisibles,
  );
  ENCICLOPEDIA.scroll = constrain(ENCICLOPEDIA.scroll + delta, 0, maxScroll);
}

function manejarRuedaEnciclopedia(evento) {
  if (!ENCICLOPEDIA.abierta) return;
  evento.preventDefault();
  desplazarListaEnciclopedia(evento.deltaY > 0 ? 1 : -1);
}

function actualizarHoverEnciclopedia(x, y) {
  if (!ENCICLOPEDIA.abierta) return;
  const layout = _layoutEnciclopedia();
  let hover = -1;
  let hoverBoton = "";

  if (_puntoEnRect(x, y, layout.cerrar)) hoverBoton = "cerrar";
  else if (_puntoEnRect(x, y, layout.anterior)) hoverBoton = "anterior";
  else if (_puntoEnRect(x, y, layout.siguiente)) hoverBoton = "siguiente";
  else hover = _filaEnPunto(x, y, layout);

  ENCICLOPEDIA.hover = hover;
  ENCICLOPEDIA.hoverBoton = hoverBoton;
  if (typeof renderizador3D !== "undefined" && renderizador3D) {
    renderizador3D.domElement.style.cursor =
      hover >= 0 || hoverBoton ? "pointer" : "default";
  }
}

function manejarClicEnciclopedia(x, y) {
  if (!ENCICLOPEDIA.abierta) return;
  const layout = _layoutEnciclopedia();
  const libro = {
    x: layout.xLibro,
    y: layout.yLibro,
    w: layout.anchoLibro,
    h: layout.altoLibro,
  };

  if (!_puntoEnRect(x, y, libro)) {
    cerrarEnciclopedia();
    return;
  }
  if (_puntoEnRect(x, y, layout.cerrar)) {
    cerrarEnciclopedia();
    return;
  }
  if (_puntoEnRect(x, y, layout.anterior)) {
    navegarEnciclopedia(-1);
    return;
  }
  if (_puntoEnRect(x, y, layout.siguiente)) {
    navegarEnciclopedia(1);
    return;
  }

  const fila = _filaEnPunto(x, y, layout);
  if (fila >= 0) {
    ENCICLOPEDIA.indiceSeleccionado = fila;
    _asegurarSeleccionVisible(layout);
  }
}

function _layoutEnciclopedia() {
  const anchoLibro = Math.min(1080, Math.max(300, width - 48));
  const altoLibro = Math.min(680, Math.max(200, height - 48));
  const xLibro = (width - anchoLibro) / 2;
  const yLibro = (height - altoLibro) / 2;
  const escala = constrain(altoLibro / 680, 0.42, 1);
  const pad = Math.max(10, 26 * escala);
  const headerH = Math.max(36, 74 * escala);
  const footerH = Math.max(22, 38 * escala);
  const xCentro = xLibro + anchoLibro * 0.4;
  const listaX = xLibro + pad;
  const listaY = yLibro + headerH;
  const listaAncho = Math.max(120, xCentro - xLibro - pad * 2 - 10);
  const listaAlto = Math.max(120, altoLibro - headerH - footerH - 10);
  const filaBase = Math.max(38, 56 * escala);
  const filasVisibles = Math.max(
    1,
    Math.min(ENCICLOPEDIA.peces.length, Math.floor(listaAlto / filaBase)),
  );
  const filaAlto = listaAlto / filasVisibles;
  const detX = xCentro + pad + 4;
  const detAncho = Math.max(180, xLibro + anchoLibro - pad - detX);
  const tamCerrar = Math.max(24, 28 * escala);
  const cerrar = {
    x: xLibro + anchoLibro - pad - tamCerrar,
    y: yLibro + 14 * escala,
    w: tamCerrar,
    h: tamCerrar,
  };
  const tamNav = Math.max(22, 27 * escala);
  const navY = yLibro + altoLibro - footerH / 2 - tamNav / 2;
  const siguiente = {
    x: xLibro + anchoLibro - pad - tamNav,
    y: navY,
    w: tamNav,
    h: tamNav,
  };
  const anterior = {
    x: siguiente.x - tamNav - 8 * escala,
    y: navY,
    w: tamNav,
    h: tamNav,
  };

  return {
    anchoLibro,
    altoLibro,
    xLibro,
    yLibro,
    escala,
    pad,
    headerH,
    footerH,
    xCentro,
    listaX,
    listaY,
    listaAncho,
    listaAlto,
    filasVisibles,
    filaAlto,
    detX,
    detAncho,
    cerrar,
    anterior,
    siguiente,
  };
}

function _asegurarSeleccionVisible(layout) {
  const total = ENCICLOPEDIA.peces.length;
  const filas = layout ? layout.filasVisibles : total;
  const indice = ENCICLOPEDIA.indiceSeleccionado;

  if (indice < ENCICLOPEDIA.scroll) ENCICLOPEDIA.scroll = indice;
  else if (indice >= ENCICLOPEDIA.scroll + filas) {
    ENCICLOPEDIA.scroll = indice - filas + 1;
  }

  const maxScroll = Math.max(0, total - filas);
  ENCICLOPEDIA.scroll = Math.max(0, Math.min(ENCICLOPEDIA.scroll, maxScroll));
}

function _filaEnPunto(x, y, layout) {
  if (
    x < layout.listaX ||
    x > layout.listaX + layout.listaAncho ||
    y < layout.listaY ||
    y > layout.listaY + layout.listaAlto
  ) {
    return -1;
  }
  const fila = Math.floor((y - layout.listaY) / layout.filaAlto);
  if (fila < 0 || fila >= layout.filasVisibles) return -1;
  const indice = ENCICLOPEDIA.scroll + fila;
  return indice < ENCICLOPEDIA.peces.length ? indice : -1;
}

function _puntoEnRect(x, y, rect) {
  return (
    x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  );
}

function _textoRecortado(texto, maxAncho) {
  if (textWidth(texto) <= maxAncho) return texto;
  let recorte = texto;
  while (recorte.length > 1 && textWidth(recorte + "…") > maxAncho) {
    recorte = recorte.slice(0, -1);
  }
  return recorte + "…";
}

function _tamTextoAjustado(texto, maxAncho, maxTam, minTam) {
  let tam = maxTam;
  while (tam > minTam) {
    textSize(tam);
    if (textWidth(texto) <= maxAncho) break;
    tam -= 0.5;
  }
  return tam;
}

function _dibujarRetratoPez(pez, x, y, tam, calidad, bloqueado) {
  const radio = Math.max(4, tam * 0.12);
  noStroke();
  fill(24, 47, 56);
  rect(x, y, tam, tam, radio);

  const imagen = pez.sprite && spritesPeces && spritesPeces[pez.sprite];
  if (imagen && !bloqueado) {
    image(imagen, x + tam * 0.08, y + tam * 0.08, tam * 0.84, tam * 0.84);
  } else {
    const cx = x + tam / 2;
    const cy = y + tam / 2;
    fill(145, 185, 194, bloqueado ? 90 : 220);
    ellipse(cx, cy, tam * 0.46, tam * 0.28);
    triangle(
      cx + tam * 0.18,
      cy,
      cx + tam * 0.36,
      cy - tam * 0.15,
      cx + tam * 0.36,
      cy + tam * 0.15,
    );
    fill(24, 47, 56);
    circle(cx - tam * 0.12, cy - tam * 0.03, Math.max(2, tam * 0.055));
  }

  if (bloqueado) {
    _dibujarCandado(x + tam / 2, y + tam / 2, tam * 0.3, [222, 211, 184]);
  }

  const colorMarco =
    calidad || (bloqueado ? { color: [126, 132, 118] } : calidadDe(pez));
  noFill();
  stroke(
    colorMarco.color[0],
    colorMarco.color[1],
    colorMarco.color[2],
    calidad ? 220 : 90,
  );
  strokeWeight(calidad ? 2 : 1);
  rect(x, y, tam, tam, radio);
  noStroke();
}

function _dibujarCandado(cx, cy, tam, color) {
  const ancho = tam * 0.7;
  const alto = tam * 0.52;
  push();
  noFill();
  stroke(color[0], color[1], color[2], 220);
  strokeWeight(Math.max(1, tam * 0.1));
  arc(cx, cy - alto * 0.15, ancho * 0.62, alto * 0.78, PI, TWO_PI);
  noStroke();
  fill(color[0], color[1], color[2], 230);
  rect(cx - ancho / 2, cy, ancho, alto, alto * 0.22);
  fill(24, 47, 56);
  circle(cx, cy + alto * 0.38, Math.max(2, tam * 0.12));
  pop();
}

function dibujarEnciclopedia() {
  if (!ENCICLOPEDIA.abierta) return;

  const layout = _layoutEnciclopedia();
  _asegurarSeleccionVisible(layout);
  const escala = layout.escala;

  push();

  noStroke();
  fill(4, 9, 14, 235);
  rect(0, 0, width, height);

  drawingContext.save();
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.55)";
  drawingContext.shadowBlur = 34;
  drawingContext.shadowOffsetY = 14;
  fill(10, 26, 39);
  rect(
    layout.xLibro - 12,
    layout.yLibro - 12,
    layout.anchoLibro + 24,
    layout.altoLibro + 24,
    18,
  );
  drawingContext.restore();

  noStroke();
  fill(13, 32, 47);
  rect(
    layout.xLibro - 12,
    layout.yLibro - 12,
    layout.anchoLibro + 24,
    layout.altoLibro + 24,
    18,
  );
  noFill();
  stroke(198, 164, 95);
  strokeWeight(2);
  rect(
    layout.xLibro - 12,
    layout.yLibro - 12,
    layout.anchoLibro + 24,
    layout.altoLibro + 24,
    18,
  );

  noStroke();
  fill(241, 232, 211);
  rect(
    layout.xLibro,
    layout.yLibro,
    layout.xCentro - layout.xLibro,
    layout.altoLibro,
    10,
    0,
    0,
    10,
  );
  fill(249, 242, 225);
  rect(
    layout.xCentro,
    layout.yLibro,
    layout.xLibro + layout.anchoLibro - layout.xCentro,
    layout.altoLibro,
    0,
    10,
    10,
    0,
  );

  const gradienteLomo = drawingContext.createLinearGradient(
    layout.xCentro - 22,
    0,
    layout.xCentro + 22,
    0,
  );
  gradienteLomo.addColorStop(0, "rgba(38, 45, 45, 0)");
  gradienteLomo.addColorStop(0.42, "rgba(38, 45, 45, 0.18)");
  gradienteLomo.addColorStop(0.5, "rgba(22, 32, 35, 0.34)");
  gradienteLomo.addColorStop(0.58, "rgba(38, 45, 45, 0.18)");
  gradienteLomo.addColorStop(1, "rgba(38, 45, 45, 0)");
  drawingContext.fillStyle = gradienteLomo;
  drawingContext.fillRect(
    layout.xCentro - 22,
    layout.yLibro,
    44,
    layout.altoLibro,
  );

  noFill();
  stroke(150, 128, 85, 60);
  strokeWeight(1);
  rect(
    layout.xLibro + 8,
    layout.yLibro + 8,
    layout.anchoLibro - 16,
    layout.altoLibro - 16,
    8,
  );

  _dibujarCabeceraEnciclopedia(layout);
  _dibujarListaEnciclopedia(layout);
  _dibujarDetalleEnciclopedia(layout);
  _dibujarPieEnciclopedia(layout);
  _dibujarBotonCerrar(layout);

  pop();
}

function _dibujarCabeceraEnciclopedia(layout) {
  const escala = layout.escala;
  const registradas = ENCICLOPEDIA.peces.reduce(
    (total, pez) => total + (registroDe(pez.nombre) ? 1 : 0),
    0,
  );
  const total = ENCICLOPEDIA.peces.length;
  const progreso = total > 0 ? registradas / total : 0;

  fill(119, 92, 54);
  textAlign(LEFT, TOP);
  textSize(Math.max(6, 7 * escala));
  text(
    "BLUEHAVEN · ARCHIVO EDUCATIVO",
    layout.listaX,
    layout.yLibro + 12 * escala,
  );

  fill(36, 49, 45);
  textSize(Math.max(12, 20 * escala));
  text(
    "Enciclopedia",
    layout.listaX,
    layout.yLibro + 23 * escala,
    layout.listaAncho,
    24 * escala,
  );

  fill(126, 105, 74);
  textSize(Math.max(7, 8.5 * escala));
  text(
    registradas + " de " + total + " especies registradas",
    layout.listaX,
    layout.yLibro + 49 * escala,
  );

  const barraY = layout.yLibro + 61 * escala;
  noStroke();
  fill(211, 198, 171);
  rect(layout.listaX, barraY, layout.listaAncho, 3 * escala, 2);
  fill(177, 139, 61);
  rect(layout.listaX, barraY, layout.listaAncho * progreso, 3 * escala, 2);
}

function _dibujarListaEnciclopedia(layout) {
  const escala = layout.escala;
  const total = ENCICLOPEDIA.peces.length;
  const thumbTam = Math.min(36 * escala, layout.filaAlto - 12 * escala);

  for (let fila = 0; fila < layout.filasVisibles; fila++) {
    const indice = ENCICLOPEDIA.scroll + fila;
    if (indice >= total) break;

    const pez = ENCICLOPEDIA.peces[indice];
    const y = layout.listaY + fila * layout.filaAlto;
    const seleccionado = indice === ENCICLOPEDIA.indiceSeleccionado;
    const hover = indice === ENCICLOPEDIA.hover;

    noStroke();
    if (seleccionado) {
      fill(208, 191, 155, 215);
      rect(
        layout.listaX,
        y + 2 * escala,
        layout.listaAncho,
        layout.filaAlto - 4 * escala,
        7 * escala,
      );
      fill(194, 154, 77);
      rect(
        layout.listaX,
        y + 7 * escala,
        3 * escala,
        layout.filaAlto - 14 * escala,
        2,
      );
    } else if (hover) {
      fill(230, 219, 193, 150);
      rect(
        layout.listaX,
        y + 2 * escala,
        layout.listaAncho,
        layout.filaAlto - 4 * escala,
        7 * escala,
      );
    }

    const registro = registroDe(pez.nombre);
    const desbloqueado = !!registro;
    const thumbX = layout.listaX + 10 * escala;
    const thumbY = y + (layout.filaAlto - thumbTam) / 2;
    _dibujarRetratoPez(pez, thumbX, thumbY, thumbTam, null, !desbloqueado);

    const textoX = thumbX + thumbTam + 10 * escala;
    const anchoTexto = Math.max(
      40,
      layout.listaAncho - (textoX - layout.listaX) - 66 * escala,
    );
    const nombreY = y + layout.filaAlto * 0.34;
    const subY = y + layout.filaAlto * 0.68;

    fill(40, 48, 42);
    textAlign(LEFT, CENTER);
    textSize(Math.max(7, 11.2 * escala));
    text(
      desbloqueado ? _textoRecortado(pez.nombre, anchoTexto) : "???",
      textoX,
      nombreY,
    );

    fill(126, 107, 78);
    textSize(Math.max(6, 8 * escala));
    const subtitulo = desbloqueado
      ? registro.capturas +
        (registro.capturas === 1 ? " registro" : " registros")
      : "Bloqueada";
    text(subtitulo, textoX, subY);

    if (desbloqueado) {
      fill(174, 133, 55);
      textAlign(RIGHT, CENTER);
      textSize(Math.max(6, 7 * escala));
      text(
        "★".repeat(pez.rareza),
        layout.listaX + layout.listaAncho - 10 * escala,
        nombreY,
      );
    }

    if (desbloqueado && registro.mejorCalidadId) {
      const mejor = CALIDAD_POR_ID[registro.mejorCalidadId];
      fill(mejor.color[0], mejor.color[1], mejor.color[2]);
      circle(layout.listaX + layout.listaAncho - 15 * escala, subY, 7 * escala);
    } else {
      noFill();
      stroke(160, 150, 130, 130);
      strokeWeight(1);
      circle(layout.listaX + layout.listaAncho - 15 * escala, subY, 7 * escala);
      noStroke();
    }
  }

  if (ENCICLOPEDIA.scroll > 0) {
    noStroke();
    fill(150, 120, 70);
    triangle(
      layout.listaX + layout.listaAncho - 12 * escala,
      layout.listaY + 5 * escala,
      layout.listaX + layout.listaAncho - 5 * escala,
      layout.listaY + 5 * escala,
      layout.listaX + layout.listaAncho - 8.5 * escala,
      layout.listaY,
    );
  }
  if (ENCICLOPEDIA.scroll + layout.filasVisibles < total) {
    noStroke();
    fill(150, 120, 70);
    triangle(
      layout.listaX + layout.listaAncho - 12 * escala,
      layout.listaY + layout.listaAlto - 5 * escala,
      layout.listaX + layout.listaAncho - 5 * escala,
      layout.listaY + layout.listaAlto - 5 * escala,
      layout.listaX + layout.listaAncho - 8.5 * escala,
      layout.listaY + layout.listaAlto,
    );
  }
}

function _dibujarDetalleEnciclopedia(layout) {
  const escala = layout.escala;
  const indice = ENCICLOPEDIA.indiceSeleccionado;
  const pez = ENCICLOPEDIA.peces[indice];
  if (!pez) return;

  const registro = registroDe(pez.nombre);
  const desbloqueado = !!registro;
  const mejor = mejorCalidadDe(pez.nombre);
  const x = layout.detX;
  const ancho = layout.detAncho;
  const yInicio = layout.yLibro + layout.headerH + 4 * escala;
  const yLimite = layout.yLibro + layout.altoLibro - layout.footerH - 4;
  const altoDisponible = Math.max(160, yLimite - yInicio);

  // Reparto proporcional del espacio vertical disponible
  const gap = Math.max(4, Math.min(10 * escala, altoDisponible * 0.02));
  const heroAlto = Math.max(
    48 * escala,
    Math.min(84 * escala, altoDisponible * 0.22),
  );
  const camposTotalAlto = Math.max(60, altoDisponible * 0.33);
  const descAlto = Math.max(32, altoDisponible * 0.19);
  const curiosoAlto = Math.max(28, altoDisponible * 0.15);
  const registroAlto = Math.max(22, altoDisponible * 0.11);

  let y = yInicio;

  // 1. Hero: Título, rareza y retrato
  const retrato = Math.min(heroAlto, ancho * 0.28);
  const retratoX = x + ancho - retrato;
  const textoAncho = Math.max(80, ancho - retrato - 12 * escala);

  fill(150, 128, 86);
  textAlign(LEFT, TOP);
  textSize(Math.max(5, 7.5 * escala));
  text("FICHA " + String(indice + 1).padStart(2, "0"), x, y);

  const nombreMostrado = desbloqueado ? pez.nombre : "Especie bloqueada";
  fill(35, 45, 42);
  textSize(
    _tamTextoAjustado(
      nombreMostrado,
      textoAncho,
      Math.max(11, 22 * escala),
      Math.max(8, 11 * escala),
    ),
  );
  text(nombreMostrado, x, y + 10 * escala, textoAncho, 24 * escala);

  fill(126, 105, 75);
  textSize(Math.max(6, 9 * escala));
  text(
    desbloqueado ? _textoRecortado(pez.nombreCientifico, textoAncho) : "???",
    x,
    y + 28 * escala,
    textoAncho,
    14 * escala,
  );

  if (desbloqueado) {
    fill(174, 133, 55);
    textSize(Math.max(7, 10 * escala));
    text("★".repeat(pez.rareza), x, y + 42 * escala, textoAncho, 12 * escala);
  } else {
    fill(150, 135, 105);
    textSize(Math.max(6, 8 * escala));
    text("Rareza desconocida", x, y + 42 * escala, textoAncho, 12 * escala);
  }

  _dibujarRetratoPez(pez, retratoX, y, retrato, mejor, !desbloqueado);

  y += heroAlto + gap;
  stroke(160, 140, 100, 70);
  strokeWeight(1);
  line(x, y - gap / 2, x + ancho, y - gap / 2);
  noStroke();

  // 2. Grilla de 6 campos (3 filas x 2 columnas)
  const campos = [
    ["Hábitat", desbloqueado ? pez.habitat : "???"],
    ["Alimentación", desbloqueado ? pez.alimentacion : "???"],
    ["Tamaño", desbloqueado ? pez.tamaño : "???"],
    ["Peso", desbloqueado ? pez.peso : "???"],
    ["Dificultad", desbloqueado ? pez.dificultad : "???"],
    ["Cebo recomendado", desbloqueado ? pez.ceboRecomendado : "???"],
  ];
  const separacionX = 6 * escala;
  const separacionY = Math.max(3, 5 * escala);
  const campoAncho = (ancho - separacionX) / 2;
  const campoAlto = (camposTotalAlto - 2 * separacionY) / 3;

  for (let i = 0; i < campos.length; i++) {
    const columna = i % 2;
    const fila = Math.floor(i / 2);
    _dibujarCampoInfo(
      campos[i][0],
      campos[i][1],
      x + columna * (campoAncho + separacionX),
      y + fila * (campoAlto + separacionY),
      campoAncho,
      campoAlto,
      escala,
    );
  }
  y += camposTotalAlto + gap;

  // 3. Descripción
  noStroke();
  fill(233, 223, 201, 170);
  rect(x, y, ancho, descAlto, 5 * escala);
  fill(123, 98, 62);
  textAlign(LEFT, TOP);
  textSize(Math.max(5, 7.5 * escala));
  text("DESCRIPCIÓN", x + 8 * escala, y + 4 * escala);
  fill(48, 48, 42);
  textSize(Math.max(6.5, 9.5 * escala));
  text(
    desbloqueado
      ? pez.descripcion
      : "Pescá un ejemplar de esta especie para desbloquear su ficha, su foto y sus datos.",
    x + 8 * escala,
    y + 16 * escala,
    ancho - 16 * escala,
    descAlto - 18 * escala,
  );
  y += descAlto + gap;

  // 4. Dato curioso
  noStroke();
  fill(238, 226, 195, 205);
  rect(x, y, ancho, curiosoAlto, 5 * escala);
  fill(185, 143, 57);
  rect(x, y, 3 * escala, curiosoAlto, 2 * escala);
  fill(142, 104, 48);
  textAlign(LEFT, TOP);
  textSize(Math.max(5, 7 * escala));
  text(
    desbloqueado ? "¿SABÍAS QUE...?" : "DATO CURIOSO BLOQUEADO",
    x + 8 * escala,
    y + 4 * escala,
  );
  fill(70, 61, 45);
  textSize(Math.max(6.5, 9 * escala));
  text(
    desbloqueado
      ? pez.datoCurioso
      : "Se revela al capturar tu primer ejemplar.",
    x + 8 * escala,
    y + 16 * escala,
    ancho - 16 * escala,
    curiosoAlto - 18 * escala,
  );
  y += curiosoAlto + gap;

  // 5. Barra de Registro
  fill(28, 49, 56);
  rect(x, y, ancho, registroAlto, 5 * escala);
  fill(196, 169, 105);
  textAlign(LEFT, TOP);
  textSize(Math.max(5, 7 * escala));
  text("REGISTRO", x + 8 * escala, y + 4 * escala);
  fill(232, 224, 204);
  textSize(Math.max(6.5, 8.5 * escala));
  text(
    registro
      ? registro.capturas + (registro.capturas === 1 ? " captura" : " capturas")
      : "Sin capturas",
    x + 8 * escala,
    y + Math.max(14 * escala, registroAlto * 0.45),
  );

  textAlign(RIGHT, CENTER);
  textSize(Math.max(6.5, 8.5 * escala));
  if (desbloqueado && mejor) {
    fill(mejor.color[0], mejor.color[1], mejor.color[2]);
    text(
      _textoRecortado("Mejor: " + mejor.nombre, ancho * 0.5),
      x + ancho - 8 * escala,
      y + registroAlto / 2,
    );
  } else {
    fill(150, 172, 176);
    text(
      desbloqueado ? "Aún no registrada" : "Bloqueada",
      x + ancho - 8 * escala,
      y + registroAlto / 2,
    );
  }
}

function _dibujarCampoInfo(label, valor, x, y, ancho, alto, escala) {
  noStroke();
  fill(255, 255, 255, 55);
  rect(x, y, ancho, alto, 4 * escala);
  fill(126, 101, 66);
  textAlign(LEFT, TOP);
  textSize(Math.max(4.5, 6.8 * escala));
  text(label.toUpperCase(), x + 5 * escala, y + Math.max(2, 3 * escala));
  fill(47, 49, 43);
  textSize(Math.max(5.5, 8.8 * escala));
  text(
    valor,
    x + 5 * escala,
    y + Math.max(9, 13 * escala),
    ancho - 10 * escala,
    alto - Math.max(9, 13 * escala),
  );
}

function _dibujarPieEnciclopedia(layout) {
  const escala = layout.escala;
  const y = layout.yLibro + layout.altoLibro - layout.footerH / 2;
  const total = ENCICLOPEDIA.peces.length;
  const indice = ENCICLOPEDIA.indiceSeleccionado + 1;

  fill(112, 90, 58);
  textAlign(LEFT, CENTER);
  textSize(Math.max(6, 7.5 * escala));
  const ayuda =
    layout.anchoLibro < 760
      ? "[W/S] Navegar   [L] Cerrar"
      : "[W/S] Navegar   [RUEDA] Desplazar   [L] Cerrar";
  text(ayuda, layout.listaX, y);

  fill(92, 75, 52);
  textAlign(RIGHT, CENTER);
  text(indice + " / " + total, layout.anterior.x - 8 * escala, y);

  _dibujarBotonNav(
    layout.anterior,
    "<",
    ENCICLOPEDIA.hoverBoton === "anterior",
    escala,
  );
  _dibujarBotonNav(
    layout.siguiente,
    ">",
    ENCICLOPEDIA.hoverBoton === "siguiente",
    escala,
  );
}

function _dibujarBotonNav(boton, texto, activo, escala) {
  noStroke();
  fill(activo ? color(197, 164, 95) : color(55, 72, 67, 40));
  rect(boton.x, boton.y, boton.w, boton.h, boton.w / 2);
  noFill();
  stroke(150, 127, 82, 90);
  strokeWeight(1);
  rect(boton.x, boton.y, boton.w, boton.h, boton.w / 2);
  noStroke();
  fill(activo ? color(30, 42, 38) : color(100, 86, 62));
  textAlign(CENTER, CENTER);
  textSize(Math.max(10, 14 * escala));
  text(texto, boton.x + boton.w / 2, boton.y + boton.h / 2);
}

function _dibujarBotonCerrar(layout) {
  const activo = ENCICLOPEDIA.hoverBoton === "cerrar";
  const boton = layout.cerrar;

  noStroke();
  fill(activo ? color(122, 55, 50) : color(48, 61, 58, 45));
  rect(boton.x, boton.y, boton.w, boton.h, boton.w / 2);
  noFill();
  stroke(160, 130, 80, 100);
  strokeWeight(1);
  rect(boton.x, boton.y, boton.w, boton.h, boton.w / 2);
  noStroke();
  fill(activo ? color(255, 235, 220) : color(92, 78, 58));
  textAlign(CENTER, CENTER);
  textSize(Math.max(14, 18 * layout.escala));
  text("×", boton.x + boton.w / 2, boton.y + boton.h / 2 + 1);
}
