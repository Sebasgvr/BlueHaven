const PECES_CAPTURA = CATALOGO_ESPECIES;

function elegirPezAleatorio() {
  const peso = pez => (pez.pesoSeleccion || 1) * (1+(efectosLance.atraccion||0)*(pez.rareza-1));
  const total = PECES_CAPTURA.reduce((suma, pez) => suma + peso(pez), 0);
  let tirada = random(total);
  for (const pez of PECES_CAPTURA) {
    tirada -= peso(pez);
    if (tirada <= 0) return pez;
  }
  return PECES_CAPTURA[0];
}

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

    this.minijuego = null;
  }

  iniciar(pez) {
    // Clonamos la plantilla para no fijar la calidad de la especie.
    const calidad = rollCalidad();
    this.pez = Object.assign({}, pez, {
      calidadId: calidad.id,
      multiplicadorCalidad: calidad.multiplicador,
      escalaDificultad: efectosLance.dificultad,
      capturaRiesgo: false,
      precio: 0,
      mecanicasActivas: [],
    });

    this.estado = "esperando_mordida";
    this.timerEspera = random(3, 8) * efectosLance.espera;
    this.ventanaTiming = 0.4 + efectosLance.enganche;
    this.tiempoAnim = 0;
    this.resultadoEnganche = "";
    this.screenshake = 0;
    this.progresoLanzamiento = 0;
    this.riesgo = false;
    this.minijuego = null;
  }

  presionarBoton(entrada) {
    if (
      this.estado === "esperando_mordida" ||
      this.estado === "tiron_suave" ||
      this.estado === "doble_tiron"
    ) {
      this.resultadoEnganche = "prematuro";
      this.estado = "mostrando_resultado";
      this.timerFase = 0.8;
    } else if (this.estado === "tiron_fuerte") {
      window.AudioJuego?.efecto('enganchar');
      this.resultadoEnganche = this.timerEnganche < 0.2 ? "perfecto" : "bueno";
      this.estado = "mostrando_resultado";
      this.timerFase = 0.6;
    } else if (this.estado === "lucha") {
      window.AudioJuego?.efecto("pulso");
      if (this.minijuego) this.minijuego.presionarBoton(entrada);
    } else if (this.estado === "decidiendo_riesgo") {
      if (this.timerFase <= 0) this.elegirRiesgo(false);
    }
  }

  elegirRiesgo(arriesgar) {
    if (this.estado !== "decidiendo_riesgo") return;
    const calidad = calidadDe(this.pez);
    this.riesgo = !!arriesgar;
    this.pez.capturaRiesgo = this.riesgo;
    this.pez.escalaDificultad = (this.riesgo ? calidad.escalaDificultad : 1) * efectosLance.dificultad;
    this.pez.mecanicasActivas = calcularMecanicas(this.pez, this.riesgo);
    this._crearMinijuego();
  }

  presionarTecla(tecla, keyCode) {
    if (this.estado === "lucha" && this.minijuego) {
      if (this.minijuego.aceptaTeclas()) {
        window.AudioJuego?.efecto("pulso");
        this.minijuego.presionarBoton({ tecla, keyCode });
      }
    }
  }

  soltarBoton() {
    if (this.minijuego) this.minijuego.soltarBoton();
  }

  soltarTecla(tecla, keyCode) {
    if (this.estado === "lucha" && this.minijuego) {
      this.minijuego.soltarTecla({ tecla, keyCode });
    }
  }

  cancelar() {
    this.estado = "inactivo";
    this.minijuego = null;
  }

  actualizar() {
    const dt = Math.min(deltaTime / 1000, 0.05);
    this.tiempoAnim += dt;
    if (this.estado !== "inactivo") {
      this.progresoLanzamiento = Math.min(
        1,
        this.progresoLanzamiento + dt * 2.8,
      );
    }
    if (this.screenshake > 0)
      this.screenshake = max(0, this.screenshake - dt * 3);

    switch (this.estado) {
      case "esperando_mordida":
        this.timerEspera -= dt;
        if (this.timerEspera <= 0) {
          window.AudioJuego?.efecto('picada');
          const calidad = calidadDe(this.pez);
          if (this.pez && this.pez.rareza <= 1 && calidad.id === "comun") {
            this._crearMinijuego();
          } else if (this.pez && this.pez.rareza <= 1) {
            this._irADecision();
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
            if (calidadDe(this.pez).id === "comun") {
              this._crearMinijuego();
            } else {
              this._irADecision();
            }
          } else {
            window.AudioJuego?.efecto("fallo");
            this.estado = "esperando_mordida";
            this.timerEspera = random(6, 14);
          }
        }
        break;

      case "decidiendo_riesgo":
        if (this.timerFase > 0) this.timerFase -= dt;
        break;

      case "lucha":
        if (this.minijuego) {
          this.minijuego.actualizar(dt);
          if (this.minijuego.resultado) {
            this.estado = this.minijuego.resultado;
            if(this.estado!=='capturado')window.AudioJuego?.efecto('fallo');
            this.timerFase = this.estado === "pez_escapado" ? 2.0 : 2.5;
            this.minijuego = null;
          }
        } else {
          this.estado = "inactivo";
        }
        break;

      case "capturado": {
        // Se guarda una sola vez y la ficha permanece hasta que el jugador la cierre.
        const ejemplar={...this.pez,precio:calcularPrecio(this.pez)};
        this.estado="inactivo";
        mostrarTarjetaCaptura(ejemplar);
        break;
      }
      case "linea_rota":
      case "pez_escapado":
        this.timerFase -= dt;
        if (this.timerFase <= 0) {
          this.estado = "inactivo";
        }
        break;
    }
  }

  _irADecision() {
    this.estado = "decidiendo_riesgo";
    this.timerFase = 0.45; // evita que el SPACE del enganche elija sin querer
    this.screenshake = 0;
  }

  _crearMinijuego() {
    if (!this.pez.mecanicasActivas) this.pez.mecanicasActivas = [];
    const ClaseMinijuego =
      MINIJUEGOS_POR_RAREZA[this.pez.rareza] || MinijuegoBrújula;
    this.minijuego = enEspacioPesca(()=>new ClaseMinijuego(this.pez));
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
    } else if (this.estado === "decidiendo_riesgo") {
      pop();
      this._dibujarDecision();
      return;
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
      text(
        "Espera la mordida — [SPACE] enganchar · [F] recoger",
        cx,
        height * 0.82,
      );
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

    if (this.pez && this.estado !== "esperando_mordida") {
      const calidad = calidadDe(this.pez);
      fill(0, 0, 0, 120);
      noStroke();
      rect(cx - 90, height * 0.15 - 16, 180, 34, 8);
      dibujarEtiquetaCalidad(calidad, cx, height * 0.15 + 1, 12, "centro");
    }

    textAlign(LEFT, BASELINE);
  }

  _dibujarDecision() {
    const cx = width / 2;
    const calidad = calidadDe(this.pez);

    fill(16, 20, 28);
    noStroke();
    rect(0, 0, width, height);

    noStroke();
    for (let i = 3; i >= 1; i--) {
      fill(calidad.color[0], calidad.color[1], calidad.color[2], 12 * i);
      ellipse(cx, height * 0.42, 90 + i * 34, 90 + i * 34);
    }

    fill(255, 225, 120);
    textAlign(CENTER, CENTER);
    textSize(22);
    text(this.pez.nombre, cx, height * 0.14);

    const imagen = this.pez.sprite && spritesPeces[this.pez.sprite];
    if (imagen) {
      image(imagen, cx - 40, height * 0.22, 80, 80);
    } else {
      fill(45, 52, 64);
      rect(cx - 40, height * 0.22, 80, 80, 10);
      fill(150, 165, 185);
      textSize(28);
      text("?", cx, height * 0.22 + 40);
    }

    dibujarEtiquetaCalidad(calidad, cx, height * 0.46, 16, "centro");

    const base = precioBaseDe(this.pez);
    const valorSeguro = Math.round(base * calidad.multiplicador);
    const valorRiesgo = Math.round(base * calidad.multiplicador * BONUS_RIESGO);
    const escalaPct = Math.round((calidad.escalaDificultad - 1) * 100);

    fill(220, 232, 245);
    textSize(14);
    text(
      "Valor del ejemplar: x" + calidad.multiplicador.toFixed(2),
      cx,
      height * 0.52,
    );

    fill(150, 220, 255);
    textSize(12);
    text(
      "Seguro: $" + valorSeguro + " · dificultad normal",
      cx,
      height * 0.575,
    );
    fill(255, 195, 90);
    text(
      "Arriesgar: $" + valorRiesgo + " · dificultad +" + escalaPct + "%",
      cx,
      height * 0.62,
    );

    // La calidad define las mecánicas de cada modo.
    const mecanicasSeguras = calcularMecanicas(this.pez, false);
    const mecanicasRiesgo = calcularMecanicas(this.pez, true);
    const nombresSeguros =
      mecanicasSeguras.length > 0
        ? nombresMecanicas(mecanicasSeguras).join(" · ")
        : "ninguna";
    const nombresRiesgo =
      mecanicasRiesgo.length > 0
        ? nombresMecanicas(mecanicasRiesgo).join(" · ")
        : "ninguna";

    fill(190, 205, 225);
    textSize(10);
    text("Mecánicas del ejemplar", cx, height * 0.67);
    fill(150, 220, 255);
    text(
      "Normal (" + mecanicasSeguras.length + "): " + nombresSeguros,
      cx,
      height * 0.71,
      Math.min(width - 60, 820),
    );
    fill(255, 195, 90);
    text(
      "Riesgo (" + mecanicasRiesgo.length + "): " + nombresRiesgo,
      cx,
      height * 0.75,
      Math.min(width - 60, 820),
    );

    const cajaY = height * 0.81;
    const cajaW = Math.min(210, width * 0.38);
    const cajaH = 44;
    const sep = 18;

    fill(25, 75, 55, 240);
    stroke(70, 180, 120);
    strokeWeight(1.5);
    rect(cx - cajaW - sep / 2, cajaY, cajaW, cajaH, 8);
    fill(170, 255, 195);
    noStroke();
    textSize(13);
    text("[SPACE]  Pelea normal", cx - cajaW / 2 - sep / 4, cajaY + cajaH / 2);

    fill(95, 55, 20, 240);
    stroke(255, 170, 70);
    strokeWeight(1.5);
    rect(cx + sep / 2, cajaY, cajaW, cajaH, 8);
    fill(255, 210, 140);
    noStroke();
    text("[F]  Arriesgar", cx + cajaW / 2 + sep / 4, cajaY + cajaH / 2);

    fill(160, 175, 195);
    textSize(11);
    text("Si arriesgás y fallás, el ejemplar se escapa.", cx, height * 0.9);

    textAlign(LEFT, BASELINE);
  }

  _dibujarResultado() {
    fill(38, 40, 46);
    noStroke();
    rect(0, 0, width, height);

    const calidad = calidadDe(this.pez);
    let msg = "";
    let cFondo = color(0, 0, 0, 0);
    let cTxt = color(255);

    if (this.estado === "capturado") {
      msg = "¡CAPTURADO!";
      cFondo = color(
        calidad.color[0] * 0.28,
        calidad.color[1] * 0.28,
        calidad.color[2] * 0.28,
        235,
      );
      cTxt = color(255, 240, 90);
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

    const cx = width / 2;
    const cy = height / 2;

    if (this.estado === "capturado" && calidad.nivel >= 4) {
      noStroke();
      for (let i = 0; i < 22; i++) {
        const angulo = this.tiempoAnim * 0.9 + i * 0.62;
        const radio = 55 + (i % 6) * 22 + sin(this.tiempoAnim * 2 + i) * 9;
        const px = cx + cos(angulo) * radio * 1.7;
        const py = cy + sin(angulo) * radio;
        const brillo = (sin(this.tiempoAnim * 3 + i) + 1) / 2;
        fill(
          calidad.color[0],
          calidad.color[1],
          calidad.color[2],
          70 + brillo * 130,
        );
        ellipse(px, py, 3 + brillo * 4, 3 + brillo * 4);
      }
    }

    if (this.estado === "capturado") {
      fill(8, 12, 18, 190);
      noStroke();
      rect(cx - 235, cy - 118, 470, 236, 16);

      fill(cTxt);
      textAlign(CENTER, CENTER);
      textSize(42);
      text(msg, cx, cy - 78);

      fill(255);
      textSize(22);
      text(this.pez.nombre, cx, cy - 32);

      dibujarEtiquetaCalidad(calidad, cx, cy + 2, 15, "centro");

      fill(255, 230, 150);
      textSize(20);
      text("$" + precioDe(this.pez), cx, cy + 38);

      textSize(12);
      if (this.pez.capturaRiesgo) {
        fill(255, 195, 90);
        text(
          "Bonus por riesgo +" + Math.round((BONUS_RIESGO - 1) * 100) + "%",
          cx,
          cy + 62,
        );
      } else {
        fill(170, 200, 230);
        text("Captura segura", cx, cy + 62);
      }

      if (this.pez.capturaRiesgo && calidad.nivel >= 4) {
        fill(255, 235, 150);
        textSize(11);
        text(
          "¡Ejemplar " + calidad.nombre.toLowerCase() + " asegurado!",
          cx,
          cy + 82,
        );
      }
    } else {
      fill(0, 0, 0, 150);
      rect(cx - 210, cy - 50, 420, 100, 12);

      fill(cTxt);
      textAlign(CENTER, CENTER);
      textSize(42);
      text(msg, cx, cy - 8);

      if (this.pez && calidad.id !== "comun") {
        fill(190, 205, 225);
        textSize(13);
        text(
          "Se te escapó un ejemplar " + calidad.nombre.toLowerCase(),
          cx,
          cy + 28,
        );
      }
    }

    textAlign(LEFT, BASELINE);
  }
}
