// Minijuegos de captura, uno por nivel de rareza del pez.

class MinijuegoPesca {
  constructor(pez) {
    this.pez = pez;
    this.tiempo = 0;
    this.botonPresionado = false;
    this.resultado = null; // capturado | linea_rota | pez_escapado
  }

  presionarBoton() {
    this.botonPresionado = true;
  }

  soltarBoton() {
    this.botonPresionado = false;
  }

  actualizar(dt) {}

  dibujar() {}

  _terminar(tipo) {
    this.resultado = tipo;
  }
}

// Barras laterales compartidas por los minijuegos.
function dibujarBarrasPesca(progreso, tension) {
  const barAlto = height * 0.4;
  const barY = height * 0.28;

  const progX = width * 0.04;
  fill(16, 17, 20);
  rect(progX, barY, 24, barAlto, 5);
  const progH = barAlto * (progreso / 100);
  fill(55, 140, 255);
  rect(progX + 2, barY + barAlto - progH, 20, progH, 4);
  fill(180, 215, 255);
  textAlign(CENTER, CENTER);
  textSize(11);
  text(`${floor(progreso)}%`, progX + 12, barY - 14);
  text("PESCA", progX + 12, barY + barAlto + 14);

  const tensX = width * 0.09;
  fill(16, 17, 20);
  rect(tensX, barY, 24, barAlto, 5);
  const tensH = barAlto * (tension / 100);
  let cTens;
  if (tension < 40) cTens = color(50, 200, 50);
  else if (tension < 70) cTens = color(255, 200, 40);
  else cTens = color(255, 50, 50);
  fill(cTens);
  rect(tensX + 2, barY + barAlto - tensH, 20, tensH, 4);
  fill(cTens);
  textAlign(CENTER, CENTER);
  textSize(11);
  text(`${floor(tension)}%`, tensX + 12, barY - 14);
  text("TENSIÓN", tensX + 12, barY + barAlto + 14);
}

const ANGULO_VERDE = 18; // grados del canal donde se gana progreso
const ANGULO_LIMITE = 80; // grados donde la aguja toca el tope

// Peces poco comunes: mantener la aguja centrada venciendo los tirones del pez.
class MinijuegoBrújula extends MinijuegoPesca {
  constructor(pez) {
    super(pez);
    this.progreso = 0;
    this.tension = 20;
    this.angulo = 0; // desviacion de la aguja en grados
    this.velocidadAngular = 0;
    this.torqueJugador = 320;
    this.friccion = 0.955;
    this.timerTiron = random(1.4, 2.6) / this.pez.velocidad;
    this.frenando = false;
    this.feedback = "";
    this.tiempoFeedback = 0;
    this.screenShakeLocal = 0;
  }

  presionarBoton() {
    this.frenando = true;
  }

  soltarBoton() {
    this.frenando = false;
  }

