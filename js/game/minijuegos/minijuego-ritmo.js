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
