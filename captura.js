const PECES_CAPTURA = [
  { nombre: "Carpa", velocidad: 1.0 },
  { nombre: "Trucha Arcoíris", velocidad: 1.8 },
  { nombre: "Dragón del Lago", velocidad: 3.0 },
];

class SistemaCaptura {
  constructor() {
    this.estado = "inactivo";
    this.pez = null;

    this.timerEspera = 0;
    this.timerFase = 0;
    this.timerEnganche = 0;
    this.resultadoEnganche = "";

    this.ventanaTiming = 0.4;
    this.screenshake = 0;
    this.tiempoAnim = 0;

    this.progreso = 0;
    this.tension = 0;
    this.posicionPez = 0.5;
    this.velocidadPez = 0;
    this.posicionZona = 0.5;
    this.velocidadZona = 0; // velocidad de la barra verde
    this.objetivoPez = 0.5;
    this.timerFinta = 0;
    this.tamanoZona = 0.25;
    this.velocidadLlenado = 9.0; // acelera la captura
    this.aumentoTension = 11.0;
    this.disminucionTension = 8.0;
    this.botonPresionado = false;
    this.tiempoLucha = 0;
    this.enFaseAdaptacion = true;
    this.progresoLanzamiento = 0;
  }

  iniciar(pez) {
    this.pez = pez;
    this.estado = "esperando_mordida";
    this.timerEspera = random(3, 8);
    this.tiempoAnim = 0;
    this.resultadoEnganche = "";
    this.screenshake = 0;
    this.progresoLanzamiento = 0;
  }

  presionarBoton() {
    if (
      this.estado === "esperando_mordida" ||
      this.estado === "tiron_suave" ||
      this.estado === "doble_tiron"
    ) {
      this.resultadoEnganche = "prematuro";
      this.estado = "mostrando_resultado";
      this.timerFase = 0.8;
    } else if (this.estado === "tiron_fuerte") {
      this.resultadoEnganche = this.timerEnganche < 0.2 ? "perfecto" : "bueno";
      this.estado = "mostrando_resultado";
      this.timerFase = 0.6;
    } else if (this.estado === "lucha") {
      this.botonPresionado = true;
    }
  }

  soltarBoton() {
    this.botonPresionado = false;
  }

  actualizar() {
    const dt = deltaTime / 1000;
    this.tiempoAnim += dt;
    if (this.estado !== "inactivo") {
      this.progresoLanzamiento = Math.min(1, this.progresoLanzamiento + dt * 2.8);
    }
    if (this.screenshake > 0)
      this.screenshake = max(0, this.screenshake - dt * 3);

    switch (this.estado) {
      case "esperando_mordida":
        this.timerEspera -= dt;
        if (this.timerEspera <= 0) {
          this.estado = "tiron_suave";
          this.timerFase = 0.3;
        }
        break;

      case "tiron_suave":
        this.timerFase -= dt;
        if (this.timerFase <= 0) {
          this.estado = "doble_tiron";
          this.timerFase = 0.5;
        }
        break;

      case "doble_tiron":
        this.timerFase -= dt;
        if (this.timerFase <= 0) {
          this.estado = "tiron_fuerte";
          this.timerFase = this.ventanaTiming;
          this.timerEnganche = 0;
          this.screenshake = 0.5;
        }
        break;

      case "tiron_fuerte":
        this.timerFase -= dt;
        this.timerEnganche += dt;
        if (this.timerFase <= 0) {
          this.resultadoEnganche = "tarde";
          this.estado = "mostrando_resultado";
          this.timerFase = 0.8;
        }
        break;

      case "mostrando_resultado":
        this.timerFase -= dt;
        if (this.timerFase <= 0) {
          if (
            this.resultadoEnganche === "perfecto" ||
            this.resultadoEnganche === "bueno"
          ) {
            this._iniciarLucha();
          } else {
            this.estado = "esperando_mordida";
            this.timerEspera = random(6, 14);
          }
        }
        break;

      case "lucha":
        this._actualizarLucha(dt);
        break;

      case "capturado":
      case "linea_rota":
      case "pez_escapado":
        this.timerFase -= dt;
        if (this.timerFase <= 0) this.estado = "inactivo";
        break;
    }
  }

