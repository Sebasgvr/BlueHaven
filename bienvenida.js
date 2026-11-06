const BIENVENIDA = {
  activa: true,
  _animacion: 0,
  _parpadeo: 0,
  _saliendo: false,
  _timerSalida: 0,
  DURACION_SALIDA: 0.45,
};

// Sprites de iconos
function _dibujarIconoPez(cx, cy, tam) {
  push();
  noStroke();
  fill(30, 90, 140);
  triangle(
    cx - tam * 0.5,
    cy - tam * 0.22,
    cx - tam * 0.5,
    cy + tam * 0.22,
    cx - tam * 0.18,
    cy,
  );
  fill(55, 155, 210);
  ellipse(cx + tam * 0.06, cy, tam * 0.72, tam * 0.44);
  fill(30, 110, 170);
  triangle(
    cx - tam * 0.04,
    cy - tam * 0.22,
    cx + tam * 0.14,
    cy - tam * 0.22,
    cx + tam * 0.04,
    cy - tam * 0.08,
  );
  fill(140, 210, 240);
  ellipse(cx + tam * 0.1, cy + tam * 0.07, tam * 0.38, tam * 0.18);
  fill(240, 240, 240);
  circle(cx + tam * 0.26, cy - tam * 0.06, tam * 0.13);
  fill(10, 20, 30);
  circle(cx + tam * 0.27, cy - tam * 0.06, tam * 0.07);
  fill(255);
  circle(cx + tam * 0.25, cy - tam * 0.09, tam * 0.03);
  pop();
}

function _dibujarIconoCaña(cx, cy, tam) {
  push();
  strokeCap(SQUARE);
  stroke(160, 110, 50);
  strokeWeight(Math.max(2, tam * 0.07));
  line(cx - tam * 0.38, cy - tam * 0.42, cx + tam * 0.3, cy + tam * 0.28);
  stroke(200, 220, 240, 180);
  strokeWeight(Math.max(1, tam * 0.03));
  line(cx + tam * 0.3, cy + tam * 0.28, cx + tam * 0.3, cy + tam * 0.46);
  noFill();
  stroke(190, 190, 200);
  strokeWeight(Math.max(1, tam * 0.045));
  arc(cx + tam * 0.26, cy + tam * 0.46, tam * 0.1, tam * 0.1, 0, PI);
  noStroke();
  fill(100, 65, 30);
  rect(cx - tam * 0.42, cy - tam * 0.46, tam * 0.1, tam * 0.18, 2);
  pop();
}

function _dibujarIconoLibro(cx, cy, tam) {
  push();
  noStroke();
  fill(160, 100, 40);
  rect(cx - tam * 0.44, cy - tam * 0.32, tam * 0.42, tam * 0.64, 3, 0, 0, 3);
  fill(241, 232, 211);
  rect(cx - tam * 0.4, cy - tam * 0.28, tam * 0.38, tam * 0.56);
  fill(180, 165, 135);
  for (let i = 0; i < 4; i++) {
    rect(
      cx - tam * 0.34,
      cy - tam * 0.18 + i * tam * 0.1,
      tam * 0.26,
      tam * 0.04,
      1,
    );
  }
  fill(249, 242, 225);
  rect(cx + tam * 0.02, cy - tam * 0.28, tam * 0.38, tam * 0.56);
  fill(160, 100, 40);
  rect(cx + tam * 0.38, cy - tam * 0.32, tam * 0.07, tam * 0.64, 0, 3, 3, 0);
  fill(180, 165, 135);
  for (let i = 0; i < 4; i++) {
    rect(
      cx + tam * 0.08,
      cy - tam * 0.18 + i * tam * 0.1,
      tam * 0.24,
      tam * 0.04,
      1,
    );
  }
  fill(120, 72, 25);
  rect(cx - tam * 0.03, cy - tam * 0.32, tam * 0.06, tam * 0.64);
  pop();
}

function _dibujarIconoMoneda(cx, cy, tam) {
  push();
  noStroke();
  fill(120, 85, 0, 100);
  ellipse(cx + tam * 0.04, cy + tam * 0.06, tam * 0.52, tam * 0.52);
  fill(220, 170, 20);
  circle(cx, cy, tam * 0.52);
  fill(255, 210, 50);
  circle(cx, cy, tam * 0.42);
  fill(160, 110, 0);
  textAlign(CENTER, CENTER);
  textSize(tam * 0.24);
  text("$", cx, cy + tam * 0.02);
  pop();
}