  actualizar(dt) {
    this.tiempo += dt;
    if (this.tiempoFeedback > 0) this.tiempoFeedback -= dt;
    if (this.screenShakeLocal > 0)
      this.screenShakeLocal = max(0, this.screenShakeLocal - dt * 3);

    // Tiron imprevisto del pez que desvia la aguja de golpe
    this.timerTiron -= dt;
    if (this.timerTiron <= 0) {
      const signo = random() < 0.5 ? -1 : 1;
      const impulso = random(85, 135) * this.pez.velocidad * signo;
      this.velocidadAngular += impulso;
      this.timerTiron = random(1.4, 2.6) / this.pez.velocidad;
      this.feedback = signo > 0 ? "¡Tirón a la derecha!" : "¡Tirón a la izquierda!";
      this.tiempoFeedback = 0.5;
      this.screenShakeLocal = 0.6;
    }

    // Correccion del jugador con A/D o flechas
    let control = 0;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) control -= 1;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) control += 1;
    this.velocidadAngular += control * this.torqueJugador * dt;

    if (this.frenando) this.velocidadAngular *= 0.9;

    this.velocidadAngular *= this.friccion;
    this.angulo = constrain(
      this.angulo + this.velocidadAngular * dt,
      -ANGULO_LIMITE,
      ANGULO_LIMITE,
    );

    const enCanal = abs(this.angulo) <= ANGULO_VERDE;
    const desvio = abs(this.angulo) / ANGULO_LIMITE;

    // Dentro del canal una leve fuerza reciente al centro premia la punteria
    if (enCanal) this.velocidadAngular -= this.angulo * 2.5 * dt;

    if (abs(this.angulo) >= ANGULO_LIMITE) {
      this.velocidadAngular = 0;
      this.feedback = "¡Al límite!";
      this.tiempoFeedback = 0.5;
    }

    if (enCanal) {
      this.progreso = constrain(this.progreso + 11 * dt, 0, 100);
      this.tension = constrain(this.tension - 7 * dt, 0, 100);
    } else {
      this.tension = constrain(this.tension + (4 + desvio * 14) * dt, 0, 100);
    }

    if (this.progreso >= 100) this._terminar("capturado");
    else if (this.tension >= 100) this._terminar("linea_rota");
  }

  dibujar() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.5;
    const radio = Math.min(width, height) * 0.26;

    fill(255, 220, 100);
    textAlign(CENTER, TOP);
    textSize(20);
    text(this.pez.nombre, cx, height * 0.06);

    // Marcas del medidor
    stroke(90, 100, 115);
    strokeWeight(2);
    for (let g = -ANGULO_LIMITE; g <= ANGULO_LIMITE; g += 20) {
      const a = -HALF_PI + radians(g);
      line(
        cx + cos(a) * (radio - 6),
        cy + sin(a) * (radio - 6),
        cx + cos(a) * (radio + 6),
        cy + sin(a) * (radio + 6),
      );
    }

    // Canal verde central donde sube el progreso
    noFill();
    stroke(70, 230, 110, 200);
    strokeWeight(14);
    arc(
      cx,
      cy,
      radio * 2,
      radio * 2,
      -HALF_PI - radians(ANGULO_VERDE),
      -HALF_PI + radians(ANGULO_VERDE),
    );

    noFill();
    stroke(60, 66, 78);
    strokeWeight(4);
    circle(cx, cy, radio * 2);

    // Aguja que el jugador corrige
    const enCanal = abs(this.angulo) <= ANGULO_VERDE;
    const a = -HALF_PI + radians(this.angulo);
    const px = cx + cos(a) * (radio - 12);
    const py = cy + sin(a) * (radio - 12);
    stroke(enCanal ? color(80, 240, 120) : color(255, 80, 70));
    strokeWeight(6);
    line(cx, cy, px, py);

    // Pez tirando de la aguja
    noStroke();
    fill(255, 215, 50);
    ellipse(px, py, 22, 15);
    fill(255, 175, 20);
    triangle(px + 13, py, px + 24, py - 7, px + 24, py + 7);

    fill(230);
    noStroke();
    circle(cx, cy, 14);

    dibujarBarrasPesca(this.progreso, this.tension);

    fill(190, 200, 215);
    textSize(13);
    text(
      "[A/D o ←/→] centrá la aguja — [SPACE] frena",
      cx,
      height * 0.86,
    );

    if (this.tiempoFeedback > 0 && this.feedback) {
      fill(0, 0, 0, 140);
      rect(width / 2 - 140, height * 0.15, 280, 36, 8);
      fill(255, 190, 120);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(this.feedback, width / 2, height * 0.15 + 18);
    }

    textAlign(LEFT, BASELINE);
  }
}

const UMBRAL_TEMPRANO = 0.55; // antes de esto el pulso no cuenta
const UMBRAL_PERFECTO = 0.85;

// Peces comunes: un anillo que se encoge, pulso en el momento exacto.
class MinijuegoAnillo extends MinijuegoPesca {
  constructor(pez, opciones) {
    super(pez);
    this.cicloMaximo = (opciones && opciones.ciclos) || 3;
    this.objetivo = (opciones && opciones.objetivo) || 60;
    this.exigirPerfecto = (opciones && opciones.exigirPerfecto) || false;
    this.ciclo = 1;
    this.progreso = 0;
    this.fase = "preparando";
    this.tiempoFase = 0;
    this.estadoPulso = false; // evita contar dos pulsos del mismo clic
    this.radio = 0;
    this.radioInicial = Math.min(width, height) * 0.26;
    this.radioNucleo = 14;
    this.duracionEncogido = Math.max(1.4, 2.2 - (this.pez.velocidad - 1) * 0.4);
    this.feedback = "";
    this.radioFinal = 0;
  }