  _iniciarLucha() {
    this.estado = "lucha";
    this.progreso = 0;
    this.tension = 0;
    this.posicionPez = random(0.25, 0.75);
    this.objetivoPez = this.posicionPez;
    this.posicionZona = 0.5;
    this.velocidadZona = 0;
    this.tiempoLucha = 0;
    this.enFaseAdaptacion = true;
    this.botonPresionado = false;
    this.velocidadPez = 0;
    this.timerFinta = random(1.5, 3.0);
  }

  _actualizarLucha(dt) {
    const mult = this.pez ? this.pez.velocidad : 1.0;
    this.tiempoLucha += dt;

    if (this.enFaseAdaptacion && this.tiempoLucha > 3)
      this.enFaseAdaptacion = false;

    this.timerFinta -= dt;
    if (this.timerFinta <= 0) {
      this.objetivoPez = random(0.05, 0.95);
      this.timerFinta = random(0.8, 2.5) / mult;
    }

    const velBase = this.enFaseAdaptacion ? 0.35 : 1.0;
    const aceleracion =
      (this.objetivoPez - this.posicionPez) * velBase * mult * 4;
    this.velocidadPez += aceleracion * dt;
    this.velocidadPez *= 0.82;
    this.posicionPez = constrain(
      this.posicionPez + this.velocidadPez * dt * 5,
      0.02,
      0.98,
    );

    // Fisicas de la barra: aceleracion hacia arriba o gravedad gradual
    if (this.botonPresionado) {
      const fuerzaSubida = 4.8;
      this.velocidadZona -= fuerzaSubida * dt;
    } else {
      const gravedad = 3.2; // aceleracion de caida progresiva
      this.velocidadZona += gravedad * dt;
    }

    this.velocidadZona *= 0.98;
    this.velocidadZona = constrain(this.velocidadZona, -2.4, 2.4);
    this.posicionZona += this.velocidadZona * dt;

    // Limites y rebote al golpear el fondo
    const limiteInferior = 1 - this.tamanoZona / 2;
    const limiteSuperior = this.tamanoZona / 2;

    if (this.posicionZona >= limiteInferior) {
      this.posicionZona = limiteInferior;
      if (this.velocidadZona > 0) {
        const elasticidad = 0.45; // rebota segun que tan rapido cayo
        this.velocidadZona = -this.velocidadZona * elasticidad;
        if (abs(this.velocidadZona) < 0.1) this.velocidadZona = 0;
      }
    } else if (this.posicionZona <= limiteSuperior) {
      this.posicionZona = limiteSuperior;
      if (this.velocidadZona < 0) {
        this.velocidadZona = 0;
      }
    }

    const zonaMin = this.posicionZona - this.tamanoZona / 2;
    const zonaMax = this.posicionZona + this.tamanoZona / 2;
    const enZona = this.posicionPez >= zonaMin && this.posicionPez <= zonaMax;
    const enCentro =
      abs(this.posicionPez - this.posicionZona) < this.tamanoZona * 0.15;

    if (enZona) {
      this.progreso = constrain(
        this.progreso +
          (enCentro ? this.velocidadLlenado * 2 : this.velocidadLlenado) * dt,
        0,
        100,
      );
      this.tension = constrain(
        this.tension - this.disminucionTension * dt,
        0,
        100,
      );
    } else {
      this.tension = constrain(this.tension + this.aumentoTension * dt, 0, 100);
    }

    if (this.progreso >= 100) {
      this.estado = "capturado";
      this.timerFase = 2.5;
    } else if (this.tension >= 100) {
      this.estado = "linea_rota";
      this.timerFase = 2.5;
    } else if (this.tiempoLucha >= 60) {
      this.estado = "pez_escapado";
      this.timerFase = 2.0;
    }
  }