// Layout adaptativo
function _layoutBienvenida() {
  const panelW = Math.min(960, Math.max(340, width - 36));
  const panelH = Math.min(650, Math.max(300, height - 36));
  const panelX = (width - panelW) / 2;
  const panelY = (height - panelH) / 2;
  const escala = Math.min(panelH / 650, panelW / 960, 1);
  return { panelW, panelH, panelX, panelY, escala };
}

// Renderizado principal
function dibujarBienvenida() {
  if (!BIENVENIDA.activa && !BIENVENIDA._saliendo) return;

  const dt = Math.min(deltaTime / 1000, 0.05);
  BIENVENIDA._animacion += dt;
  BIENVENIDA._parpadeo += dt;

  // Animación de fade de salida
  let alpha = 255;
  if (BIENVENIDA._saliendo) {
    BIENVENIDA._timerSalida -= dt;
    if (BIENVENIDA._timerSalida <= 0) {
      BIENVENIDA._saliendo = false;
      BIENVENIDA.activa = false;
      return;
    }
    alpha = map(BIENVENIDA._timerSalida, 0, BIENVENIDA.DURACION_SALIDA, 0, 255);
  }

  const L = _layoutBienvenida();
  const { panelW, panelH, panelX, panelY, escala } = L;

  push();
  drawingContext.globalAlpha = alpha / 255;

  noStroke();
  fill(4, 9, 14, 235);
  rect(0, 0, width, height);

  drawingContext.save();
  drawingContext.shadowColor = "rgba(0,0,0,0.75)";
  drawingContext.shadowBlur = 48;
  drawingContext.shadowOffsetY = 20;
  fill(10, 22, 34);
  rect(panelX - 16, panelY - 16, panelW + 32, panelH + 32, 20);
  drawingContext.restore();

  noStroke();
  fill(10, 22, 34);
  rect(panelX - 16, panelY - 16, panelW + 32, panelH + 32, 20);

  noFill();
  stroke(198, 164, 95);
  strokeWeight(2.5);
  rect(panelX - 16, panelY - 16, panelW + 32, panelH + 32, 20);
  noStroke();

  noFill();
  stroke(150, 120, 60, 70);
  strokeWeight(1);
  rect(panelX - 7, panelY - 7, panelW + 14, panelH + 14, 15);
  noStroke();

  // Cabecera
  fill(14, 32, 48);
  rect(panelX, panelY, panelW, 82 * escala, 12, 12, 0, 0);

  fill(185, 148, 80);
  textAlign(CENTER, CENTER);
  textSize(Math.max(9, 12.5 * escala));
  text("GUÍA DEL PESCADOR", panelX + panelW / 2, panelY + 22 * escala);

  fill(250, 240, 215);
  textSize(Math.max(16, 28 * escala));
  textAlign(CENTER, CENTER);
  text("BlueHaven", panelX + panelW / 2, panelY + 52 * escala);

  stroke(198, 164, 95, 150);
  strokeWeight(1.5);
  line(
    panelX + 36,
    panelY + 84 * escala,
    panelX + panelW - 36,
    panelY + 84 * escala,
  );
  noStroke();

  fill(145, 195, 225);
  textAlign(CENTER, CENTER);
  textSize(Math.max(8.5, 12 * escala));
  text(
    "Juego 3D educativo de pesca y colección",
    panelX + panelW / 2,
    panelY + 106 * escala,
  );

  // Pasos de juego
  const iconoY = panelY + 185 * escala;
  const iconoTam = Math.min(60, Math.max(34, 56 * escala));
  const iconos = [
    { fn: _dibujarIconoCaña, l1: "Lanzá", l2: "tu caña" },
    { fn: _dibujarIconoPez, l1: "Capturá", l2: "peces" },
    { fn: _dibujarIconoLibro, l1: "Descubrí", l2: "especies" },
    { fn: _dibujarIconoMoneda, l1: "Vendé y", l2: "mejorá equipo" },
  ];
  const separacion = panelW / (iconos.length + 1);

  for (let i = 0; i < iconos.length; i++) {
    const ix = panelX + separacion * (i + 1);

    fill(20, 38, 54, 230);
    noStroke();
    rect(
      ix - iconoTam * 0.65,
      iconoY - iconoTam * 0.65,
      iconoTam * 1.3,
      iconoTam * 1.3,
      10 * escala,
    );
    stroke(85, 125, 165, 120);
    strokeWeight(1.2);
    rect(
      ix - iconoTam * 0.65,
      iconoY - iconoTam * 0.65,
      iconoTam * 1.3,
      iconoTam * 1.3,
      10 * escala,
    );
    noStroke();

    iconos[i].fn(ix, iconoY, iconoTam);

    fill(205, 225, 240);
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, 11 * escala));
    const textoY1 = iconoY + iconoTam * 0.65 + 16 * escala;
    const textoY2 = textoY1 + Math.max(12, 16 * escala);
    text(iconos[i].l1, ix, textoY1);
    text(iconos[i].l2, ix, textoY2);
  }

  // Controles
  const ctrlY = panelY + 300 * escala;
  const ctrlW = Math.min(panelW - 50, 840 * escala);
  const ctrlX = panelX + (panelW - ctrlW) / 2;
  const ctrlH = Math.max(150, 205 * escala);

  fill(16, 36, 52, 240);
  noStroke();
  rect(ctrlX, ctrlY, ctrlW, ctrlH, 12 * escala);
  stroke(70, 105, 145, 140);
  strokeWeight(1.2);
  rect(ctrlX, ctrlY, ctrlW, ctrlH, 12 * escala);
  noStroke();

  fill(210, 175, 95);
  textAlign(CENTER, CENTER);
  textSize(Math.max(9, 13 * escala));
  text("— CONTROLES BÁSICOS —", ctrlX + ctrlW / 2, ctrlY + 22 * escala);

  stroke(80, 115, 150, 70);
  strokeWeight(1);
  line(
    ctrlX + 30,
    ctrlY + 36 * escala,
    ctrlX + ctrlW - 30,
    ctrlY + 36 * escala,
  );
  noStroke();

  const controles = [
    ["WASD", "Moverse por el mapa"],
    ["L", "Abrir enciclopedia"],
    ["F", "Lanzar / Recoger caña"],
    ["I", "Abrir la mochila"],
    ["MOUSE", "Girar cámara (clic)"],
    ["E", "Tienda / Vender"],
  ];

  const colW = ctrlW / 2;
  const filaH = Math.max(26, 46 * escala);
  const tamTecla = Math.max(8.5, 11.5 * escala);
  const tamAccion = Math.max(8.5, 11.5 * escala);

  for (let i = 0; i < controles.length; i++) {
    const col = i % 2;
    const fila = Math.floor(i / 2);
    const centroColX = ctrlX + col * colW + colW / 2;
    const ky = ctrlY + 62 * escala + fila * filaH;

    const textoTecla = controles[i][0];
    const textoAccion = controles[i][1];

    textSize(tamTecla);
    const anchoTextoTecla = textWidth(textoTecla);
    const padBotonX = 12 * escala;
    const anchoBoton = anchoTextoTecla + padBotonX * 2;
    const altoBoton = Math.max(20, 26 * escala);

    textSize(tamAccion);
    const anchoAccion = textWidth(textoAccion);
    const gap = 14 * escala;
    const anchoTotal = anchoBoton + gap + anchoAccion;

    const inicioX = centroColX - anchoTotal / 2;
    const botonX = inicioX;
    const botonY = ky - altoBoton / 2;

    fill(28, 52, 75);
    stroke(215, 175, 95);
    strokeWeight(1.2);
    rect(botonX, botonY, anchoBoton, altoBoton, 4 * escala);
    noStroke();

    fill(255, 230, 140);
    textAlign(CENTER, CENTER);
    textSize(tamTecla);
    text(textoTecla, botonX + anchoBoton / 2, ky + 0.5);

    fill(215, 230, 240);
    textAlign(LEFT, CENTER);
    textSize(tamAccion);
    text(textoAccion, botonX + anchoBoton + gap, ky);
  }

  // Pie y mensaje de inicio
  const tyBase = panelY + panelH - 36 * escala;

  stroke(70, 100, 130, 100);
  strokeWeight(1);
  line(
    panelX + 40,
    tyBase - 22 * escala,
    panelX + panelW - 40,
    tyBase - 22 * escala,
  );
  noStroke();

  const parpadeoBrillo = (sin(BIENVENIDA._parpadeo * 3.2) + 1) / 2;
  const alphaParpadeo = Math.floor(map(parpadeoBrillo, 0, 1, 95, 255));
  fill(250, 225, 145, alphaParpadeo);
  textAlign(CENTER, CENTER);
  textSize(Math.max(9.5, 13.5 * escala));

  const flotacion = sin(BIENVENIDA._animacion * 1.4) * 2 * escala;
  text(
    "Presioná cualquier tecla o hacé clic para comenzar",
    panelX + panelW / 2,
    tyBase + flotacion,
  );

  drawingContext.globalAlpha = 1;
  pop();
}

// Cierre y consulta de estado
function cerrarBienvenida() {
  if (!BIENVENIDA.activa || BIENVENIDA._saliendo) return;
  BIENVENIDA._saliendo = true;
  BIENVENIDA._timerSalida = BIENVENIDA.DURACION_SALIDA;
}

function bienvenidaActiva() {
  return BIENVENIDA.activa || BIENVENIDA._saliendo;
}