  presionarBoton() {
    if (this.fase !== "encogiendo" || this.estadoPulso) return;

    this.estadoPulso = true;
    const avance = min(1, this.tiempoFase / this.duracionEncogido);
    if (avance < UMBRAL_TEMPRANO) {
      this.feedback = "¡Muy temprano!";
      this.estadoPulso = false; // deja reintentar en el mismo ciclo
      return;
    }

    const perfecto = avance >= UMBRAL_PERFECTO;
    if (this.exigirPerfecto && !perfecto) {
      this.feedback = "¡Casi! Necesita exacto";
      this.estadoPulso = false;
      return;
    }

    this.progreso = constrain(
      this.progreso + (perfecto ? 50 : 25),
      0,
      this.objetivo,
    );
    this.feedback = perfecto ? "¡PERFECTO!" : "¡Bien!";
    this.radioFinal = this.radio;
    this.fase = "mostrando";
    this.tiempoFase = 0;
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.tiempoFase += dt;

    if (this.fase === "preparando") {
      this.radio = this.radioInicial;
      if (this.tiempoFase >= 0.55) {
        this.fase = "encogiendo";
        this.tiempoFase = 0;
      }
    } else if (this.fase === "encogiendo") {
      const avance = min(1, this.tiempoFase / this.duracionEncogido);
      this.radio = lerp(this.radioInicial, this.radioNucleo, avance);
      if (avance >= 1) {
        this.feedback = "Se fue el momento...";
        this.radioFinal = this.radio;
        this.fase = "mostrando";
        this.tiempoFase = 0;
      }
    } else if (this.fase === "mostrando") {
      if (this.tiempoFase >= 0.85) this._siguienteCiclo();
    }
  }

  _siguienteCiclo() {
    if (this.ciclo >= this.cicloMaximo) {
      // sin el puntaje minimo el pez se suelta de la linea
      this._terminar(
        this.progreso >= this.objetivo ? "capturado" : "pez_escapado",
      );
      return;
    }
    this.ciclo++;
    this.fase = "preparando";
    this.tiempoFase = 0;
    this.estadoPulso = false;
    this.feedback = "";
  }

  dibujar() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.4;

    fill(255, 220, 100);
    textAlign(CENTER, TOP);
    textSize(20);
    text(this.pez.nombre, cx, height * 0.08);
    fill(170, 190, 215);
    textSize(13);
    text(`Ciclo ${this.ciclo}/${this.cicloMaximo}`, cx, height * 0.15);

    // Nucleo fijo al que debe llegar el anillo
    noStroke();
    fill(245, 245, 245);
    ellipse(cx, cy, this.radioNucleo * 2.4, this.radioNucleo * 2.4);
    fill(255, 210, 60);
    ellipse(cx, cy, this.radioNucleo * 1.4, this.radioNucleo * 1.4);

    // El color del anillo avisa cuando hay que pulsar
    let radioMuestreo = this.radio;
    if (this.fase === "mostrando") radioMuestreo = this.radioFinal;

    let colorAnillo = color(150, 156, 166);
    if (this.fase === "encogiendo") {
      const avance = min(1, this.tiempoFase / this.duracionEncogido);
      if (avance >= UMBRAL_PERFECTO) colorAnillo = color(255, 220, 60);
      else if (avance >= UMBRAL_TEMPRANO) colorAnillo = color(70, 230, 120);
      else colorAnillo = color(255, 255, 255);
    }

    noFill();
    stroke(colorAnillo);
    strokeWeight(5);
    ellipse(cx, cy, radioMuestreo * 2, radioMuestreo * 2);

    fill(190, 200, 215);
    textSize(13);
    text("[CLIC / ESPACIO] cuando llegue al centro", cx, height * 0.72);