  dibujar() {
    if (this.estado === "inactivo") return;

    const shakeX = this.screenshake > 0 ? random(-5, 5) * this.screenshake : 0;
    const shakeY = this.screenshake > 0 ? random(-4, 4) * this.screenshake : 0;

    push();
    translate(shakeX, shakeY);

    if (this.estado === "lucha") {
      this._dibujarLucha();
    } else if (
      this.estado === "capturado" ||
      this.estado === "linea_rota" ||
      this.estado === "pez_escapado"
    ) {
      pop();
      this._dibujarResultado();
      return;
    } else {
      this._dibujarEnganche();
    }

    pop();
  }

  _dibujarEnganche() {
    const cx = width / 2;
    const cy = height * 0.6;

    let hundimiento = 0;
    if (this.estado === "tiron_suave") {
      hundimiento = sin((1 - this.timerFase / 0.3) * PI) * 14;
    } else if (this.estado === "doble_tiron") {
      hundimiento = sin((1 - this.timerFase / 0.5) * TWO_PI * 2) * 16;
    } else if (this.estado === "tiron_fuerte") {
      hundimiento = 30;
    }

    const corY = cy + sin(this.tiempoAnim * 2.5) * 5 + hundimiento;

    noFill();
    for (let i = 0; i < 3; i++) {
      const t = (this.tiempoAnim * 0.5 + i / 3) % 1;
      stroke(120, 200, 255, (1 - t) * 70);
      strokeWeight(1);
      ellipse(cx, cy + 4, t * 80, t * 24);
    }

    if (this.estado === "doble_tiron" || this.estado === "tiron_fuerte") {
      noStroke();
      const p = (sin(this.tiempoAnim * 9) + 1) / 2;
      fill(255, 240, 60, 50 + p * 100);
      ellipse(cx, cy + 4, 65, 22);
    }

    noStroke();
    if (this.estado === "tiron_fuerte") fill(255, 30, 30);
    else if (this.estado === "doble_tiron") fill(255, 200, 30);
    else fill(215, 70, 70);
    ellipse(cx, corY, 24, 14);

    fill(35, 140, 35);
    noStroke();
    rect(cx - 2, corY - 18, 4, 14, 2);

    let textoMsg = "";
    let colMsg = color(255);
    let tamMsg = 28;

    if (this.estado === "doble_tiron") {
      textoMsg = "¡Prepárate!";
      colMsg = color(255, 230, 50);
    } else if (this.estado === "tiron_fuerte") {
      textoMsg = "¡¡ AHORA !!";
      colMsg = color(255, 50, 50);
      tamMsg = 38;
    } else if (this.estado === "mostrando_resultado") {
      const tabla = {
        perfecto: ["¡PERFECTO!", color(255, 220, 40)],
        bueno: ["¡Enganchado!", color(80, 255, 100)],
        tarde: ["Muy tarde...", color(220, 100, 100)],
        prematuro: ["Demasiado pronto", color(220, 160, 80)],
      };
      const fila = tabla[this.resultadoEnganche];
      if (fila) {
        textoMsg = fila[0];
        colMsg = fila[1];
      }
    } else if (this.estado === "esperando_mordida") {
      fill(180, 220, 255, 140);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(13);
      text("Espera la mordida — [SPACE] para enganchar", cx, height * 0.82);
    }

    if (textoMsg) {
      fill(0, 0, 0, 110);
      noStroke();
      rect(cx - 150, cy - 86, 300, 46, 7);
      fill(colMsg);
      textAlign(CENTER, CENTER);
      textSize(tamMsg);
      text(textoMsg, cx, cy - 63);
    }

    textAlign(LEFT, BASELINE);
  }

