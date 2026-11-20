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
    if (teclaJuegoPresionada(LEFT_ARROW) || teclaJuegoPresionada(65))
      control -= 1;
    if (teclaJuegoPresionada(RIGHT_ARROW) || teclaJuegoPresionada(68))
      control += 1;
    control = constrain(
      control + (window.ControlTactil?.analogico.x || 0),
      -1,
      1,
    );
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