    // Barra de progreso de la captura
    const anchoBarra = 220;
    fill(16, 17, 20);
    rect(cx - anchoBarra / 2 - 2, height * 0.86, anchoBarra + 4, 16, 8);
    const lleno = map(this.progreso, 0, this.objetivo, 0, anchoBarra);
    fill(60, 200, 110);
    rect(cx - anchoBarra / 2, height * 0.86 + 2, lleno, 12, 6);
    fill(210, 225, 240);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(`${floor(this.progreso)}/${this.objetivo}`, cx, height * 0.86 + 8);

    if (this.feedback) {
      fill(0, 0, 0, 140);
      rect(cx - 140, cy - 95, 280, 40, 8);
      let colorTexto = color(255);
      if (this.feedback === "¡PERFECTO!") colorTexto = color(255, 220, 40);
      else if (this.feedback === "¡Bien!") colorTexto = color(80, 255, 100);
      else colorTexto = color(230, 160, 110);
      fill(colorTexto);
      textSize(
        this.feedback === "¡PERFECTO!" ||
          this.feedback === "¡Casi! Necesita exacto"
          ? 20
          : 16,
      );
      text(this.feedback, cx, cy - 75);
    }

    textAlign(LEFT, BASELINE);
  }
}

const VENTANA_ACIERTO_RITMO = 0.28; // segundos de tolerancia para golpear una nota

// Peces raros: las notas llegan tipo Guitar Hero y hay que golpearlas al compas.
class MinijuegoRitmo extends MinijuegoPesca {
  constructor(pez, opciones) {
    super(pez);
    this.objetivo = 100;
    this.cantidadNotas = (opciones && opciones.notas) || 12;
    this.intervalo =
      (opciones && opciones.intervaloBase) ||
      Math.max(0.42, 1.9 / this.pez.velocidad);
    this.tension = 25;
    this.progreso = 0;
    this.velocidadPista = 110 + this.pez.velocidad * 25;
    this.ultimoPulso = -1;
    this.feedback = "";
    this.tiempoFeedback = 0;
    this.golpes = []; // animaciones de acierto
    this.notas = this._generarNotas();
  }

  _generarNotas() {
    const notas = [];
    let t = 1.2;
    for (let i = 0; i < this.cantidadNotas; i++) {
      notas.push({ tiempo: t, golpeada: false, fallada: false });
      t += this.intervalo + random(-0.05, 0.05);
    }
    return notas;
  }

  _xNota(tiempo) {
    return this.lineaX + (tiempo - this.tiempo) * this.velocidadPista;
  }

  presionarBoton() {
    if (this.tiempo - this.ultimoPulso < 0.045) return; // ignora el doble bind
    this.ultimoPulso = this.tiempo;

    let mejor = null;
    let mejorDelta = Infinity;
    for (const nota of this.notas) {
      if (nota.golpeada) continue;
      const delta = abs(nota.tiempo - this.tiempo);
      if (delta < mejorDelta) {
        mejorDelta = delta;
        mejor = nota;
      }
    }

    if (!mejor || mejorDelta > VENTANA_ACIERTO_RITMO) {
      this.tension = constrain(this.tension + 3, 0, 100); // pulso al aire
      this.feedback = "¡Al aire!";
      this.tiempoFeedback = 0.4;
      return;
    }

    mejor.golpeada = true;
    this.golpes.push({ tiempo: mejor.tiempo, t: 0 });

    if (mejorDelta <= 0.08) {
      this.progreso = constrain(this.progreso + 12, 0, this.objetivo);
      this.tension = constrain(this.tension - 5, 0, 100);
      this.feedback = "¡PERFECTO!";
    } else if (mejorDelta <= 0.16) {
      this.progreso = constrain(this.progreso + 8, 0, this.objetivo);
      this.tension = constrain(this.tension - 2, 0, 100);
      this.feedback = "¡BIEN!";
    } else {
      this.progreso = constrain(this.progreso + 3, 0, this.objetivo);
      this.feedback = "Casi";
    }
    this.tiempoFeedback = 0.4;
  }

