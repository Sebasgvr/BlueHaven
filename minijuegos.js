class MinijuegoPesca {
  constructor(pez) {
    this.pez = pez;
    this.escala = (pez && pez.escalaDificultad) || 1;
    this.tiempo = 0;
    this.botonPresionado = false;
    this.resultado = null; // capturado o linea_rota o pez_escapado
    this.mecanicas = (pez && pez.mecanicasActivas) || [];
  }

  tieneMecanica(id) {
    return this.mecanicas.indexOf(id) !== -1;
  }

  presionarBoton() {
    this.botonPresionado = true;
  }

  soltarBoton() {
    this.botonPresionado = false;
  }

  soltarTecla(entrada) {}

  actualizar(dt) {}

  dibujar() {}

  aceptaTeclas() {
    return false;
  }

  _terminar(tipo) {
    this.resultado = tipo;
  }
}

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

const ANGULO_VERDE = 18;
const ANGULO_LIMITE = 80;

function dibujarSpritePez(pez) {
  if (!pez) return;

  const x = width - 62;
  const y = height * 0.02;
  const tam = 52;
  const calidad = calidadDe(pez);
  const imagen = pez.sprite && spritesPeces && spritesPeces[pez.sprite];

  noFill();
  stroke(
    calidad.color[0],
    calidad.color[1],
    calidad.color[2],
    calidad.id === "comun" ? 110 : 235,
  );
  strokeWeight(calidad.nivel >= 4 ? 4 : 2.5);
  rect(x - 3, y - 3, tam + 6, tam + 6, 9);
  noStroke();

  if (imagen) image(imagen, x, y, tam, tam);

  dibujarEtiquetaCalidad(calidad, width - 10, y + tam + 12, 9, "derecha");
}

class MinijuegoBrújula extends MinijuegoPesca {
  constructor(pez) {
    super(pez);
    this.progreso = 0;
    this.tension = 20;
    this.angulo = 0;
    this.velocidadAngular = 0;
    this.anguloVerde = Math.max(9, ANGULO_VERDE / Math.sqrt(this.escala));
    this.velocidadPez = Math.min(6, (this.pez.velocidad || 1) * this.escala);
    this.torqueJugador = 320 * (1 + (this.escala - 1) * 0.35);
    this.friccion = 0.955;
    this.timerTiron = Math.max(0.5, random(1.4, 2.6) / this.velocidadPez);
    this.frenando = false;
    this.feedback = "";
    this.tiempoFeedback = 0;
    this.screenShakeLocal = 0;

    this.mecanicaCanal = this.tieneMecanica("brujula_canal");
    this.mecanicaRafaga = this.tieneMecanica("brujula_rafaga");
    this.mecanicaNudo = this.tieneMecanica("brujula_nudo");
    this.centroCanal = 0;
    this.faseCanal = random(TWO_PI);
    this.amplitudCanal = 28;
    this.velocidadCanal = 0.45 + (this.escala - 1) * 0.25;
    this.timerRafaga = random(2.5, 4.5);
    this.avisoRafaga = 0;
    this.signoRafaga = 1;
    this.timerNudo = random(3.5, 5.5);
    this.nudoActivo = false;
    this.nudoAgarrado = false;
  }

  presionarBoton() {
    if (this.nudoActivo && !this.nudoAgarrado) {
      this.nudoAgarrado = true;
      this.frenando = true;
      this.feedback = "¡Ahora soltá!";
      this.tiempoFeedback = 0.6;
      return;
    }
    this.frenando = true;
  }

  soltarBoton() {
    if (this.nudoActivo && this.nudoAgarrado) {
      this.nudoActivo = false;
      this.nudoAgarrado = false;
      this.frenando = false;
      this.progreso = constrain(this.progreso + 10, 0, 100);
      this.tension = constrain(this.tension - 8, 0, 100);
      this.feedback = "¡Nudo deshecho!";
      this.tiempoFeedback = 0.7;
      this.timerNudo = random(4, 6);
      return;
    }
    this.frenando = false;
  }

