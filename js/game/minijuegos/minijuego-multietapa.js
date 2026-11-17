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