  actualizar(dt) {
    this.tiempo += dt;
    if (this.tiempoFeedback > 0) this.tiempoFeedback -= dt;
    for (const golpe of this.golpes) golpe.t += dt;
    this.golpes = this.golpes.filter((g) => g.t < 0.35);

    // Nota que cruza la linea sin ser golpeada
    for (const nota of this.notas) {
      if (!nota.golpeada && this.tiempo - nota.tiempo > VENTANA_ACIERTO_RITMO) {
        nota.golpeada = true;
        nota.fallada = true;
        this.tension = constrain(this.tension + 7, 0, 100);
        this.feedback = "Se escapó";
        this.tiempoFeedback = 0.4;
      }
    }

    if (this.notas.every((n) => n.golpeada)) {
      this._terminar(
        this.progreso >= this.objetivo ? "capturado" : "pez_escapado",
      );
      return;
    }
    if (this.tension >= 100) this._terminar("linea_rota");
  }

  dibujar() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    this.lineaX = width * 0.22;
    this.pistaY = height * 0.55;

    fill(255, 220, 100);
    textAlign(CENTER, TOP);
    textSize(20);
    text(this.pez.nombre, width / 2, height * 0.06);

    // Pista por la que viajan las notas
    fill(16, 17, 20);
    rect(this.lineaX, this.pistaY - 16, width - this.lineaX - 40, 32, 8);

    // Linea de golpe pulsante
    const pulso = (sin(this.tiempo * 10) + 1) / 2;
    stroke(255, 255, 255, 150 + pulso * 105);
    strokeWeight(4);
    line(this.lineaX, this.pistaY - 22, this.lineaX, this.pistaY + 22);
    stroke(255, 255, 255, 60);
    strokeWeight(1);
    line(this.lineaX + 24, this.pistaY - 20, this.lineaX + 24, this.pistaY + 20);

    for (const nota of this.notas) {
      if (nota.golpeada && nota.fallada) continue;
      const x = this._xNota(nota.tiempo);
      if (x > width - 20 || x < this.lineaX - 50) continue;
      const delta = abs(nota.tiempo - this.tiempo);
      const activa = delta <= VENTANA_ACIERTO_RITMO;
      noStroke();
      fill(activa ? color(120, 220, 255) : color(255, 200, 80));
      if (activa) {
        stroke(255, 255, 255, 200);
        strokeWeight(2);
      }
      ellipse(x, this.pistaY, 26, 26);
      noStroke();
      fill(activa ? color(200, 245, 255) : color(255, 235, 160));
      ellipse(x, this.pistaY, 12, 12);
    }

    // Anillos de acierto
    for (const golpe of this.golpes) {
      const x = this._xNota(golpe.tiempo);
      noFill();
      stroke(255, 230, 90, 255 * (1 - golpe.t / 0.35));
      strokeWeight(3);
      ellipse(x, this.pistaY, 26 + golpe.t * 160, 26 + golpe.t * 160);
    }

    dibujarBarrasPesca(this.progreso, this.tension);

    fill(190, 200, 215);
    textSize(13);
    text("[CLIC / ESPACIO] con las notas", width / 2, height * 0.8);

    if (this.tiempoFeedback > 0 && this.feedback) {
      fill(0, 0, 0, 140);
      rect(width / 2 - 120, height * 0.14, 240, 36, 8);
      let colorTexto = color(255);
      if (this.feedback === "¡PERFECTO!") colorTexto = color(255, 220, 40);
      else if (this.feedback === "¡BIEN!") colorTexto = color(80, 255, 100);
      else colorTexto = color(230, 160, 110);
      fill(colorTexto);
      textAlign(CENTER, CENTER);
      textSize(17);
      text(this.feedback, width / 2, height * 0.14 + 18);
    }

    textAlign(LEFT, BASELINE);
  }
}

// Peces epicos: esquivar objetos que caen en la arena mientras sube el progreso.
class MinijuegoEsquiva extends MinijuegoPesca {
  constructor(pez, opciones) {
    super(pez);
    this.progresoPorSegundo = (opciones && opciones.progresoPorSegundo) || 9;
    this.intervaloSpawn = (opciones && opciones.intervaloSpawn) || 0.85;
    this.progreso = 0;
    this.tension = 20;
    this.radioJugador = 12;
    this.jugX = width / 2;
    this.jugY = height / 2;
    this.arenaX = width * 0.28;
    this.arenaW = width * 0.44;
    this.arenaY = height * 0.2;
    this.arenaH = height * 0.56;
    this.obstaculos = [];
    this.timerSpawn = this.intervaloSpawn;
    this.flash = 0;
    this.feedback = "";
    this.tiempoFeedback = 0;
  }