  _dibujarLucha() {
    // Fondo gris solido para ocultar el mapa 3D durante el minijuego
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    const barAncho = 56;
    const barAlto = height * 0.62;
    const barX = width / 2 - barAncho / 2;
    const barY = height * 0.20;

    // Panel gris oscuro para enmarcar el minijuego
    fill(24, 26, 30);
    rect(barX - 75, barY - 50, barAncho + 150, barAlto + 95, 10);

    fill(16, 17, 20);
    rect(barX, barY, barAncho, barAlto, 6);

    const zonaAlto = barAlto * this.tamanoZona;
    const zonaY = barY + this.posicionZona * barAlto - zonaAlto / 2;
    const enZona =
      this.posicionPez >= this.posicionZona - this.tamanoZona / 2 &&
      this.posicionPez <= this.posicionZona + this.tamanoZona / 2;

    if (enZona) {
      const p = (sin(this.tiempoAnim * 6) + 1) / 2;
      fill(30 + p * 50, 210, 60, 240);
    } else {
      fill(35, 160, 55, 180);
    }
    rect(barX + 4, zonaY, barAncho - 8, zonaAlto, 4);

    const pezY = barY + this.posicionPez * barAlto;
    const pezCX = barX + barAncho / 2;

    fill(255, 215, 50);
    noStroke();
    ellipse(pezCX, pezY, 36, 22);
    fill(255, 175, 20);
    triangle(pezCX + 18, pezY, pezCX + 30, pezY - 10, pezCX + 30, pezY + 10);
    fill(25, 25, 25);
    circle(pezCX - 9, pezY - 3, 6);
    fill(255);
    circle(pezCX - 10, pezY - 4, 3);

    const progX = barX - 48;
    fill(16, 17, 20);
    rect(progX, barY, 24, barAlto, 5);
    const progH = barAlto * (this.progreso / 100);
    fill(55, 140, 255);
    rect(progX + 2, barY + barAlto - progH, 20, progH, 4);
    fill(180, 215, 255);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(`${floor(this.progreso)}%`, progX + 12, barY - 14);
    text("PESCA", progX + 12, barY + barAlto + 14);

    const tensX = barX + barAncho + 24;
    fill(16, 17, 20);
    rect(tensX, barY, 24, barAlto, 5);
    const tensH = barAlto * (this.tension / 100);
    let cTens;
    if (this.tension < 40) cTens = color(50, 200, 50);
    else if (this.tension < 70) cTens = color(255, 200, 40);
    else cTens = color(255, 50, 50);
    fill(cTens);
    rect(tensX + 2, barY + barAlto - tensH, 20, tensH, 4);
    fill(cTens);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(`${floor(this.tension)}%`, tensX + 12, barY - 14);
    text("TENSIÓN", tensX + 12, barY + barAlto + 14);

    if (this.pez) {
      fill(255, 220, 100);
      textSize(17);
      text(this.pez.nombre, barX + barAncho / 2, barY - 26);
    }

    fill(190, 200, 215);
    textSize(12);
    text("[SPACE] mantener", barX + barAncho / 2, barY + barAlto + 28);

    textAlign(LEFT, BASELINE);
  }

  _dibujarResultado() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    let msg = "";
    let cFondo = color(0, 0, 0, 0);
    let cTxt = color(255);

    if (this.estado === "capturado") {
      msg = "¡CAPTURADO!";
      cFondo = color(20, 150, 55, 210);
      cTxt = color(255, 240, 70);
    } else if (this.estado === "linea_rota") {
      msg = "¡Línea rota!";
      cFondo = color(150, 20, 20, 210);
      cTxt = color(255, 150, 150);
    } else {
      msg = "El pez escapó...";
      cFondo = color(50, 70, 120, 200);
      cTxt = color(170, 195, 255);
    }

    fill(cFondo);
    rect(0, 0, width, height);

    fill(0, 0, 0, 130);
    rect(width / 2 - 210, height / 2 - 50, 420, 100, 12);

    fill(cTxt);
    textAlign(CENTER, CENTER);
    textSize(46);
    text(msg, width / 2, height / 2);

    textAlign(LEFT, BASELINE);
  }
}