  actualizar(dt) {
    this.tiempo += dt;
    if (this.tiempoFeedback > 0) this.tiempoFeedback -= dt;
    if (this.screenShakeLocal > 0)
      this.screenShakeLocal = max(0, this.screenShakeLocal - dt * 3);

    if (this.mecanicaCanal) {
      this.faseCanal += dt * this.velocidadCanal;
      this.centroCanal = sin(this.faseCanal) * this.amplitudCanal;
    }

    this.timerTiron -= dt;
    if (this.timerTiron <= 0) {
      const signo = random() < 0.5 ? -1 : 1;
      const impulso =
        Math.min(900, random(85, 135) * this.velocidadPez) * signo;
      this.velocidadAngular += impulso;
      this.timerTiron = Math.max(0.5, random(1.4, 2.6) / this.velocidadPez);
      this.feedback =
        signo > 0 ? "¡Tirón a la derecha!" : "¡Tirón a la izquierda!";
      this.tiempoFeedback = 0.5;
      this.screenShakeLocal = 0.6;
    }

    if (this.mecanicaRafaga) {
      if (this.avisoRafaga > 0) {
        this.avisoRafaga -= dt;
        if (this.avisoRafaga <= 0) {
          this.velocidadAngular +=
            Math.min(1000, random(150, 220) * this.velocidadPez) *
            this.signoRafaga;
          this.feedback = "¡RÁFAGA!";
          this.tiempoFeedback = 0.5;
          this.screenShakeLocal = 0.8;
          this.timerRafaga = random(3.5, 6);
        }
      } else {
        this.timerRafaga -= dt;
        if (this.timerRafaga <= 0) {
          this.signoRafaga = random() < 0.5 ? -1 : 1;
          this.avisoRafaga = 0.7;
          this.feedback =
            this.signoRafaga > 0
              ? "¡Ráfaga a la derecha!"
              : "¡Ráfaga a la izquierda!";
          this.tiempoFeedback = 0.7;
        }
      }
    }

    if (this.mecanicaNudo) {
      if (this.nudoActivo) {
        this.timerNudo -= dt;
        if (this.nudoAgarrado) {
          this.tension = constrain(this.tension + 8 * dt, 0, 100);
        }
        if (this.timerNudo <= 0) {
          this.nudoActivo = false;
          this.nudoAgarrado = false;
          this.tension = constrain(this.tension + 12, 0, 100);
          this.feedback = "¡Se apretó!";
          this.tiempoFeedback = 0.6;
          this.timerNudo = random(4, 6);
        }
      } else {
        this.timerNudo -= dt;
        if (this.timerNudo <= 0) {
          this.nudoActivo = true;
          this.nudoAgarrado = this.frenando;
          this.timerNudo = 2.8;
          this.feedback = this.nudoAgarrado
            ? "¡Soltá el botón!"
            : "¡NUDO! [SPACE] agarrá";
          this.tiempoFeedback = 0.8;
        }
      }
    }

    let control = 0;
    if (teclaJuegoPresionada(LEFT_ARROW) || teclaJuegoPresionada(65)) control -= 1;
    if (teclaJuegoPresionada(RIGHT_ARROW) || teclaJuegoPresionada(68)) control += 1;
    control=constrain(control+(window.ControlTactil?.analogico.x||0),-1,1);
    this.velocidadAngular += control * this.torqueJugador * dt;

    if (this.frenando) this.velocidadAngular *= 0.9;

    this.velocidadAngular *= this.friccion;
    this.angulo = constrain(
      this.angulo + this.velocidadAngular * dt,
      -ANGULO_LIMITE,
      ANGULO_LIMITE,
    );

    const enCanal = abs(this.angulo - this.centroCanal) <= this.anguloVerde;
    const desvio = abs(this.angulo) / ANGULO_LIMITE;

    if (enCanal)
      this.velocidadAngular -= (this.angulo - this.centroCanal) * 2.5 * dt;

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
    dibujarSpritePez(this.pez);

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

    noFill();
    stroke(70, 230, 110, 200);
    strokeWeight(14);
    arc(
      cx,
      cy,
      radio * 2,
      radio * 2,
      -HALF_PI + radians(this.centroCanal - this.anguloVerde),
      -HALF_PI + radians(this.centroCanal + this.anguloVerde),
    );

    noFill();
    stroke(60, 66, 78);
    strokeWeight(4);
    circle(cx, cy, radio * 2);

    const enCanal = abs(this.angulo - this.centroCanal) <= this.anguloVerde;
    const a = -HALF_PI + radians(this.angulo);
    const px = cx + cos(a) * (radio - 12);
    const py = cy + sin(a) * (radio - 12);
    stroke(enCanal ? color(80, 240, 120) : color(255, 80, 70));
    strokeWeight(6);
    line(cx, cy, px, py);

    noStroke();
    fill(255, 215, 50);
    ellipse(px, py, 22, 15);
    fill(255, 175, 20);
    triangle(px + 13, py, px + 24, py - 7, px + 24, py + 7);

    fill(230);
    noStroke();
    circle(cx, cy, 14);

    if (this.mecanicaRafaga && this.avisoRafaga > 0) {
      const pulso = (sin(this.tiempo * 18) + 1) / 2;
      fill(255, 80, 60, 150 + pulso * 100);
      textAlign(CENTER, CENTER);
      textSize(18);
      text(
        this.signoRafaga > 0 ? "¡RÁFAGA →!" : "¡← RÁFAGA!",
        cx,
        cy - radio + 38,
      );
    }

    if (this.mecanicaNudo && this.nudoActivo) {
      noFill();
      stroke(225, 170, 80);
      strokeWeight(3);
      ellipse(cx, cy + radio - 4, 24, 14);
      line(cx - 11, cy + radio - 4, cx + 11, cy + radio - 4);
      noStroke();
      fill(0, 0, 0, 155);
      rect(cx - 150, cy + radio + 12, 300, 30, 8);
      fill(this.nudoAgarrado ? color(255, 220, 80) : color(230, 190, 110));
      textAlign(CENTER, CENTER);
      textSize(14);
      text(
        this.nudoAgarrado ? "¡SOLTÁ AHORA!" : "¡NUDO! [SPACE] agarrá y soltá",
        cx,
        cy + radio + 27,
      );
    }

    dibujarBarrasPesca(this.progreso, this.tension);

    fill(190, 200, 215);
    textAlign(CENTER, TOP);
    textSize(13);
    text("[A/D o ←/→] centrá la aguja — [SPACE] frena", cx, height * 0.86);
    dibujarMecanicasActivas(this, height * 0.93);

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

const UMBRAL_TEMPRANO = 0.55;
const UMBRAL_PERFECTO = 0.85;

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
    this.estadoPulso = false; // Evita doble pulso por clic.
    this.radio = 0;
    this.radioInicial = Math.min(width, height) * 0.26;
    this.radioNucleo = Math.max(8, 14 / Math.sqrt(this.escala));
    this.duracionEncogido = Math.max(
      0.85,
      (2.2 - (this.pez.velocidad - 1) * 0.4) / this.escala,
    );
    this.umbralTemprano = Math.min(
      0.72,
      UMBRAL_TEMPRANO + (this.escala - 1) * 0.12,
    );
    this.umbralPerfecto = Math.min(
      0.96,
      UMBRAL_PERFECTO + (this.escala - 1) * 0.07,
    );
    this.feedback = "";
    this.radioFinal = 0;

    this.mecanicaDoble = this.tieneMecanica("anillo_doble");
    this.mecanicaFalso = this.tieneMecanica("anillo_falso");
    this.mecanicaZona = this.tieneMecanica("anillo_zona");
    this.pulsosPorCiclo = this.mecanicaDoble ? 2 : 1;
    this.pulsosEnCiclo = 0;
    this.pulsoValido = false;
    this.duracionActual = this.duracionEncogido;
    this.anilloFalsoActivo = false;
    this.falsoResuelto = false;
    this.anguloZona = random(TWO_PI);
    this.velocidadZona = 0;
    this._prepararCiclo();
  }

  _prepararCiclo() {
    this.fase = "preparando";
    this.tiempoFase = 0;
    this.estadoPulso = false;
    this.pulsosEnCiclo = 0;
    this.pulsoValido = false;
    this.duracionActual = this.duracionEncogido;
    this.radio = this.radioInicial;
    this.falsoResuelto = false;
    this.anilloFalsoActivo = this.mecanicaFalso && random() < 0.25;
    this.anguloZona = random(TWO_PI);
    this.velocidadZona = this.mecanicaZona
      ? random(1.1, 1.8) * (random() < 0.5 ? -1 : 1)
      : 0;
    this.feedback = this.anilloFalsoActivo ? "¡No toques el rojo!" : "";
  }

  _prepararPulso() {
    this.fase = "preparando";
    this.tiempoFase = 0;
    this.estadoPulso = false;
    this.pulsoValido = false;
    this.duracionActual = this.duracionEncogido * 0.82;
    this.radio = this.radioInicial;
    this.anilloFalsoActivo = false;
    this.falsoResuelto = false;
    this.anguloZona = random(TWO_PI);
    this.velocidadZona = this.mecanicaZona
      ? random(1.3, 2.1) * (random() < 0.5 ? -1 : 1)
      : 0;
    this.feedback = "";
  }

  _zonaAlineada() {
    const dif = abs(
      atan2(sin(this.anguloZona + HALF_PI), cos(this.anguloZona + HALF_PI)),
    );
    return dif < 0.3;
  }

