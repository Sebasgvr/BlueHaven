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
  function detenerMusica() {
    if (musica) {
      clearInterval(musica);
      musica = null;
    }
    if (ambiente) {
      try {
        ambiente.fuente.stop();
        ambiente.fuente.disconnect();
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
    const duracion = 4,
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
      anterior = (anterior + Math.random() * 0.04 - 0.02) / 1.025;
      d[i] = anterior * 2;
    }
    const fuente = contexto.createBufferSource(),
      f = contexto.createBiquadFilter(),
      g = contexto.createGain();
    fuente.buffer = buffer;
    fuente.loop = true;
    f.type = "lowpass";
    f.frequency.value = 850;
    g.gain.value = 0.12;
    fuente.connect(f);
    f.connect(g);
    g.connect(busMusica);
    fuente.start();
    ambiente = { fuente, f, g };
    estado.ambiente = true;
    acorde();
    musica = setInterval(acorde, 7000);
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
  return {
    estado,
    efecto,
    iniciar,
    pausar,
    actualizar,
    desbloquear,
    fijarVolumen,
    fijarMusicaAmbiente,
  };
})();
