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
    dx += window.ControlTactil?.analogico.x || 0;
    dy += window.ControlTactil?.analogico.y || 0;
    const magnitud = Math.hypot(dx, dy);
    if (magnitud > 1) {
      dx /= magnitud;
      dy /= magnitud;
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