  presionarBoton() {
    if (this.fase !== "encogiendo" || this.estadoPulso) return;

    this.estadoPulso = true;
    const avance = min(1, this.tiempoFase / this.duracionActual);

    if (this.anilloFalsoActivo) {
      this.progreso = constrain(this.progreso - 10, 0, this.objetivo);
      this.feedback = "¡Era falso! -10";
      this.falsoResuelto = true;
      this.pulsoValido = false;
      this.radioFinal = this.radio;
      this.fase = "mostrando";
      this.tiempoFase = 0;
      return;
    }

    if (avance < this.umbralTemprano) {
      this.feedback = "¡Muy temprano!";
      this.estadoPulso = false;
      return;
    }

    const alineado = !this.mecanicaZona || this._zonaAlineada();
    const perfecto = avance >= this.umbralPerfecto && alineado;
    if (this.exigirPerfecto && avance < this.umbralPerfecto) {
      this.feedback = "¡Casi! Necesita exacto";
      this.estadoPulso = false;
      return;
    }

    const gananciaPerfecto = this.pulsosPorCiclo > 1 ? 25 : 50;
    const gananciaBien = this.pulsosPorCiclo > 1 ? 12 : 25;
    this.progreso = constrain(
      this.progreso + (perfecto ? gananciaPerfecto : gananciaBien),
      0,
      this.objetivo,
    );
    if (perfecto) this.feedback = "¡PERFECTO!";
    else if (avance >= this.umbralPerfecto) this.feedback = "¡Bien! Zona";
    else this.feedback = "¡Bien!";
    this.pulsoValido = true;
    this.radioFinal = this.radio;
    this.fase = "mostrando";
    this.tiempoFase = 0;
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.tiempoFase += dt;
    if (this.mecanicaZona) this.anguloZona += this.velocidadZona * dt;

    if (this.fase === "preparando") {
      this.radio = this.radioInicial;
      if (this.tiempoFase >= (this.pulsosEnCiclo > 0 ? 0.35 : 0.55)) {
        this.fase = "encogiendo";
        this.tiempoFase = 0;
      }
    } else if (this.fase === "encogiendo") {
      const avance = min(1, this.tiempoFase / this.duracionActual);
      this.radio = lerp(this.radioInicial, this.radioNucleo, avance);
      if (avance >= 1) {
        this.radioFinal = this.radio;
        this.fase = "mostrando";
        this.tiempoFase = 0;
        if (this.anilloFalsoActivo) {
          this.feedback = "¡Era falso!";
          this.falsoResuelto = true;
          this.pulsoValido = false;
        } else {
          this.feedback = "Se fue el momento...";
          this.pulsoValido = false;
        }
      }
    } else if (this.fase === "mostrando") {
      if (this.tiempoFase >= 0.85) {
        if (this.falsoResuelto) {
          this._prepararCiclo();
        } else if (
          this.pulsoValido &&
          this.pulsosEnCiclo + 1 < this.pulsosPorCiclo
        ) {
          this.pulsosEnCiclo++;
          this._prepararPulso();
        } else {
          this._siguienteCiclo();
        }
      }
    }
  }

