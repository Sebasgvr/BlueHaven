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
