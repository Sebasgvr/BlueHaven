// Audio original sintetizado en Web Audio: sin descargas ni recursos de terceros.
window.AudioJuego = (() => {
  let contexto = null,
    salida = null,
    busMusica = null,
    ambiente = null,
    musica = null,
    activos = [],
    ultimoEfecto = 0;
  const estado = { iniciado: false, efectos: 0, ultimo: "", ambiente: false };
  function preparar() {
    if (contexto) return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    contexto = new AudioContextClass();
    const nodoGanancia = contexto.createGain();
    nodoGanancia.connect(contexto.destination);
    salida = nodoGanancia;
    // La música pasa por su propio bus para poder silenciarla de golpe,
    // incluso las notas de ambiente ya programadas. Los efectos van directo a la salida.
    busMusica = contexto.createGain();
    busMusica.gain.value = 1;
    busMusica.connect(salida);
    return !!contexto;
  }
  function fijarVolumen(vol) {
    if (!preparar()) return;
    salida.gain.cancelScheduledValues(contexto.currentTime);
    salida.gain.setValueAtTime(
      Math.max(0, Math.min(1, vol)),
      contexto.currentTime,
    );
  }
  function tono(
    frecuencia,
    inicio,
    duracion,
    volumen = 0.05,
    tipo = "sine",
    destino = salida,
    final = frecuencia,
  ) {
    const o = contexto.createOscillator(),
      g = contexto.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(frecuencia, inicio);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, final),
      inicio + duracion,
    );
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen, inicio + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    o.connect(g);
    g.connect(destino);
    o.start(inicio);
    o.stop(inicio + duracion + 0.03);
    activos.push(o);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
      activos = activos.filter((n) => n !== o);
    };
  }
  function ruido(duracion, inicio, volumen = 0.05, filtro = 1100) {
    const buffer = contexto.createBuffer(
        1,
        Math.ceil(contexto.sampleRate * duracion),
        contexto.sampleRate,
      ),
      d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const fuente = contexto.createBufferSource(),
      f = contexto.createBiquadFilter(),
      g = contexto.createGain();
    fuente.buffer = buffer;
    f.type = "lowpass";
    f.frequency.value = filtro;
    g.gain.setValueAtTime(volumen, inicio);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    fuente.connect(f);
    f.connect(g);
    g.connect(salida);
    fuente.start(inicio);
    activos.push(fuente);
    fuente.onended = () => {
      fuente.disconnect();
      f.disconnect();
      g.disconnect();
      activos = activos.filter((n) => n !== fuente);
    };
  }
  function efecto(nombre) {
    if (
      !preparar() ||
      contexto.state !== "running" ||
      !document.body.classList.contains("jugando") ||
      document.hidden
    )
      return;
    const t = contexto.currentTime;
    if (["pulso", "ui"].includes(nombre) && t - ultimoEfecto < 0.06) return;
    ultimoEfecto = t;
    estado.efectos++;
    estado.ultimo = nombre;
    if (nombre === "lanzar") {
      ruido(0.18, t, 0.045, 2500);
      tono(420, t, 0.2, 0.022, "sine", salida, 130);
    } else if (nombre === "agua") {
      ruido(0.42, t, 0.07, 1500);
      tono(180, t, 0.15, 0.025, "sine", salida, 70);
    } else if (nombre === "agua_suave") {
      // Salpicadura discreta: saltos de peces y picadas.
      ruido(0.26, t, 0.03, 1700);
      tono(210, t, 0.1, 0.012, "sine", salida, 90);
    } else if (nombre === "picada") {
      tono(740, t, 0.12, 0.055);
      tono(980, t + 0.14, 0.2, 0.055);
    } else if (nombre === "enganchar") {
      tono(460, t, 0.1, 0.04);
      tono(690, t + 0.08, 0.18, 0.04);
    } else if (nombre === "captura") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tono(f, t + i * 0.11, 0.45, 0.05),
      );
    } else if (nombre === "fallo") {
      tono(240, t, 0.3, 0.04, "triangle", salida, 90);
      ruido(0.15, t, 0.025, 600);
    } else if (nombre === "monedas" || nombre === "compra") {
      [880, 1175, 1568].forEach((f, i) =>
        tono(f, t + i * 0.055, 0.17, 0.035, "triangle"),
      );
    } else if (nombre === "equipar") {
      tono(520, t, 0.08, 0.03, "triangle");
      tono(780, t + 0.06, 0.1, 0.03, "triangle");
    } else if (nombre === "pulso") {
      tono(500, t, 0.055, 0.018, "triangle");
    } else tono(620, t, 0.06, 0.016);
  }
  let ultimaVozKiwifina = 0;
  function vozKiwifina(caracter = "a") {
    if (!preparar() || document.hidden) return;
    if (contexto.state === "suspended") contexto.resume();
    if (contexto.state !== "running") return;
    const t = contexto.currentTime;
    if (t - ultimaVozKiwifina < 0.038) return;
    ultimaVozKiwifina = t;

    const c = (caracter || "").toLowerCase();
    if (!c || c === " " || c === "\n" || c === "\t") return;

    let freq = 620;
    let finalFreq = 580;
    let duracion = 0.048;
    let volumen = 0.042;
    let tipo = "triangle";

    if (c === "a" || c === "á") {
      freq = 620;
      finalFreq = 580;
    } else if (c === "e" || c === "é") {
      freq = 720;
      finalFreq = 670;
    } else if (c === "i" || c === "í") {
      freq = 840;
      finalFreq = 790;
    } else if (c === "o" || c === "ó") {
      freq = 520;
      finalFreq = 480;
    } else if (c === "u" || c === "ú") {
      freq = 460;
      finalFreq = 430;
    } else if (c === "?" || c === "¿") {
      freq = 580;
      finalFreq = 920;
      duracion = 0.075;
      volumen = 0.05;
    } else if (c === "!" || c === "¡") {
      freq = 880;
      finalFreq = 680;
      duracion = 0.065;
      volumen = 0.05;
    } else if (c === "." || c === ",") {
      freq = 460;
      finalFreq = 430;
      duracion = 0.035;
      volumen = 0.025;
    } else {
      const code = c.charCodeAt(0);
      freq = 520 + (code % 10) * 32;
      finalFreq = freq + ((code % 3) - 1) * 35;
    }

    tono(freq, t, duracion, volumen, tipo, salida, finalFreq);
  }
  function efectoEmote(tipo = "sorpresa") {
    if (!preparar() || document.hidden) return;
    if (contexto.state === "suspended") contexto.resume();
    if (contexto.state !== "running") return;
    const t = contexto.currentTime;

    if (tipo === "sorpresa") {
      // Exclamación aguda y repentina estilo Animal Crossing
      tono(540, t, 0.12, 0.055, "triangle", salida, 1250);
      tono(1150, t + 0.03, 0.09, 0.045, "sine");
    } else if (tipo === "alegria" || tipo === "musica") {
      // Campanitas alegres (arpegio de 3 notas)
      tono(784, t, 0.09, 0.04, "triangle");
      tono(988, t + 0.075, 0.09, 0.04, "triangle");
      tono(1318, t + 0.15, 0.22, 0.048, "sine");
    } else if (tipo === "idea") {
      // Ting brillante de bombilla encendida
      tono(1046, t, 0.08, 0.04, "sine");
      tono(2093, t, 0.22, 0.035, "sine");
    } else if (tipo === "sudor") {
      // Tono descendente cómico de incomodidad / sin dinero
      tono(380, t, 0.16, 0.045, "triangle", salida, 220);
      tono(220, t + 0.1, 0.24, 0.038, "sine", salida, 130);
    } else if (tipo === "corazon") {
      // Dos notas cálidas ascendentes
      tono(659, t, 0.12, 0.04, "sine");
      tono(880, t + 0.07, 0.2, 0.045, "sine");
    }
  }
  function acorde() {
    if (
      !estado.iniciado ||
      contexto?.state !== "running" ||
      document.hidden ||
      !document.body.classList.contains("jugando") ||
      !opcionesGraficas.musica
    )
      return;
    const base = [130.81, 146.83, 164.81, 196][Math.floor(Math.random() * 4)],
      t = contexto.currentTime;
    [1, 1.5, 2].forEach((n, i) =>
      tono(base * n, t + i * 0.2, 4.5, 0.012, "sine", busMusica),
    );
    if (Math.random() < 0.5) {
      tono(1568, t + 3, 0.12, 0.009, "sine", busMusica, 2093);
      tono(1760, t + 3.18, 0.1, 0.007, "sine", busMusica);
    }
  }

  let timerPajaros = null;
  let timerGotas = null;

  function cantarPajaro() {
    if (
      !preparar() ||
      contexto?.state !== "running" ||
      !document.body.classList.contains("jugando") ||
      document.hidden ||
      !opcionesGraficas.musica
    )
      return;

    const t = contexto.currentTime;
    const tipo = Math.floor(Math.random() * 5);
    const varPitch = 0.88 + Math.random() * 0.24;

    if (tipo === 0) {
      // Zorzal / gorrión: doble pío rápido ascendente
      tono(
        2400 * varPitch,
        t,
        0.065,
        0.015,
        "sine",
        busMusica,
        3200 * varPitch,
      );
      tono(
        2900 * varPitch,
        t + 0.085,
        0.08,
        0.017,
        "sine",
        busMusica,
        3850 * varPitch,
      );
    } else if (tipo === 1) {
      // Trino triple de bosque en staccato
      tono(
        3300 * varPitch,
        t,
        0.045,
        0.014,
        "sine",
        busMusica,
        3050 * varPitch,
      );
      tono(
        3550 * varPitch,
        t + 0.06,
        0.045,
        0.015,
        "sine",
        busMusica,
        3250 * varPitch,
      );
      tono(
        3800 * varPitch,
        t + 0.12,
        0.075,
        0.016,
        "sine",
        busMusica,
        2900 * varPitch,
      );
    } else if (tipo === 2) {
      // Melodía suave de jilguero con vibrato
      tono(2200 * varPitch, t, 0.1, 0.014, "sine", busMusica, 2950 * varPitch);
      tono(
        3050 * varPitch,
        t + 0.12,
        0.11,
        0.017,
        "sine",
        busMusica,
        2550 * varPitch,
      );
      tono(
        2650 * varPitch,
        t + 0.25,
        0.085,
        0.013,
        "sine",
        busMusica,
        3250 * varPitch,
      );
    } else if (tipo === 4) {
      // Gaviota: el clásico "kyow" agudo y descendente, en dos tiempos
      tono(
        1500 * varPitch,
        t,
        0.28,
        0.014,
        "sawtooth",
        busMusica,
        850 * varPitch,
      );
      tono(
        1350 * varPitch,
        t + 0.34,
        0.34,
        0.012,
        "sawtooth",
        busMusica,
        720 * varPitch,
      );
    } else {
      // Llamado suave lejano de ave de lago
      tono(1850 * varPitch, t, 0.2, 0.013, "sine", busMusica, 2350 * varPitch);
      tono(
        2300 * varPitch,
        t + 0.22,
        0.16,
        0.011,
        "sine",
        busMusica,
        1750 * varPitch,
      );
    }
  }

  function programarSiguientePajaro() {
    if (!musica) return;
    const demora = 4200 + Math.random() * 5200;
    timerPajaros = setTimeout(() => {
      cantarPajaro();
      programarSiguientePajaro();
    }, demora);
  }

  function chapoteoAgua() {
    if (
      !preparar() ||
      contexto?.state !== "running" ||
      !document.body.classList.contains("jugando") ||
      document.hidden ||
      !opcionesGraficas.musica
    )
      return;

    const t = contexto.currentTime;
    const freq = 420 + Math.random() * 260;
    tono(freq, t, 0.07, 0.014, "sine", busMusica, freq * 0.55);
    ruido(0.09, t, 0.007, 950);
  }

  function programarSiguienteGota() {
    if (!musica) return;
    const demora = 4800 + Math.random() * 5800;
    timerGotas = setTimeout(() => {
      chapoteoAgua();
      programarSiguienteGota();
    }, demora);
  }

  function detenerMusica() {
    if (musica) {
      clearInterval(musica);
      musica = null;
    }
    if (timerPajaros) {
      clearTimeout(timerPajaros);
      timerPajaros = null;
    }
    if (timerGotas) {
      clearTimeout(timerGotas);
      timerGotas = null;
    }
    if (ambiente) {
      try {
        ambiente.fuente.stop();
        ambiente.fuente.disconnect();
        if (ambiente.lfo) {
          ambiente.lfo.stop();
          ambiente.lfo.disconnect();
        }
        if (ambiente.lfoFiltro) ambiente.lfoFiltro.disconnect();
        if (ambiente.lfoVol) ambiente.lfoVol.disconnect();
        ambiente.f.disconnect();
        ambiente.g.disconnect();
      } catch (_) {}
      ambiente = null;
    }
    // Corta también las notas de ambiente que ya estaban sonando.
    if (busMusica && contexto) {
      try {
        busMusica.gain.cancelScheduledValues(contexto.currentTime);
        busMusica.gain.setValueAtTime(0, contexto.currentTime);
      } catch (_) {}
    }
    estado.ambiente = false;
  }
  function iniciarMusica() {
    if (
      musica ||
      !preparar() ||
      contexto.state !== "running" ||
      !document.body.classList.contains("jugando") ||
      document.hidden
    )
      return;
    const duracion = 5,
      buffer = contexto.createBuffer(
        1,
        contexto.sampleRate * duracion,
        contexto.sampleRate,
      ),
      d = buffer.getChannelData(0);
    // Reabre el bus de música por si se había silenciado antes.
    try {
      busMusica.gain.cancelScheduledValues(contexto.currentTime);
      busMusica.gain.setValueAtTime(1, contexto.currentTime);
    } catch (_) {}
    let anterior = 0;
    for (let i = 0; i < d.length; i++) {
      anterior = (anterior + Math.random() * 0.038 - 0.019) / 1.018;
      d[i] = anterior * 2.6;
    }
    const fuente = contexto.createBufferSource(),
      f = contexto.createBiquadFilter(),
      g = contexto.createGain();
    fuente.buffer = buffer;
    fuente.loop = true;

    // Filtro para el oleaje suave
    f.type = "lowpass";
    f.frequency.value = 460;
    f.Q.value = 1.1;

    // Ganancia base del agua
    g.gain.value = 0.065;

    // LFO que modula el vaivén rítmico de las olas (sube y baja cada ~4.5s)
    const lfo = contexto.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.22;

    const lfoFiltro = contexto.createGain();
    lfoFiltro.gain.value = 240;
    lfo.connect(lfoFiltro);
    lfoFiltro.connect(f.frequency);

    const lfoVol = contexto.createGain();
    lfoVol.gain.value = 0.028;
    lfo.connect(lfoVol);
    lfoVol.connect(g.gain);

    fuente.connect(f);
    f.connect(g);
    g.connect(busMusica);

    fuente.start();
    lfo.start();

    ambiente = { fuente, f, g, lfo, lfoFiltro, lfoVol };
    estado.ambiente = true;

    acorde();
    musica = setInterval(acorde, 7000);
    programarSiguientePajaro();
    programarSiguienteGota();
  }
  function fijarMusicaAmbiente(activada) {
    if (activada) {
      iniciarMusica();
    } else {
      detenerMusica();
    }
  }
  function iniciar() {
    if (
      estado.iniciado ||
      !preparar() ||
      !document.body.classList.contains("jugando") ||
      document.hidden
    )
      return;
    estado.iniciado = true;
    const permitirMusica =
      typeof opcionesGraficas === "undefined" ||
      opcionesGraficas.musica !== false;
    if (permitirMusica) {
      iniciarMusica();
    }
  }
  function pausar() {
    detenerMusica();
    for (const n of [...activos]) {
      try {
        n.stop();
      } catch (_) {}
    }
    activos = [];
    estado.iniciado = false;
  }
  function actualizar() {
    if (document.hidden || !document.body.classList.contains("jugando"))
      pausar();
    else iniciar();
  }
  function desbloquear() {
    if (preparar() && contexto.state === "suspended")
      contexto
        .resume()
        .then(actualizar)
        .catch(() => {});
    else actualizar();
  }
  document.addEventListener("pointerdown", desbloquear, { capture: true });
  document.addEventListener("keydown", desbloquear, { capture: true });
  document.addEventListener("visibilitychange", actualizar);
  document.addEventListener("click", (e) => {
    if (e.target.closest("button")) efecto("ui");
  });
  // ── Campanilla de viento (tintinear al entrar/salir de la tienda) ──────────
  function campanillaTienda(suave = false) {
    if (!preparar() || document.hidden) return;
    if (contexto.state === "suspended") contexto.resume();
    const t = contexto.currentTime;
    const vol = suave ? 0.018 : 0.028;
    // Tres campanadas metálicas ligeramente desafinadas (efecto bambú/vidrio)
    tono(2093, t,        suave ? 0.9 : 1.2, vol,        "sine", salida, 2060);
    tono(2637, t + 0.12, suave ? 0.8 : 1.1, vol * 0.85, "sine", salida, 2600);
    tono(1760, t + 0.26, suave ? 0.7 : 1.0, vol * 0.7,  "sine", salida, 1730);
    // Armónicos tenues para darle cuerpo metálico
    tono(4186, t + 0.04, 0.3, vol * 0.3, "sine", salida, 4100);
    tono(5274, t + 0.16, 0.25, vol * 0.2, "sine", salida, 5200);
  }
  return {
    estado,
    efecto,
    efectoEmote,
    vozKiwifina,
    campanillaTienda,
    iniciar,
    pausar,
    actualizar,
    desbloquear,
    fijarVolumen,
    fijarMusicaAmbiente,
  };
})();