  _siguienteCiclo() {
    if (this.ciclo >= this.cicloMaximo) {
      this._terminar(
        this.progreso >= this.objetivo ? "capturado" : "pez_escapado",
      );
      return;
    }
    this.ciclo++;
    this._prepararCiclo();
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
    dibujarSpritePez(this.pez);
    fill(170, 190, 215);
    textSize(13);
    text(`Ciclo ${this.ciclo}/${this.cicloMaximo}`, cx, height * 0.15);
    if (this.pulsosPorCiclo > 1) {
      fill(170, 220, 255);
      textSize(11);
      text(
        `Pulso ${min(this.pulsosPorCiclo, this.pulsosEnCiclo + 1)}/${this.pulsosPorCiclo}`,
        cx,
        height * 0.19,
      );
    }

    noStroke();
    fill(245, 245, 245);
    ellipse(cx, cy, this.radioNucleo * 2.4, this.radioNucleo * 2.4);
    fill(255, 210, 60);
    ellipse(cx, cy, this.radioNucleo * 1.4, this.radioNucleo * 1.4);

    let radioMuestreo = this.radio;
    if (this.fase === "mostrando") radioMuestreo = this.radioFinal;

    let colorAnillo = color(150, 156, 166);
    if (this.anilloFalsoActivo) {
      colorAnillo = color(255, 75, 75);
    } else if (this.fase === "encogiendo") {
      const avance = min(1, this.tiempoFase / this.duracionActual);
      if (avance >= this.umbralPerfecto) colorAnillo = color(255, 220, 60);
      else if (avance >= this.umbralTemprano) colorAnillo = color(70, 230, 120);
      else colorAnillo = color(255, 255, 255);
    }

    noFill();
    stroke(colorAnillo);
    strokeWeight(5);
    ellipse(cx, cy, radioMuestreo * 2, radioMuestreo * 2);

    if (this.mecanicaZona) {
      noFill();
      stroke(255, 220, 60, 230);
      strokeWeight(8);
      arc(
        cx,
        cy,
        radioMuestreo * 2 + 10,
        radioMuestreo * 2 + 10,
        this.anguloZona - 0.25,
        this.anguloZona + 0.25,
      );
      fill(255, 235, 120);
      noStroke();
      triangle(
        cx - 7,
        cy - radioMuestreo - 18,
        cx + 7,
        cy - radioMuestreo - 18,
        cx,
        cy - radioMuestreo - 8,
      );
      fill(255, 220, 100, 210);
      textSize(10);
      text("zona dorada", cx, cy + radioMuestreo + 8);
    }

    if (this.anilloFalsoActivo && this.fase !== "mostrando") {
      fill(255, 100, 100);
      textSize(14);
      text("¡FALSO!", cx, cy + radioMuestreo + 26);
    }

    fill(190, 200, 215);
    textSize(13);
    const ayuda = this.mecanicaDoble
      ? "[CLIC / ESPACIO] dos veces por ciclo"
      : "[CLIC / ESPACIO] cuando llegue al centro";
    text(ayuda, cx, height * 0.72);

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

    dibujarMecanicasActivas(this, height * 0.94);

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

const VENTANA_ACIERTO_RITMO = 0.28;

class MinijuegoRitmo extends MinijuegoPesca {
  constructor(pez, opciones) {
    super(pez);
    this.objetivo = (opciones && opciones.objetivo) || 100;
    this.cantidadNotas = (opciones && opciones.notas) || 12;
    this.ventanaAcierto = VENTANA_ACIERTO_RITMO / Math.sqrt(this.escala);
    this.intervalo =
      (opciones && opciones.intervaloBase) ||
      Math.max(0.42, 1.9 / this.pez.velocidad);
    this.intervalo = Math.max(0.3, this.intervalo / this.escala);
    this.cantidadPistas = (opciones && opciones.pistas) || 3;
    this.tension = 25;
    this.progreso = 0;
    this.velocidadPista =
      (110 + this.pez.velocidad * 25) * (1 + (this.escala - 1) * 0.35);
    this.ultimoPulso = -1;
    this.ultimoPulsoPista = [];
    for (let i = 0; i < this.cantidadPistas; i++)
      this.ultimoPulsoPista.push(-1);
    this.feedback = "";
    this.tiempoFeedback = 0;
    this.golpes = [];
    this.pistas = [];

    this.mecanicaDobles = this.tieneMecanica("ritmo_dobles");
    this.mecanicaFalsas = this.tieneMecanica("ritmo_falsas");
    this.mecanicaLargas = this.tieneMecanica("ritmo_largas");
    this.teclasPresionadas = {};
    this.botonSostenido = false;

    this._definirPistas();
    this.notas = this._generarNotas();
  }

  _definirPistas() {
    const n = this.cantidadPistas;
    this.hitY = height * 0.68;
    this.espaciadoPista = 78;
    const anchoTotal = (n - 1) * this.espaciadoPista;
    const hitX0 = width / 2 - anchoTotal / 2;
    this.lineaX = hitX0;
    this.pistas = [];
    const teclasGrupo = [
      ["A", "Z"],
      ["S", "X"],
      ["D", "C"],
    ];
    const codesGrupo = [
      [65, 90],
      [83, 88],
      [68, 67],
    ];
    for (let i = 0; i < n; i++) {
      const g = i % 3;
      this.pistas.push({
        hitX: hitX0 + i * this.espaciadoPista,
        teclas: teclasGrupo[g],
        keyCodes: codesGrupo[g],
      });
    }
  }

  _generarNotas() {
    const notas = [];
    let t = 1.2;
    let pistaAnterior = -1;
    for (let i = 0; i < this.cantidadNotas; i++) {
      const salto = this.intervalo * random(0.7, 1.5);
      const pista = this._pistaAleatoria(pistaAnterior, salto);
      const nota = {
        tiempo: t,
        pista,
        golpeada: false,
        fallada: false,
      };

      // Cada nota tiene como máximo una mecánica.
      if (this.mecanicaFalsas && random() < 0.18) {
        nota.falsa = true;
      } else if (this.mecanicaLargas && random() < 0.22) {
        nota.larga = true;
        nota.duracion = random(0.45, 0.8);
        nota.iniciada = false;
        nota.completada = false;
      } else if (this.mecanicaDobles && random() < 0.22) {
        nota.doble = true;
      }

      notas.push(nota);

      if (nota.doble) {
        const pista2 =
          (pista + 1 + floor(random(this.cantidadPistas - 1))) %
          this.cantidadPistas;
        notas.push({
          tiempo: t,
          pista: pista2,
          golpeada: false,
          fallada: false,
          doble: true,
        });
      }

      // Evita que una nota larga pise la siguiente de su pista.
      t += nota.larga ? Math.max(salto, nota.duracion + 0.22) : salto;
      pistaAnterior = pista;
    }
    return notas;
  }

  _pistaAleatoria(pistaAnterior, salto) {
    const n = this.cantidadPistas;
    if (pistaAnterior < 0) return floor(random(n));

    if (salto < this.ventanaAcierto * 1.75) {
      return (pistaAnterior + 1 + floor(random(n - 1))) % n;
    }
    return floor(random(n));
  }

  _xNota(nota) {
    return this.pistas[nota.pista].hitX;
  }

  _yNota(nota) {
    return this.hitY - (nota.tiempo - this.tiempo) * this.velocidadPista;
  }

  _pistaDeEntrada(entrada) {
    if (!entrada) return -1;
    const tecla = (entrada.tecla || "").toLowerCase();
    for (let i = 0; i < this.cantidadPistas; i++) {
      const p = this.pistas[i];
      for (let k = 0; k < p.keyCodes.length; k++) {
        if (entrada.keyCode != null && entrada.keyCode === p.keyCodes[k])
          return i;
        if (tecla && tecla === p.teclas[k].toLowerCase()) return i;
      }
    }

    if (entrada.x != null) {
      let mejor = -1;
      let mejorDist = Infinity;
      for (let i = 0; i < this.cantidadPistas; i++) {
        const d = abs(this.pistas[i].hitX - entrada.x);
        if (d < mejorDist) {
          mejorDist = d;
          mejor = i;
        }
      }
      return mejor;
    }
    return -1;
  }

  aceptaTeclas() {
    return true;
  }

  presionarBoton(entrada) {
    if (entrada && entrada.keyCode != null) {
      this.teclasPresionadas[entrada.keyCode] = true;
    } else {
      this.botonSostenido = true;
    }

    const pista = this._pistaDeEntrada(entrada);
    if (pista < 0) {
      if (this.tiempo - this.ultimoPulso < 0.045) return; // Evita duplicados por teclado + mouse.
      this.ultimoPulso = this.tiempo;
      this._golpear(null, entrada);
      return;
    }
    if (this.tiempo - this.ultimoPulsoPista[pista] < 0.045) return;
    this.ultimoPulsoPista[pista] = this.tiempo;
    this._golpear(pista, entrada);
  }

  soltarBoton() {
    this.botonSostenido = false;
    super.soltarBoton();
  }

  soltarTecla(entrada) {
    if (!entrada || entrada.keyCode == null) return;
    delete this.teclasPresionadas[entrada.keyCode];
  }

  _golpear(pista, entrada) {
    let mejor = null;
    let mejorDelta = Infinity;
    for (const nota of this.notas) {
      if (nota.golpeada || nota.iniciada) continue;
      if (pista !== null && nota.pista !== pista) continue;
      const delta = abs(nota.tiempo - this.tiempo);
      if (delta < mejorDelta) {
        mejorDelta = delta;
        mejor = nota;
      }
    }

    if (!mejor || mejorDelta > this.ventanaAcierto) {
      this.tension = constrain(this.tension + 3, 0, 100);
      this.feedback = "¡Al aire!";
      this.tiempoFeedback = 0.4;
      return;
    }

    if (mejor.falsa) {
      mejor.golpeada = true;
      mejor.fallada = true;
      this.tension = constrain(this.tension + 10, 0, 100);
      this.progreso = constrain(this.progreso - 4, 0, this.objetivo);
      this.feedback = "¡FALSA!";
      this.tiempoFeedback = 0.5;
      return;
    }

    if (mejor.larga) {
      mejor.iniciada = true;
      mejor.sosteniendo = true;
      mejor.keyCodeSostenido =
        entrada && entrada.keyCode != null ? entrada.keyCode : null;
      mejor.botonSostenido = !(entrada && entrada.keyCode != null);
      this.golpes.push({ tiempo: mejor.tiempo, pista: mejor.pista, t: 0 });

      if (mejorDelta <= this.ventanaAcierto * 0.29) {
        this.progreso = constrain(this.progreso + 5, 0, this.objetivo);
        this.tension = constrain(this.tension - 2, 0, 100);
      } else if (mejorDelta <= this.ventanaAcierto * 0.57) {
        this.progreso = constrain(this.progreso + 3, 0, this.objetivo);
      } else {
        this.progreso = constrain(this.progreso + 2, 0, this.objetivo);
      }
      this.feedback = "¡Sostené!";
      this.tiempoFeedback = 0.4;
      return;
    }

    mejor.golpeada = true;
    this.golpes.push({ tiempo: mejor.tiempo, pista: mejor.pista, t: 0 });

    if (mejorDelta <= this.ventanaAcierto * 0.29) {
      this.progreso = constrain(this.progreso + 13, 0, this.objetivo);
      this.tension = constrain(this.tension - 5, 0, 100);
      this.feedback = "¡PERFECTO!";
    } else if (mejorDelta <= this.ventanaAcierto * 0.57) {
      this.progreso = constrain(this.progreso + 8, 0, this.objetivo);
      this.tension = constrain(this.tension - 2, 0, 100);
      this.feedback = "¡BIEN!";
    } else {
      this.progreso = constrain(this.progreso + 4, 0, this.objetivo);
      this.feedback = "Casi";
    }
    this.tiempoFeedback = 0.4;
  }

  actualizar(dt) {
    this.tiempo += dt;
    if (this.tiempoFeedback > 0) this.tiempoFeedback -= dt;
    for (const golpe of this.golpes) golpe.t += dt;
    this.golpes = this.golpes.filter((g) => g.t < 0.35);

    for (const nota of this.notas) {
      if (
        !nota.golpeada &&
        !nota.iniciada &&
        this.tiempo - nota.tiempo > this.ventanaAcierto
      ) {
        nota.golpeada = true;
        nota.fallada = true;
        if (!nota.falsa) {
          this.tension = constrain(this.tension + 7, 0, 100);
          this.feedback = "Se escapó";
          this.tiempoFeedback = 0.4;
        }
      }
    }

    for (const nota of this.notas) {
      if (!nota.larga || !nota.iniciada || nota.completada) continue;
      const sostenida =
        nota.keyCodeSostenido != null
          ? !!this.teclasPresionadas[nota.keyCodeSostenido]
          : this.botonSostenido;
      if (!sostenida) {
        nota.completada = true;
        nota.golpeada = true;
        nota.fallada = true;
        this.tension = constrain(this.tension + 8, 0, 100);
        this.feedback = "¡Soltaste!";
        this.tiempoFeedback = 0.4;
      } else if (this.tiempo >= nota.tiempo + nota.duracion) {
        nota.completada = true;
        nota.golpeada = true;
        this.progreso = constrain(this.progreso + 14, 0, this.objetivo);
        this.tension = constrain(this.tension - 5, 0, 100);
        this.feedback = "¡LARGA!";
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

    this._definirPistas();

    fill(255, 220, 100);
    textAlign(CENTER, TOP);
    textSize(20);
    text(this.pez.nombre, width / 2, height * 0.06);
    dibujarSpritePez(this.pez);

    const laneAncho = 54;
    for (let i = 0; i < this.cantidadPistas; i++) {
      const p = this.pistas[i];

      fill(16, 17, 20);
      noStroke();
      rect(
        p.hitX - laneAncho / 2,
        height * 0.1,
        laneAncho,
        this.hitY - height * 0.08,
        6,
      );

      stroke(255, 255, 255, 40);
      strokeWeight(1);
      line(
        p.hitX - laneAncho / 2,
        height * 0.1,
        p.hitX - laneAncho / 2,
        this.hitY,
      );
      line(
        p.hitX + laneAncho / 2,
        height * 0.1,
        p.hitX + laneAncho / 2,
        this.hitY,
      );

      noStroke();
      fill(60, 66, 78);
      rect(p.hitX - 16, this.hitY + 14, 32, 20, 5);
      fill(215, 230, 245);
      textAlign(CENTER, CENTER);
      textSize(12);
      text(p.teclas[0], p.hitX, this.hitY + 24);
    }

    const pulso = (sin(this.tiempo * 10) + 1) / 2;
    stroke(255, 255, 255, 150 + pulso * 105);
    strokeWeight(4);
    line(
      this.lineaX - 20,
      this.hitY,
      this.lineaX + (this.cantidadPistas - 1) * this.espaciadoPista + 20,
      this.hitY,
    );
    strokeWeight(1);

    for (const nota of this.notas) {
      if (nota.golpeada && !nota.larga) continue;
      if (nota.larga && (nota.completada || nota.fallada)) continue;
      const x = this._xNota(nota);
      const y = nota.iniciada ? this.hitY : this._yNota(nota);
      if (y > this.hitY + 26 || y < -70) continue;
      const delta = abs(nota.tiempo - this.tiempo);
      const activa = delta <= this.ventanaAcierto;

      if (nota.larga) {
        const cola = Math.max(
          0,
          (nota.tiempo + nota.duracion - this.tiempo) * this.velocidadPista,
        );
        noStroke();
        fill(nota.iniciada ? color(110, 220, 255) : color(80, 170, 235));
        rect(x - 9, y - cola, 18, cola + 20, 9);
        fill(nota.iniciada ? color(190, 245, 255) : color(160, 220, 255));
        ellipse(x, y, 26, 26);
        if (nota.iniciada) {
          fill(255, 255, 255, 190);
          textAlign(CENTER, CENTER);
          textSize(10);
          text("¡SOSTENÉ!", x, this.hitY + 44);
        }
        continue;
      }

      noStroke();
      if (nota.falsa) {
        fill(activa ? color(255, 90, 80) : color(210, 70, 65));
        if (activa) {
          stroke(255, 220, 210, 220);
          strokeWeight(2);
        }
        ellipse(x, y, 27, 27);
        noStroke();
        stroke(255, 230, 220, 230);
        strokeWeight(2.5);
        line(x - 6, y - 6, x + 6, y + 6);
        line(x + 6, y - 6, x - 6, y + 6);
        noStroke();
        continue;
      }

      fill(activa ? color(120, 220, 255) : color(255, 200, 80));
      if (activa) {
        stroke(255, 255, 255, 200);
        strokeWeight(2);
      }
      ellipse(x, y, 26, 26);
      noStroke();
      fill(activa ? color(200, 245, 255) : color(255, 235, 160));
      ellipse(x, y, 12, 12);
    }

    for (const golpe of this.golpes) {
      const x = this._xNota({ tiempo: golpe.tiempo, pista: golpe.pista });
      const y = this._yNota({ tiempo: golpe.tiempo, pista: golpe.pista });
      noFill();
      stroke(255, 230, 90, 255 * (1 - golpe.t / 0.35));
      strokeWeight(3);
      ellipse(x, y, 26 + golpe.t * 160, 26 + golpe.t * 160);
    }

    dibujarBarrasPesca(this.progreso, this.tension);

    fill(190, 200, 215);
    textAlign(CENTER, TOP);
    textSize(13);
    text(
      this.mecanicaDobles
        ? "[A][S][D] una tecla por pista — las dobles piden dos"
        : "[A][S][D] con la nota de cada pista — [CLIC/ESPACIO] también",
      width / 2,
      height * 0.8,
    );
    dibujarMecanicasActivas(this, height * 0.87);

    if (this.tiempoFeedback > 0 && this.feedback) {
      fill(0, 0, 0, 140);
      rect(width / 2 - 120, height * 0.14, 240, 36, 8);
      let colorTexto = color(255);
      if (this.feedback === "¡PERFECTO!") colorTexto = color(255, 220, 40);
      else if (this.feedback === "¡BIEN!" || this.feedback === "¡LARGA!")
        colorTexto = color(80, 255, 100);
      else if (this.feedback === "¡FALSA!") colorTexto = color(255, 90, 80);
      else colorTexto = color(230, 160, 110);
      fill(colorTexto);
      textAlign(CENTER, CENTER);
      textSize(17);
      text(this.feedback, width / 2, height * 0.14 + 18);
    }

    textAlign(LEFT, BASELINE);
  }
}

class MinijuegoEsquiva extends MinijuegoPesca {
  constructor(pez, opciones) {
    super(pez);
    this.progresoPorSegundo =
      ((opciones && opciones.progresoPorSegundo) || 9) / this.escala;
    this.intervaloSpawn = Math.max(
      0.28,
      ((opciones && opciones.intervaloSpawn) || 0.85) / this.escala,
    );
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

    this.mecanicaZigzag = this.tieneMecanica("esquiva_zigzag");
    this.mecanicaPerseguidor = this.tieneMecanica("esquiva_perseguidor");
    this.mecanicaPared = this.tieneMecanica("esquiva_pared");
    this.perseguidor = null;
    this.timerPerseguidor = random(4, 6);
    this.paredes = [];
    this.timerPared = random(5, 7);
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
    const vel =
      (60 + this.pez.velocidad * 28) * creceConTiempo * Math.sqrt(this.escala);
    const tipos = ["lata", "piedra", "red", "botella", "bolsa"];
    const zigzag = this.mecanicaZigzag && random() < 0.42;
    this.obstaculos.push({
      x,
      y,
      baseX: x,
      baseY: y,
      vx: dirX * vel + random(-22, 22),
      vy: dirY * vel + random(-22, 22),
      radio: random(8, 15),
      tipo: random(tipos),
      rot: random(TWO_PI),
      edad: 0,
      zigzag,
      zigzagFase: random(TWO_PI),
      zigzagAmplitud: random(18, 34) * (0.85 + (this.escala - 1) * 0.25),
      zigzagVel: random(2.4, 4.2),
    });
  }

  _crearPerseguidor() {
    const x = random(this.arenaX + 20, this.arenaX + this.arenaW - 20);
    const y =
      random() < 0.5 ? this.arenaY - 12 : this.arenaY + this.arenaH + 12;
    this.perseguidor = {
      x,
      y,
      radio: 14,
      edad: 0,
      aviso: 1.1,
      duracion: 5.5,
    };
    this.feedback = "¡Pez perseguidor!";
    this.tiempoFeedback = 0.8;
  }

  _crearPared() {
    const huecoAncho = Math.min(135, this.arenaW * 0.55);
    const minX = this.arenaX + 20;
    const maxX = this.arenaX + this.arenaW - huecoAncho - 20;
    const huecoX =
      maxX > minX
        ? random(minX, maxX)
        : this.arenaX + (this.arenaW - huecoAncho) / 2;
    this.paredes.push({
      x: this.arenaX,
      y: this.arenaY - 30,
      w: this.arenaW,
      h: 18,
      huecoX,
      huecoAncho,
      vy: 95 + (this.escala - 1) * 30,
      aviso: 0.8,
      edad: 0,
    });
    this.feedback = "¡Pared con hueco!";
    this.tiempoFeedback = 0.8;
  }

  _dibujarBasura(obs) {
    const r = obs.radio;
    push();
    translate(obs.x, obs.y);
    rotate(obs.rot);
    noStroke();

    if (obs.zigzag) {
      noFill();
      stroke(80, 190, 255, 150);
      strokeWeight(1.5);
      ellipse(0, 0, r * 3.2, r * 3.2);
      noStroke();
    }

    if (obs.tipo === "lata") {
      fill(150, 152, 158);
      rect(-r * 0.9, -r * 0.45, r * 1.8, r * 0.9, 2);
      fill(120, 122, 128);
      rect(-r * 0.7, -r * 0.4, r * 1.4, r * 0.26, 1);
      fill(80, 82, 88);
      ellipse(-r * 0.6, -r * 0.4, r * 0.36, r * 0.2);
    } else if (obs.tipo === "piedra") {
      fill(124, 118, 110);
      ellipse(0, 0, r * 1.6, r * 1.25);
      fill(98, 92, 86);
      ellipse(r * 0.25, r * 0.15, r * 0.8, r * 0.55);
      fill(140, 134, 126);
      ellipse(-r * 0.3, -r * 0.3, r * 0.6, r * 0.4);
    } else if (obs.tipo === "red") {
      stroke(58, 92, 82, 220);
      strokeWeight(1.2);
      for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
          noFill();
          rect(
            ix * r * 0.9 - r * 0.45,
            iy * r * 0.9 - r * 0.45,
            r * 0.9,
            r * 0.9,
          );
        }
      }
      noStroke();
    } else if (obs.tipo === "botella") {
      fill(150, 205, 215, 210);
      rect(-r * 0.4, -r * 0.9, r * 0.8, r * 1.8, r * 0.4);
      fill(190, 230, 235);
      rect(-r * 0.3, -r * 0.65, r * 0.6, r * 0.9, 2);
      fill(130, 190, 200);
      rect(-r * 0.32, -r * 0.95, r * 0.64, r * 0.4, 2);
    } else {
      fill(218, 218, 212, 190);
      beginShape();
      vertex(-r, -r * 0.5);
      vertex(-r * 0.5, -r);
      vertex(r * 0.6, -r * 0.7);
      vertex(r, 0);
      vertex(r * 0.4, r * 0.8);
      vertex(-r * 0.7, r);
      endShape(CLOSE);
      fill(190, 190, 184, 190);
      ellipse(-r * 0.3, -r * 0.3, r * 0.6, r * 0.4);
    }

    pop();
  }

  _dibujarPerseguidor() {
    const p = this.perseguidor;
    if (!p) return;
    const aviso = p.edad <= p.aviso;
    push();
    translate(p.x, p.y);
    if (aviso) {
      const pulso = (sin(this.tiempo * 14) + 1) / 2;
      noFill();
      stroke(255, 90, 70, 120 + pulso * 120);
      strokeWeight(2.5);
      circle(0, 0, p.radio * 4);
      noStroke();
    }
    fill(215, 70, 60, 120);
    ellipse(-p.radio * 1.6, 0, p.radio * 1.8, p.radio * 1.2);
    fill(220, 75, 65);
    ellipse(0, 0, p.radio * 2.4, p.radio * 1.8);
    fill(255, 160, 140);
    triangle(
      -p.radio * 1.1,
      0,
      -p.radio * 2.2,
      -p.radio * 0.8,
      -p.radio * 2.2,
      p.radio * 0.8,
    );
    fill(20);
    circle(p.radio * 0.5, -p.radio * 0.3, 3.5);
    fill(255);
    circle(p.radio * 0.6, -p.radio * 0.4, 1.8);
    pop();
  }

  _dibujarParedes() {
    for (const pared of this.paredes) {
      const aviso = pared.edad < pared.aviso;
      const alpha = aviso ? 120 + 90 * ((sin(this.tiempo * 14) + 1) / 2) : 235;
      fill(120, 125, 135, alpha);
      noStroke();
      rect(pared.x, pared.y, pared.huecoX - pared.x, pared.h);
      rect(
        pared.huecoX + pared.huecoAncho,
        pared.y,
        pared.x + pared.w - (pared.huecoX + pared.huecoAncho),
        pared.h,
      );
      fill(80, 230, 150, aviso ? 160 : 220);
      rect(pared.huecoX - 3, pared.y - 2, 3, pared.h + 4);
      rect(pared.huecoX + pared.huecoAncho, pared.y - 2, 3, pared.h + 4);
      if (aviso) {
        fill(255, 225, 130);
        textAlign(CENTER, CENTER);
        textSize(13);
        text("¡PARED!", this.arenaX + this.arenaW / 2, this.arenaY - 4);
      }
    }
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

    let dx = 0;
    let dy = 0;
    if (teclaJuegoPresionada(87) || teclaJuegoPresionada(UP_ARROW)) dy -= 1;
    if (teclaJuegoPresionada(83) || teclaJuegoPresionada(DOWN_ARROW)) dy += 1;
    if (teclaJuegoPresionada(65) || teclaJuegoPresionada(LEFT_ARROW)) dx -= 1;
    if (teclaJuegoPresionada(68) || teclaJuegoPresionada(RIGHT_ARROW)) dx += 1;
    dx+=window.ControlTactil?.analogico.x||0;dy+=window.ControlTactil?.analogico.y||0;
    const magnitud=Math.hypot(dx,dy);if(magnitud>1){dx/=magnitud;dy/=magnitud;}
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

    this.timerSpawn -= dt;
    if (this.timerSpawn <= 0) {
      const denso = lerp(1, 0.4, constrain(this.tiempo / 18, 0, 1));
      this.timerSpawn = Math.max(0.3, this.intervaloSpawn * denso);
      this._crearObstaculo();
    }

    for (const obs of this.obstaculos) {
      obs.edad += dt;
      obs.baseX += obs.vx * dt;
      obs.baseY += obs.vy * dt;
      let ox = obs.baseX;
      let oy = obs.baseY;
      if (obs.zigzag) {
        const norma = Math.sqrt(obs.vx * obs.vx + obs.vy * obs.vy) || 1;
        const perpX = -obs.vy / norma;
        const perpY = obs.vx / norma;
        const osc =
          Math.sin(obs.edad * obs.zigzagVel + obs.zigzagFase) *
          obs.zigzagAmplitud;
        ox += perpX * osc;
        oy += perpY * osc;
      }
      obs.x = ox;
      obs.y = oy;
    }

    this.obstaculos = this.obstaculos.filter((obs) => {
      const bx = obs.baseX != null ? obs.baseX : obs.x;
      const by = obs.baseY != null ? obs.baseY : obs.y;
      const fuera =
        bx < this.arenaX ||
        bx > this.arenaX + this.arenaW ||
        by < this.arenaY ||
        by > this.arenaY + this.arenaH;
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

    // Las amenazas no se solapan.
    if (this.mecanicaPerseguidor) {
      if (!this.perseguidor) {
        // El temporizador solo corre si no hay una pared activa.
        if (this.paredes.length === 0) this.timerPerseguidor -= dt;
        if (this.timerPerseguidor <= 0 && this.paredes.length === 0) {
          this._crearPerseguidor();
          this.timerPerseguidor = random(8, 11);
        }
      } else {
        const p = this.perseguidor;
        p.edad += dt;
        if (p.edad > p.aviso) {
          const dx = this.jugX - p.x;
          const dy = this.jugY - p.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const vel =
            105 + (this.pez.velocidad || 1) * 14 + (this.escala - 1) * 35;
          p.x += (dx / d) * vel * dt;
          p.y += (dy / d) * vel * dt;
          if (
            dist(p.x, p.y, this.jugX, this.jugY) <
            p.radio + this.radioJugador
          ) {
            this.tension = constrain(this.tension + 14, 0, 100);
            this.flash = 1;
            this.feedback = "¡Te alcanzó!";
            this.tiempoFeedback = 0.6;
            this.perseguidor = null;
            this.timerPerseguidor = random(8, 11);
          } else if (p.edad > p.aviso + p.duracion) {
            this.perseguidor = null;
            this.feedback = "¡Lo esquivaste!";
            this.tiempoFeedback = 0.6;
            this.progreso = constrain(this.progreso + 4, 0, 100);
          }
        }
      }
    }

    if (this.mecanicaPared) {
      if (this.paredes.length === 0) {
        if (!this.perseguidor) this.timerPared -= dt;
        if (this.timerPared <= 0 && !this.perseguidor) {
          this._crearPared();
          this.timerPared = random(8, 11);
        }
      }
      for (const pared of this.paredes) {
        pared.edad += dt;
        if (pared.edad < pared.aviso) continue;
        pared.y += pared.vy * dt;
        const enRangoY =
          this.jugY + this.radioJugador > pared.y &&
          this.jugY - this.radioJugador < pared.y + pared.h;
        if (enRangoY && !pared.golpeada) {
          const dentroHueco =
            this.jugX > pared.huecoX + this.radioJugador &&
            this.jugX < pared.huecoX + pared.huecoAncho - this.radioJugador;
          if (!dentroHueco) {
            pared.golpeada = true;
            this.tension = constrain(this.tension + 15, 0, 100);
            this.flash = 1;
            this.feedback = "¡Pared!";
            this.tiempoFeedback = 0.6;
          }
        }
        if (pared.y > this.arenaY + this.arenaH + 30) {
          pared.fuera = true;
          if (!pared.golpeada && !pared.pasada) {
            pared.pasada = true;
            this.progreso = constrain(this.progreso + 4, 0, 100);
            this.feedback = "¡Pasaste!";
            this.tiempoFeedback = 0.5;
          }
        }
      }
      this.paredes = this.paredes.filter((p) => !p.fuera);
    }

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
    dibujarSpritePez(this.pez);

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
      this._dibujarBasura(obs);
    }
    this._dibujarParedes();
    this._dibujarPerseguidor();

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

    const bocaX = this.jugX - 15;
    const bocaY = this.jugY - 1;
    const anclaX = width / 2;
    const anclaY = height * 0.03 + sin(this.tiempo * 1.3) * 5;
    stroke(245, 242, 221);
    strokeWeight(2.5);
    noFill();
    beginShape();
    vertex(bocaX, bocaY);
    quadraticVertex((bocaX + anclaX) / 2, bocaY - 120, anclaX, anclaY);
    endShape();
    stroke(205, 205, 205);
    strokeWeight(2);
    arc(bocaX - 2, bocaY + 5, 12, 12, radians(-100), radians(70));
    line(bocaX + 1, bocaY + 8, bocaX - 2, bocaY + 12);
    noStroke();

    dibujarBarrasPesca(this.progreso, this.tension);

    if (this.flash > 0) {
      fill(255, 40, 40, this.flash * 70);
      noStroke();
      rect(0, 0, width, height);
    }

    fill(190, 200, 215);
    textAlign(CENTER, TOP);
    textSize(13);
    text("[WASD / FLECHAS] esquivá", width / 2, height * 0.86);
    dibujarMecanicasActivas(this, height * 0.93);

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

class MinijuegoMultietapa extends MinijuegoPesca {
  constructor(pez) {
    super(pez);
    this.mecanicaQTE = this.tieneMecanica("multi_qte");
    this.mecanicaSprint = this.tieneMecanica("multi_sprint");
    this.mecanicaTension = this.tieneMecanica("multi_tension");

    this.tensionCompartida = 20;
    this.enQTE = false;
    this.qte = null;
    this.bonusSiguiente = 0;

    // Las fases internas no repiten las mecánicas.
    const pezBase = Object.assign({}, pez, { mecanicasActivas: [] });
    const pezSprint = Object.assign({}, pezBase, {
      escalaDificultad: (pez.escalaDificultad || 1) * 1.12,
    });
    const pezUltima = this.mecanicaSprint ? pezSprint : pezBase;

    this.fases = [
      {
        // Dos ciclos evitan cerrar la cacería con un solo pulso.
        mini: new MinijuegoAnillo(pezBase, { ciclos: 2, objetivo: 50 }),
        titulo: "1/4 — Acechando",
      },
      {
        mini: new MinijuegoRitmo(pezBase, { notas: 9, intervaloBase: 0.8 }),
        titulo: "2/4 — Frenando",
      },
      {
        mini: new MinijuegoEsquiva(pezBase, {
          progresoPorSegundo: 14,
          intervaloSpawn: 0.7,
        }),
        titulo: "3/4 — Torbellino",
      },
      {
        mini: new MinijuegoAnillo(pezUltima, {
          ciclos: 1,
          objetivo: 50,
          exigirPerfecto: true,
        }),
        titulo: this.mecanicaSprint
          ? "4/4 — ¡SPRINT FINAL!"
          : "4/4 — ¡EL MOMENTO!",
      },
    ];
    this.indice = 0;
    this.actual = this.fases[0];
    this.tiempoTitulo = 0;
    this._aplicarTensionCompartida(this.actual.mini);
  }

  _aplicarTensionCompartida(mini) {
    if (!this.mecanicaTension || mini.tension == null) return;
    mini.tension = Math.max(mini.tension, this.tensionCompartida);
  }

  _actualizarTensionCompartida(usarTensionFase) {
    if (!this.mecanicaTension) return;
    this.tensionCompartida = constrain(
      Math.max(0, this.tensionCompartida - 6),
      0,
      100,
    );
    if (
      usarTensionFase !== false &&
      typeof this.actual.mini.tension === "number"
    ) {
      this.tensionCompartida = Math.max(
        this.tensionCompartida,
        Math.min(100, this.actual.mini.tension * 0.75),
      );
    }
  }

  _iniciarQTE() {
    this.enQTE = true;
    this.tiempoTitulo = 1.2;
    this.qte = {
      tiempo: 0,
      fase: -0.5,
      duracion: 2.2,
      zonaInicio: 0.4,
      zonaFin: 0.62,
      marcador: 0,
      resuelto: false,
    };
  }

  _resolverQTE() {
    if (!this.enQTE || !this.qte || this.qte.resuelto) return;
    this.qte.resuelto = true;
    const enZona =
      this.qte.marcador >= this.qte.zonaInicio &&
      this.qte.marcador <= this.qte.zonaFin;
    if (enZona) {
      this.tensionCompartida = constrain(this.tensionCompartida - 10, 0, 100);
      this.bonusSiguiente = 8;
    } else {
      this.tensionCompartida = constrain(this.tensionCompartida + 8, 0, 100);
      this.bonusSiguiente = 0;
    }
    this.enQTE = false;
    this.qte = null;
    this._avanzarFase(false);
  }

  _avanzarFase(usarTensionFase) {
    this._actualizarTensionCompartida(usarTensionFase);
    if (this.mecanicaTension && this.tensionCompartida >= 100) {
      this._terminar("linea_rota");
      return;
    }
    this.indice++;
    this.actual = this.fases[this.indice];
    this.tiempoTitulo = 0;
    this._aplicarTensionCompartida(this.actual.mini);
    if (this.bonusSiguiente > 0) {
      this.actual.mini.progreso = Math.min(
        this.actual.mini.objetivo,
        (this.actual.mini.progreso || 0) + this.bonusSiguiente,
      );
      this.bonusSiguiente = 0;
    }
  }

  presionarBoton(entrada) {
    if (this.enQTE) {
      this._resolverQTE();
      return;
    }
    this.actual.mini.presionarBoton(entrada);
  }

  soltarBoton() {
    if (!this.enQTE) this.actual.mini.soltarBoton();
  }

  soltarTecla(entrada) {
    if (!this.enQTE && this.actual.mini.soltarTecla) {
      this.actual.mini.soltarTecla(entrada);
    }
  }

  aceptaTeclas() {
    if (this.enQTE) return false;
    return this.actual.mini.aceptaTeclas();
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.tiempoTitulo += dt;

    if (this.enQTE) {
      this.qte.tiempo += dt;
      this.qte.fase += dt * 0.8;
      this.qte.marcador = 0.5 + 0.5 * sin(this.qte.fase * PI);
      if (this.qte.tiempo >= this.qte.duracion && !this.qte.resuelto) {
        this.qte.resuelto = true;
        this.tensionCompartida = constrain(this.tensionCompartida + 10, 0, 100);
        this.bonusSiguiente = 0;
        this.enQTE = false;
        this.qte = null;
        this._avanzarFase(false);
      }
      return;
    }

    this.actual.mini.actualizar(dt);

    if (this.mecanicaTension) {
      this.tensionCompartida = Math.max(
        this.tensionCompartida,
        Math.min(100, (this.actual.mini.tension || 0) * 0.75),
      );
      if (this.tensionCompartida >= 100) {
        this._terminar("linea_rota");
        return;
      }
    }

    if (this.actual.mini.resultado) {
      const resultado = this.actual.mini.resultado;
      if (resultado === "capturado" && this.indice < this.fases.length - 1) {
        if (this.mecanicaQTE) this._iniciarQTE();
        else this._avanzarFase();
      } else {
        this._terminar(resultado);
      }
    }
  }

  dibujar() {
    this.actual.mini.dibujar();

    if (this.enQTE) {
      this._dibujarQTE();
    } else if (this.tiempoTitulo < 1.1) {
      const alpha = map(this.tiempoTitulo, 0, 1.1, 235, 60);
      fill(10, 12, 16, alpha);
      noStroke();
      rect(0, 0, width, height);
      fill(255, 235, 120);
      textAlign(CENTER, CENTER);
      textSize(34);
      text(this.actual.titulo, width / 2, height / 2);
    }

    if (this.mecanicaTension) this._dibujarTensionCompartida();
    if (this.mecanicaSprint && this.indice === this.fases.length - 1) {
      const pulso = (sin(this.tiempo * 8) + 1) / 2;
      fill(255, 150, 50, 160 + pulso * 95);
      textAlign(CENTER, CENTER);
      textSize(15);
      text("¡SPRINT FINAL!", width / 2, height * 0.21);
    }
    dibujarMecanicasActivas(this, height * 0.94);
    textAlign(LEFT, BASELINE);
  }

  _dibujarQTE() {
    fill(8, 10, 14, 215);
    noStroke();
    rect(0, 0, width, height);
    const cx = width / 2;
    const barW = Math.min(420, width * 0.7);
    const barH = 26;
    const barX = cx - barW / 2;
    const barY = height * 0.52;

    fill(255, 235, 120);
    textAlign(CENTER, CENTER);
    textSize(26);
    text("¡TRANSICIÓN!", cx, barY - 70);
    fill(200, 220, 240);
    textSize(13);
    text(
      "Pulsá [SPACE] cuando el marcador esté en la zona verde",
      cx,
      barY - 40,
    );

    fill(16, 18, 22);
    noStroke();
    rect(barX, barY, barW, barH, 8);
    fill(60, 200, 110, 200);
    rect(
      barX + barW * this.qte.zonaInicio,
      barY + 2,
      barW * (this.qte.zonaFin - this.qte.zonaInicio),
      barH - 4,
      5,
    );
    const mx = barX + barW * this.qte.marcador;
    fill(255, 220, 90);
    rect(mx - 4, barY - 9, 8, barH + 18, 3);
    fill(220, 230, 245);
    textSize(11);
    text("QTE", cx, barY + barH + 22);
  }

  _dibujarTensionCompartida() {
    const bw = Math.min(300, width * 0.36);
    const bh = 12;
    const bx = width / 2 - bw / 2;
    const by = height * 0.12;
    fill(16, 17, 20);
    noStroke();
    rect(bx, by, bw, bh, 6);
    const valor = constrain(this.tensionCompartida, 0, 100);
    let c = color(60, 200, 100);
    if (valor >= 70) c = color(255, 80, 60);
    else if (valor >= 40) c = color(255, 200, 40);
    fill(c);
    rect(bx + 2, by + 2, (bw - 4) * (valor / 100), bh - 4, 4);
    fill(200, 215, 235);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("Tensión compartida", width / 2, by - 10);
  }
}