  _crearObstaculo() {
    const cx = this.arenaX + this.arenaW / 2;
    const cy = this.arenaY + this.arenaH / 2;
    const borde = floor(random(4));
    let x, y;
    if (borde === 0) {
      x = random(this.arenaX, this.arenaX + this.arenaW);
      y = this.arenaY;
    } else if (borde === 2) {
      x = random(this.arenaX, this.arenaX + this.arenaW);
      y = this.arenaY + this.arenaH;
    } else if (borde === 1) {
      x = this.arenaX + this.arenaW;
      y = random(this.arenaY, this.arenaY + this.arenaH);
    } else {
      x = this.arenaX;
      y = random(this.arenaY, this.arenaY + this.arenaH);
    }

    let dirX = cx - x;
    let dirY = cy - y;
    const norma = Math.sqrt(dirX * dirX + dirY * dirY);
    dirX /= norma;
    dirY /= norma;

    const creceConTiempo = lerp(1, 1.7, constrain(this.tiempo / 18, 0, 1));
    const vel = (60 + this.pez.velocidad * 28) * creceConTiempo;
    this.obstaculos.push({
      x,
      y,
      vx: dirX * vel + random(-22, 22),
      vy: dirY * vel + random(-22, 22),
      radio: random(8, 15),
      edad: 0,
    });
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.progreso = constrain(
      this.progreso + this.progresoPorSegundo * dt,
      0,
      100,
    );
    if (this.flash > 0) this.flash = max(0, this.flash - dt * 2);
    if (this.tiempoFeedback > 0) this.tiempoFeedback -= dt;

    // Movimiento del pez con teclado dentro de la arena
    let dx = 0;
    let dy = 0;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) dy -= 1;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) dy += 1;
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) dx -= 1;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) dx += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    const velocidadMov = 340;
    this.jugX = constrain(
      this.jugX + dx * velocidadMov * dt,
      this.arenaX + this.radioJugador,
      this.arenaX + this.arenaW - this.radioJugador,
    );
    this.jugY = constrain(
      this.jugY + dy * velocidadMov * dt,
      this.arenaY + this.radioJugador,
      this.arenaY + this.arenaH - this.radioJugador,
    );

    // Aparicion progresiva de obstaculos segun la dificultad del pez
    this.timerSpawn -= dt;
    if (this.timerSpawn <= 0) {
      const denso = lerp(1, 0.4, constrain(this.tiempo / 18, 0, 1));
      this.timerSpawn = Math.max(0.3, this.intervaloSpawn * denso);
      this._crearObstaculo();
    }

    for (const obs of this.obstaculos) {
      obs.edad += dt;
      obs.x += obs.vx * dt;
      obs.y += obs.vy * dt;
    }

    // Choques: golpear => tension; fuera de la arena se descartan
    this.obstaculos = this.obstaculos.filter((obs) => {
      const fuera =
        obs.x < this.arenaX - 60 ||
        obs.x > this.arenaX + this.arenaW + 60 ||
        obs.y < this.arenaY - 60 ||
        obs.y > this.arenaY + this.arenaH + 60;
      if (fuera) return false;
      const d = dist(this.jugX, this.jugY, obs.x, obs.y);
      if (d < this.radioJugador + obs.radio) {
        this.tension = constrain(this.tension + 6, 0, 100);
        this.flash = 1;
        this.feedback = "¡Golpe!";
        this.tiempoFeedback = 0.4;
        return false;
      }
      if (obs.edad > 9) return false;
      return true;
    });

    if (this.progreso >= 100) this._terminar("capturado");
    else if (this.tension >= 100) this._terminar("linea_rota");
  }

  dibujar() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    fill(255, 220, 100);
    textAlign(CENTER, TOP);
    textSize(20);
    text(this.pez.nombre, width / 2, height * 0.06);

    // Arena de esquiva con borde
    stroke(255, 255, 255, 120);
    strokeWeight(3);
    noFill();
    rect(
      this.arenaX - 8,
      this.arenaY - 8,
      this.arenaW + 16,
      this.arenaH + 16,
      8,
    );
    noStroke();

    for (const obs of this.obstaculos) {
      fill(obs.edad % 3 === 0 ? 120 : 140, 110, 95);
      noStroke();
      ellipse(obs.x, obs.y, obs.radio * 2, obs.radio * 2);
      fill(90, 80, 70);
      ellipse(
        obs.x - obs.radio * 0.2,
        obs.y - obs.radio * 0.2,
        obs.radio * 0.5,
        obs.radio * 0.5,
      );
    }

    // El pez controlable
    fill(255, 215, 50);
    noStroke();
    ellipse(this.jugX, this.jugY, 28, 20);
    fill(255, 175, 20);
    triangle(
      this.jugX + 14,
      this.jugY,
      this.jugX + 26,
      this.jugY - 9,
      this.jugX + 26,
      this.jugY + 9,
    );
    fill(25, 25, 25);
    circle(this.jugX - 7, this.jugY - 2, 6);
    fill(255);
    circle(this.jugX - 8, this.jugY - 3, 3);

    dibujarBarrasPesca(this.progreso, this.tension);

    if (this.flash > 0) {
      fill(255, 40, 40, this.flash * 70);
      noStroke();
      rect(0, 0, width, height);
    }

    fill(190, 200, 215);
    textSize(13);
    text("[WASD / FLECHAS] esquivá", width / 2, height * 0.86);

    if (this.tiempoFeedback > 0 && this.feedback) {
      fill(0, 0, 0, 140);
      rect(width / 2 - 120, height * 0.14, 240, 36, 8);
      fill(255, 120, 100);
      textAlign(CENTER, CENTER);
      textSize(17);
      text(this.feedback, width / 2, height * 0.14 + 18);
    }

    textAlign(LEFT, BASELINE);
  }
}

