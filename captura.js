const PECES_CAPTURA = [
  { nombre: "Carpa", rareza: 1, velocidad: 1.0 },
  { nombre: "Trucha Arcoíris", rareza: 2, velocidad: 1.8 },
  { nombre: "Dragón del Lago", rareza: 3, velocidad: 3.0 },
  { nombre: "Esturión Gigante", rareza: 4, velocidad: 3.6 },
  { nombre: "Pez Remo", rareza: 5, velocidad: 4.2 },
];

// Cada rareza usa un minijuego distinto.
const MINIJUEGOS_POR_RAREZA = {
  1: MinijuegoAnillo,
  2: MinijuegoBrújula,
  3: MinijuegoRitmo,
  4: MinijuegoEsquiva,
  5: MinijuegoMultietapa,
};

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
    this.progresoLanzamiento = 0;

    this.minijuego = null; // minijuego activo, segun la rareza del pez
  }

  iniciar(pez) {
    this.pez = pez;
    this.estado = "esperando_mordida";
    this.timerEspera = random(3, 8);
    this.tiempoAnim = 0;
    this.resultadoEnganche = "";
    this.screenshake = 0;
    this.progresoLanzamiento = 0;
    this.minijuego = null;
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
      if (this.minijuego) this.minijuego.presionarBoton();
    }
  }

  soltarBoton() {
    if (this.minijuego) this.minijuego.soltarBoton();
  }

  cancelar() {
    this.estado = "inactivo";
    this.minijuego = null;
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
          if (this.pez && this.pez.rareza <= 1) {
            // los peces comunes van directo al minijuego, sin enganche previo
            this._crearMinijuego();
          } else {
            this.estado = "tiron_suave";
            this.timerFase = 0.3;
          }
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
            this._crearMinijuego();
          } else {
            this.estado = "esperando_mordida";
            this.timerEspera = random(6, 14);
          }
        }
        break;

      case "lucha":
        if (this.minijuego) {
          this.minijuego.actualizar(dt);
          if (this.minijuego.resultado) {
            this.estado = this.minijuego.resultado;
            this.timerFase = this.estado === "pez_escapado" ? 2.0 : 2.5;
            this.minijuego = null;
          }
        } else {
          this.estado = "inactivo";
        }
        break;

      case "capturado":
      case "linea_rota":
      case "pez_escapado":
        this.timerFase -= dt;
        if (this.timerFase <= 0) this.estado = "inactivo";
        break;
    }
  }

  _crearMinijuego() {
    const ClaseMinijuego =
      MINIJUEGOS_POR_RAREZA[this.pez.rareza] || MinijuegoBrújula;
    this.minijuego = new ClaseMinijuego(this.pez);
    this.estado = "lucha";
  }

  dibujar() {
    if (this.estado === "inactivo") return;

    const shakeX = this.screenshake > 0 ? random(-5, 5) * this.screenshake : 0;
    const shakeY = this.screenshake > 0 ? random(-4, 4) * this.screenshake : 0;

    push();
    translate(shakeX, shakeY);

    if (this.estado === "lucha") {
      this.minijuego.dibujar();
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