// Peces legendarios: cadena de fases cortas que terminan en un golpe perfecto.
class MinijuegoMultietapa extends MinijuegoPesca {
  constructor(pez) {
    super(pez);
    this.fases = [
      {
        mini: new MinijuegoAnillo(pez, { ciclos: 1, objetivo: 50 }),
        titulo: "1/4 — Acechando",
      },
      {
        mini: new MinijuegoRitmo(pez, { notas: 6, intervaloBase: 0.8 }),
        titulo: "2/4 — Frenando",
      },
      {
        mini: new MinijuegoEsquiva(pez, {
          progresoPorSegundo: 14,
          intervaloSpawn: 0.7,
        }),
        titulo: "3/4 — Torbellino",
      },
      {
        mini: new MinijuegoAnillo(pez, {
          ciclos: 1,
          objetivo: 50,
          exigirPerfecto: true,
        }),
        titulo: "4/4 — ¡EL MOMENTO!",
      },
    ];
    this.indice = 0;
    this.actual = this.fases[0];
    this.tiempoTitulo = 0;
  }

  presionarBoton() {
    this.actual.mini.presionarBoton();
  }

  soltarBoton() {
    this.actual.mini.soltarBoton();
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.tiempoTitulo += dt;
    this.actual.mini.actualizar(dt);

    if (this.actual.mini.resultado) {
      const resultado = this.actual.mini.resultado;
      if (resultado === "capturado" && this.indice < this.fases.length - 1) {
        this.indice++;
        this.actual = this.fases[this.indice];
        this.tiempoTitulo = 0;
      } else {
        // cualquier fallo corta la cacería
        this._terminar(resultado);
      }
    }
  }

  dibujar() {
    this.actual.mini.dibujar();

    // Cartel de transicion para dramatizar el cambio de fase
    if (this.tiempoTitulo < 1.1) {
      const alpha = map(this.tiempoTitulo, 0, 1.1, 235, 60);
      fill(10, 12, 16, alpha);
      noStroke();
      rect(0, 0, width, height);
      fill(255, 235, 120);
      textAlign(CENTER, CENTER);
      textSize(34);
      text(this.actual.titulo, width / 2, height / 2);
    }

    textAlign(LEFT, BASELINE);
  }
}