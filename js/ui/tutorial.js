// Sistema de tutorial guiado para cuentas nuevas y manual interactivo de minijuegos.
(() => {
  const MINIJUEGOS_INFO = [
    {
      rareza: 1,
      id: "mini-1",
      icono: "🎯",
      tabCorto: "Anillo",
      nombre: "Anillo de Precisión",
      especies: "Carpa (Rareza 1)",
      objetivo:
        "Completar la barra verde (60 pts) a lo largo de 3 ciclos encogiendo el anillo hasta el núcleo amarillo.",
      controlesPC: "Clic izquierdo o [Espacio] cuando el anillo llegue al centro.",
      controlesTactil: "Botón [Pulsar anillo] cuando el anillo llegue al centro.",
      puntaje:
        "Amarillo (¡PERFECTO!): +50 pts · Verde (¡Bien!): +25 pts · Muy temprano: no avanza.",
      mecanicas: [
        ["Doble pulso", "Cada ciclo pide pulsar dos veces seguidas."],
        ["Anillo falso", "Si el anillo aparece ROJO, NO lo toques: esperá a que desaparezca."],
        ["Zona móvil", "Un arco dorado gira alrededor; acertar cuando pasa arriba garantiza ¡PERFECTO!"],
      ],
    },
    {
      rareza: 2,
      id: "mini-2",
      icono: "🧭",
      tabCorto: "Brújula",
      nombre: "Brújula de Tensión",
      especies: "Trucha Arcoíris, Atún, Pez Globo (Rareza 2)",
      objetivo:
        "Mantener la aguja dentro del arco verde superior hasta llegar a 100% PESCA sin que TENSIÓN alcance 100%.",
      controlesPC:
        "[A] / [D] o [←] / [→] para centrar la aguja. Mantené [Espacio] o [Clic] para frenar los tirones.",
      controlesTactil:
        "Joystick izquierdo para inclinar la aguja. Mantené [Frenar] para amortiguar tirones.",
      puntaje:
        "Dentro del arco verde: sube PESCA (+11%/s) y baja TENSIÓN. Fuera: la TENSIÓN sube rápido.",
      mecanicas: [
        ["Canal móvil", "La zona verde se desplaza lentamente de lado a lado."],
        ["Ráfagas", "El pez avisa con un cartel antes de dar un tirón mucho más fuerte."],
        ["Nudo", "Cuando aparece un nudo abajo, mantené [Espacio] para agarrarlo y soltá para deshacerlo (+10% PESCA)."],
      ],
    },
    {
      rareza: 3,
      id: "mini-3",
      icono: "🎵",
      tabCorto: "Ritmo",
      nombre: "Ritmo por Carriles",
      especies: "Calamar, Dragón del Lago (Rareza 3)",
      objetivo:
        "Acertar las notas que descienden por los 3 carriles al cruzar la línea blanca inferior para alcanzar 100% PESCA.",
      controlesPC:
        "[A] (o Z) carril izquierdo · [S] (o X) carril central · [D] (o C) carril derecho.",
      controlesTactil:
        "Tres botones táctiles [A], [S] y [D] en pantalla (admite pulsar dos a la vez).",
      puntaje:
        "¡PERFECTO! (+13%, -5% tensión) · ¡BIEN! (+8%) · Casi (+4%). Fallar o tocar al aire sube tensión.",
      mecanicas: [
        ["Notas dobles", "Dos notas caen al mismo tiempo en dos carriles distintos (pulsá ambos)."],
        ["Notas falsas", "Notas ROJAS con una X: NO las toques o perdés progreso y sube la tensión."],
        ["Notas largas", "Notas celestes con cola: mantené presionada la tecla hasta que se consuman."],
      ],
    },
    {
      rareza: 4,
      id: "mini-4",
      icono: "🌊",
      tabCorto: "Esquiva",
      nombre: "Evasión de Obstáculos",
      especies: "Esturión Gigante, Ballena Azul (Rareza 4)",
      objetivo:
        "Resistir recogiendo el sedal hasta 100% PESCA esquivando basura marina y amenazas dentro de la arena.",
      controlesPC: "[W] [A] [S] [D] o Flechas para mover el pez en 2D.",
      controlesTactil: "Joystick analógico izquierdo para mover libremente el pez.",
      puntaje:
        "El progreso sube de forma continua mientras evitas golpes. Cada choque suma +6% TENSIÓN (+14%/15% en amenazas especiales).",
      mecanicas: [
        ["Basura zigzag", "Obstáculos con halo azul oscilan lateralmente al cruzar la arena."],
        ["Pez perseguidor", "Un pez rojo te sigue durante unos segundos; mantenete en movimiento."],
        ["Pared con hueco", "Cae una barrera horizontal: alineate con el hueco verde para cruzar (+4% PESCA)."],
      ],
    },
    {
      rareza: 5,
      id: "mini-5",
      icono: "⚡",
      tabCorto: "Multietapa",
      nombre: "Desafío Multietapa",
      especies: "Pez Remo (Rareza 5 — Legendario de especie)",
      objetivo:
        "Superar 4 fases consecutivas en una sola pelea sin que se rompa la línea.",
      controlesPC:
        "Combina los controles de Anillo ([Espacio]/Clic), Ritmo ([A][S][D]) y Esquiva ([WASD]).",
      controlesTactil:
        "Los botones táctiles se adaptan automáticamente al cambiar entre las 4 fases.",
      puntaje:
        "1/4 Acechando (Anillo ×2) → 2/4 Frenando (Ritmo 9 notas) → 3/4 Torbellino (Esquiva) → 4/4 ¡El Momento! (Anillo exigiendo ¡PERFECTO!).",
      mecanicas: [
        ["Transición QTE", "Entre fases aparece una barra: pulsá [Espacio]/Clic en la zona verde para bajar tensión y ganar +8% inicio."],
        ["Sprint final", "La 4.ª fase (¡SPRINT FINAL!) aumenta la velocidad de cierre del anillo."],
        ["Tensión compartida", "La tensión acumulada se traslada de una fase a la siguiente; si llega a 100%, se corta."],
      ],
    },
  ];

  const PASOS_GUIADO = [
    {
      id: "controles",
      titulo: "1. Movete y mirá el lago",
      objetivo: "Desplazate por el muelle o la orilla para probar los controles.",
      textoPC:
        "Movete con [W][A][S][D], saltá con [Espacio] y agachate con [Ctrl]. Hacé clic en el escenario para girar con el mouse ([P] libera el cursor).",
      textoTactil:
        "Usá el joystick analógico izquierdo para caminar, el botón Saltar y deslizá el dedo por el lado derecho para mirar.",
      comprobar: () => {
        if (typeof jugador === "undefined" || !jugador?.posicion) return false;
        if (!origenPaso1) {
          origenPaso1 = { x: jugador.posicion.x, y: jugador.posicion.y };
          return false;
        }
        const dx = jugador.posicion.x - origenPaso1.x;
        const dz = jugador.posicion.y - origenPaso1.y;
        return Math.hypot(dx, dz) >= 24;
      },
    },
    {
      id: "lanzar",
      titulo: "2. Lanzá la caña al agua",
      objetivo: "Acercate a la orilla del lago y lanzá el anzuelo al agua.",
      textoPC:
        "Mirá hacia el agua hasta ver el aviso «[F] Lanzar al agua» y presioná [F]. Si apuntás a tierra firme, la línea vuelve sola.",
      textoTactil:
        "Acercate al agua mirando hacia el lago y tocá el botón [Lanzar caña].",
      comprobar: () =>
        typeof anzueloLanzado !== "undefined" &&
        anzueloLanzado &&
        typeof lanzamientoCaeEnAgua !== "undefined" &&
        lanzamientoCaeEnAgua,
    },
    {
      id: "capturar",
      titulo: "3. Enganchá y capturá tu primer pez",
      objetivo: "Esperá la picada, superá el minijuego y atrapá 1 pez.",
      textoPC:
        "Cuando el flotador diga «¡¡ AHORA !!», pulsá [Espacio]. En peces raros podés elegir [Espacio] Pelea normal o [F] Arriesgar (+40% valor). Luego superá el minijuego.",
      textoTactil:
        "Cuando veas «¡¡ AHORA !!», tocá [Enganchar]. Si aparece decisión de riesgo, elegí Asegurar o Arriesgar y completá el minijuego.",
      comprobar: () =>
        (typeof inventario !== "undefined" && inventario.length > 0) ||
        (typeof REGISTRO_CAPTURAS !== "undefined" &&
          Object.keys(REGISTRO_CAPTURAS).length > 0),
    },
    {
      id: "enciclopedia",
      titulo: "4. Revisá la Enciclopedia de Especies",
      objetivo: "Abrí la Enciclopedia para ver la ficha científica desbloqueada.",
      textoPC:
        "Presioná [L] para abrir la Enciclopedia de las 9 especies. Navegá con [W/S] o flechas para consultar hábitat, dieta, cebo y dato curioso.",
      textoTactil:
        "Tocá el botón superior [Especies] para ver las 9 especies y sus fichas científicas.",
      comprobar: () =>
        (typeof ENCICLOPEDIA !== "undefined" && ENCICLOPEDIA.abierta) ||
        !!document.getElementById("libro-movil")?.open,
    },
    {
      id: "vender",
      titulo: "5. Vendé tus peces en la Tienda",
      objetivo: "Entrá a la tienda del muelle y vendé tu captura por monedas ($).",
      textoPC:
        "Caminá hasta la tienda de madera donde está Kiwifina, presioná [E] cuando aparezca el aviso, entrá a «Vender» y vendé tu pez.",
      textoTactil:
        "Acercate a la tienda de madera, tocá el botón superior [Tienda], entrá a «Vender» y vendé tu captura.",
      comprobar: () => typeof dinero !== "undefined" && dinero > 0,
    },
    {
      id: "comprar",
      titulo: "6. Comprá cañas, cebos y anzuelos",
      objetivo: "Visitá la sección «Comprar» de la tienda para ver las mejoras.",
      textoPC:
        "En la tienda abrí «Comprar»: tenés Cañas (Bambú $150, Metal $500), Cebos de 5 usos (Lombrices $35, Mariscos $75) y Anzuelos (Precisión $90, Reforzado $200).",
      textoTactil:
        "En la tienda tocá «Comprar» para explorar Cañas, Cebos (×5 usos) y Anzuelos. ¡Con $50 ya te alcanza para Lombrices!",
      comprobar: () =>
        (typeof comercio !== "undefined" &&
          document.getElementById("comercio")?.open &&
          comercio.modo === "tienda" &&
          comercio.pagina === "comprar") ||
        (typeof objetosPesca !== "undefined" &&
          Object.entries(objetosPesca).some(
            ([k, v]) => !["basica", "sin_cebo", "simple"].includes(k) && v > 0,
          )),
    },
    {
      id: "mochila",
      titulo: "7. Mochila y cambio de equipo",
      objetivo: "Abrí tu Mochila/Equipo para gestionar peces y equipamiento.",
      textoPC:
        "Presioná [I] desde cualquier punto del mapa para ver los peces que llevás (máx. 10/10) y equipar las cañas, cebos o anzuelos comprados.",
      textoTactil:
        "Tocá el botón superior [Mochila] para equipar tus cañas, cebos o anzuelos en cualquier momento.",
      comprobar: () =>
        typeof comercio !== "undefined" &&
        document.getElementById("comercio")?.open &&
        comercio.modo === "equipo",
    },
    {
      id: "extras",
      titulo: "8. Guía (Q), Ranking (R) y Ajustes (Esc)",
      objetivo: "Conocé el Chatbot, el Ranking del lago y los Ajustes gráficos.",
      textoPC:
        "Usá [Q] para consultar al Chatbot Guía de Pesca, acercate al cartel flotante junto a la tienda ([R] o clic) para ver el Ranking Top 20, y [Esc] para Ajustes.",
      textoTactil:
        "Usá [Guía] para consultar al Chatbot, tocá el cartel flotante junto a la tienda para el Ranking y [Ajustes] para calidad gráfica o repetir tutoriales.",
      comprobar: () => false, // Se cierra manualmente con "¡Finalizar tutorial!"
    },
  ];

  // ---------- Persistencia por cuenta ----------
  function claveStorage() {
    const id = window.modoInvitado
      ? "invitado"
      : "usuario_" + (window.sesionUsuario?.usuario_id || "anon");
    return "BLUEHAVEN_TUTORIAL_V1_" + id;
  }

  function estadoPorDefecto() {
    return {
      completado: false,
      pasoActual: 0,
      minijuegosVistos: { 1: false, 2: false, 3: false, 4: false, 5: false },
      avisosMinijuegos: true,
    };
  }

  function cargarEstado() {
    try {
      const raw = localStorage.getItem(claveStorage());
      if (!raw) return estadoPorDefecto();
      const parsed = JSON.parse(raw);
      return {
        ...estadoPorDefecto(),
        ...parsed,
        minijuegosVistos: {
          ...estadoPorDefecto().minijuegosVistos,
          ...(parsed?.minijuegosVistos || {}),
        },
      };
    } catch (_) {
      return estadoPorDefecto();
    }
  }

  function guardarEstado(estado) {
    try {
      localStorage.setItem(claveStorage(), JSON.stringify(estado));
    } catch (_) {}
  }

  function esCuentaSinProgreso() {
    const sinDinero = typeof dinero === "undefined" || dinero === 0;
    const sinMochila =
      typeof inventario === "undefined" || inventario.length === 0;
    const sinEspecies =
      typeof REGISTRO_CAPTURAS === "undefined" ||
      Object.keys(REGISTRO_CAPTURAS).length === 0;
    const sinBambu = typeof tieneCañaBambu === "undefined" || !tieneCañaBambu;
    const sinExtras =
      typeof objetosPesca === "undefined" ||
      Object.entries(objetosPesca).every(
        ([k, v]) => ["basica", "sin_cebo", "simple"].includes(k) || v === 0,
      );
    return sinDinero && sinMochila && sinEspecies && sinBambu && sinExtras;
  }

  // ---------- Creación de elementos DOM ----------
  const hud = document.createElement("aside");
  hud.id = "tutorial-hud";
  hud.hidden = true;
  hud.setAttribute("aria-label", "Tutorial paso a paso");
  hud.innerHTML = `
    <div class="tut-cabecera">
      <div class="tut-titulo-wrap">
        <span id="tut-badge" class="tut-badge">TUTORIAL · PASO 1/8</span>
        <h3 id="tut-titulo"></h3>
      </div>
      <div class="tut-win-btns">
        <button id="tut-minimizar" type="button" title="Minimizar/Expandir">−</button>
        <button id="tut-cerrar" type="button" title="Cerrar tutorial">×</button>
      </div>
    </div>
    <div class="tut-barra-fondo"><div id="tut-barra-progreso" class="tut-barra-progreso"></div></div>
    <div id="tut-cuerpo" class="tut-cuerpo">
      <p id="tut-descripcion" class="tut-desc"></p>
      <p id="tut-objetivo" class="tut-obj"></p>
      <div class="tut-acciones">
        <button id="tut-btn-minijuegos" type="button">🎮 Minijuegos</button>
        <button id="tut-btn-anterior" type="button">← Anterior</button>
        <button id="tut-btn-siguiente" type="button" class="tut-btn-primario">Siguiente →</button>
      </div>
    </div>
  `;
  document.body.appendChild(hud);

  const dialogo = document.createElement("dialog");
  dialogo.id = "dialogo-tutorial";
  dialogo.setAttribute("aria-labelledby", "tut-modal-titulo");
  dialogo.innerHTML = `
    <header class="tut-modal-cabecera">
      <div>
        <small id="tut-modal-subtitulo">BLUE HAVEN · GUÍA INTERACTIVA</small>
        <h2 id="tut-modal-titulo">📖 Tutorial y Guía de Minijuegos</h2>
      </div>
      <button id="tut-modal-cerrar-x" type="button" aria-label="Cerrar guía">×</button>
    </header>
    <div id="tut-alerta-encuentro" class="tut-alerta-encuentro" hidden></div>
    <nav id="tut-modal-tabs" class="tut-modal-tabs" aria-label="Secciones del tutorial"></nav>
    <div id="tut-modal-contenido" class="tut-modal-contenido"></div>
    <footer class="tut-modal-pie">
      <label class="tut-check-avisos">
        <input id="tut-check-avisos" type="checkbox" checked />
        <span>Mostrar aviso la 1.ª vez que aparezca cada minijuego</span>
      </label>
      <div class="tut-modal-pie-btns">
        <button id="tut-modal-volver" type="button" class="tut-btn-primario">Volver al lago</button>
      </div>
    </footer>
  `;
  document.body.appendChild(dialogo);

  // ---------- Estado en runtime ----------
  let estado = estadoPorDefecto();
  let guiadoActivo = false;
  let minimizado = false;
  let pasoCompletadoTimer = 0;
  let tabActual = "general";
  let rafAnim = 0;
  let contextoPausaSistema = null;
  let regresandoDePractica = null;
  let origenPaso1 = null;

  function tactilActivo() {
    return !!window.ControlTactil?.activo;
  }

  function refrescarHUD() {
    if (!guiadoActivo) {
      hud.hidden = true;
      return;
    }
    const idx = Math.max(
      0,
      Math.min(PASOS_GUIADO.length - 1, estado.pasoActual),
    );
    const paso = PASOS_GUIADO[idx];
    document.getElementById("tut-badge").textContent =
      `TUTORIAL · PASO ${idx + 1}/${PASOS_GUIADO.length}`;
    document.getElementById("tut-titulo").textContent = paso.titulo;
    document.getElementById("tut-descripcion").textContent = tactilActivo()
      ? paso.textoTactil
      : paso.textoPC;
    const objEl = document.getElementById("tut-objetivo");
    if (pasoCompletadoTimer > 0) {
      objEl.textContent = "✓ ¡Paso completado! Avanzando…";
      objEl.classList.add("listo");
    } else {
      objEl.textContent = "🎯 Objetivo: " + paso.objetivo;
      objEl.classList.remove("listo");
    }
    document.getElementById("tut-barra-progreso").style.width =
      Math.round(((idx + 1) / PASOS_GUIADO.length) * 100) + "%";
    document.getElementById("tut-btn-anterior").disabled = idx === 0;
    document.getElementById("tut-btn-siguiente").textContent =
      idx === PASOS_GUIADO.length - 1 ? "¡Finalizar!" : "Siguiente →";
    document.getElementById("tut-cuerpo").hidden = minimizado;
    document.getElementById("tut-minimizar").textContent = minimizado
      ? "+"
      : "−";
  }

  function finalizarGuiado() {
    guiadoActivo = false;
    pasoCompletadoTimer = 0;
    estado.completado = true;
    guardarEstado(estado);
    hud.hidden = true;
    if (typeof mostrarMensaje === "function") {
      mostrarMensaje("¡Tutorial completado! Buena pesca en BlueHaven.");
    }
  }

  function avanzarPaso() {
    pasoCompletadoTimer = 0;
    if (estado.pasoActual >= PASOS_GUIADO.length - 1) {
      finalizarGuiado();
      return;
    }
    estado.pasoActual++;
    guardarEstado(estado);
    refrescarHUD();
  }

  function retrocederPaso() {
    pasoCompletadoTimer = 0;
    if (estado.pasoActual > 0) {
      estado.pasoActual--;
      guardarEstado(estado);
      refrescarHUD();
    }
  }

  // ---------- Animaciones en vivo para cada minijuego ----------
  function dibujarDemoMinijuego(canvas, rareza, t) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.fillStyle = "#16202a";
    ctx.fillRect(0, 0, w, h);

    if (rareza === 1) {
      // ANILLO
      const cx = w / 2;
      const cy = h * 0.48;
      const rMax = 64;
      const rCore = 12;
      const ciclo = (t % 2.2) / 2.2;
      const progreso = Math.min(1, ciclo / 0.78);
      const r = rMax + (rCore - rMax) * progreso;

      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.arc(cx, cy, rCore * 1.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd23c";
      ctx.beginPath();
      ctx.arc(cx, cy, rCore * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle =
        progreso >= 0.84 ? "#ffdc3c" : progreso >= 0.55 ? "#46e678" : "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      if (ciclo > 0.72) {
        ctx.fillStyle = "#ffdc3c";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("¡PERFECTO! [Clic / Espacio]", cx, 24);
      } else {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Esperá a que el anillo toque el centro amarillo", cx, 24);
      }
    } else if (rareza === 2) {
      // BRÚJULA
      const cx = w / 2;
      const cy = h * 0.54;
      const radio = 66;
      ctx.strokeStyle = "#3c424e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radio, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(70, 230, 110, 0.85)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, radio, -Math.PI / 2 - 0.32, -Math.PI / 2 + 0.32);
      ctx.stroke();

      const angDeg = Math.sin(t * 2.1) * 38;
      const enZona = Math.abs(angDeg) <= 18;
      const a = -Math.PI / 2 + (angDeg * Math.PI) / 180;
      const px = cx + Math.cos(a) * (radio - 8);
      const py = cy + Math.sin(a) * (radio - 8);

      ctx.strokeStyle = enZona ? "#50f078" : "#ff5046";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = "#ffd732";
      ctx.beginPath();
      ctx.ellipse(px, py, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = enZona ? "#86efac" : "#fca5a5";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        enZona ? "✓ En zona verde (+PESCA)" : "← [A / D] → Centrá la aguja · [Espacio] frena",
        cx,
        22,
      );
    } else if (rareza === 3) {
      // RITMO
      const lanes = [w / 2 - 64, w / 2, w / 2 + 64];
      const letras = ["A", "S", "D"];
      const hitY = h * 0.72;
      lanes.forEach((lx, i) => {
        ctx.fillStyle = "#0e1319";
        ctx.fillRect(lx - 22, 24, 44, hitY - 12);
        ctx.fillStyle = "#334155";
        ctx.fillRect(lx - 14, hitY + 10, 28, 18);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(letras[i], lx, hitY + 23);
      });

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 96, hitY);
      ctx.lineTo(w / 2 + 96, hitY);
      ctx.stroke();

      const notas = [
        { lane: 0, off: 0.1, tipo: "normal" },
        { lane: 1, off: 0.45, tipo: "larga" },
        { lane: 2, off: 0.78, tipo: "falsa" },
      ];
      for (const n of notas) {
        const p = ((t * 0.45 + n.off) % 1);
        const y = 28 + p * (hitY - 18);
        const lx = lanes[n.lane];
        if (n.tipo === "falsa") {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(lx, y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fee2e2";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lx - 4, y - 4);
          ctx.lineTo(lx + 4, y + 4);
          ctx.moveTo(lx + 4, y - 4);
          ctx.lineTo(lx - 4, y + 4);
          ctx.stroke();
        } else if (n.tipo === "larga") {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(lx - 6, y - 24, 12, 24);
          ctx.beginPath();
          ctx.arc(lx, y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = Math.abs(y - hitY) < 14 ? "#7dd3fc" : "#fbbf24";
          ctx.beginPath();
          ctx.arc(lx, y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pulsá A/S/D al cruzar la línea · Rojo = NO tocar", w / 2, 16);
    } else if (rareza === 4) {
      // ESQUIVA
      const ax = 40;
      const ay = 28;
      const aw = w - 80;
      const ah = h - 46;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.strokeRect(ax, ay, aw, ah);

      const fx = w / 2 + Math.sin(t * 2.3) * 62;
      const fy = ay + ah * 0.65 + Math.cos(t * 1.7) * 16;

      // Línea hacia arriba
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy);
      ctx.lineTo(w / 2, 8);
      ctx.stroke();

      // Pez amarillo
      ctx.fillStyle = "#ffd732";
      ctx.beginPath();
      ctx.ellipse(fx, fy, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.moveTo(fx + 10, fy);
      ctx.lineTo(fx + 20, fy - 6);
      ctx.lineTo(fx + 20, fy + 6);
      ctx.closePath();
      ctx.fill();

      // Basura cayendo
      const obs = [
        [w / 2 - 55, ay + ((t * 55) % (ah - 10))],
        [w / 2 + 45, ay + (((t + 1.3) * 65) % (ah - 10))],
        [w / 2 - 5, ay + (((t + 0.6) * 50) % (ah - 10))],
      ];
      ctx.fillStyle = "#9ca3af";
      for (const [ox, oy] of obs) {
        ctx.fillRect(ox - 8, oy - 6, 16, 12);
      }

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Esquivá la basura con [W][A][S][D] o Flechas", w / 2, 18);
    } else if (rareza === 5) {
      // MULTIETAPA (4 fases + QTE)
      const fases = ["1/4 Anillo", "2/4 Ritmo", "3/4 Esquiva", "4/4 Perfecto"];
      const activa = Math.floor(t / 1.4) % 4;
      const boxW = (w - 50) / 4;
      fases.forEach((f, i) => {
        const bx = 18 + i * (boxW + 5);
        const by = 40;
        ctx.fillStyle = i === activa ? "#0f766e" : "#1e293b";
        ctx.strokeStyle = i === activa ? "#facc15" : "#475569";
        ctx.lineWidth = 2;
        ctx.fillRect(bx, by, boxW, 56);
        ctx.strokeRect(bx, by, boxW, 56);
        ctx.fillStyle = i === activa ? "#fef08a" : "#cbd5e1";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f, bx + boxW / 2, by + 33);
      });

      // Barra QTE entre fases
      const qx = 40;
      const qy = 128;
      const qw = w - 80;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(qx, qy, qw, 18);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(qx + qw * 0.4, qy, qw * 0.22, 18);
      const mk = qx + ((Math.sin(t * 3.5) + 1) / 2) * qw;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mk - 2, qy - 4, 4, 26);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Transición QTE: pulsá [Espacio] en verde para bajar tensión", w / 2, 118);
    }
  }

  function detenerAnimacionModal() {
    if (rafAnim) {
      cancelAnimationFrame(rafAnim);
      rafAnim = 0;
    }
  }

  function iniciarAnimacionModal(canvas, rareza) {
    detenerAnimacionModal();
    const inicio = performance.now();
    const tick = (ahora) => {
      if (!dialogo.open) {
        rafAnim = 0;
        return;
      }
      dibujarDemoMinijuego(canvas, rareza, (ahora - inicio) / 1000);
      rafAnim = requestAnimationFrame(tick);
    };
    rafAnim = requestAnimationFrame(tick);
  }

  // ---------- Renderizado del Modal de Tutorial y Minijuegos ----------
  function renderizarTabsModal() {
    const nav = document.getElementById("tut-modal-tabs");
    nav.replaceChildren();
    const pestanas = [
      { id: "general", texto: "📖 Controles y Funciones" },
      ...MINIJUEGOS_INFO.map((m) => ({
        id: m.id,
        texto: `${m.icono} ${m.rareza}. ${m.tabCorto}`,
      })),
    ];
    for (const tab of pestanas) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = tab.texto;
      b.setAttribute("aria-pressed", String(tabActual === tab.id));
      b.addEventListener("click", () => {
        tabActual = tab.id;
        renderizarModal();
      });
      nav.appendChild(b);
    }
  }

  function renderizarTabGeneral(cont) {
    const intro = document.createElement("div");
    intro.className = "tut-general-grid";
    intro.innerHTML = `
      <section class="tut-card">
        <h3>🎮 Controles (${tactilActivo() ? "Pantalla Táctil" : "Teclado y Mouse"})</h3>
        <ul>
          ${
            tactilActivo()
              ? `<li><strong>Joystick izquierdo:</strong> Caminar y esquivar / centrar aguja.</li>
                 <li><strong>Lado derecho:</strong> Deslizar el dedo para mirar alrededor.</li>
                 <li><strong>Botón Pescar / Acción:</strong> Lanzar, enganchar, frenar o pulsar anillo.</li>
                 <li><strong>Botones A / S / D:</strong> Carriles en el minijuego de ritmo.</li>
                 <li><strong>Barra superior:</strong> Mochila, Tienda (cerca del muelle), Especies y Guía.</li>`
              : `<li><strong>W A S D:</strong> Moverse por el mapa (y esquivar peces).</li>
                 <li><strong>Mouse (clic en escena):</strong> Girar cámara · <strong>P:</strong> Liberar/capturar cursor.</li>
                 <li><strong>Espacio:</strong> Saltar · Enganchar picada · Acción en minijuegos.</li>
                 <li><strong>Ctrl:</strong> Agacharse · <strong>Esc:</strong> Menú de Ajustes.</li>
                 <li><strong>F:</strong> Lanzar o recoger la caña (y elegir Arriesgar).</li>
                 <li><strong>E:</strong> Entrar a la tienda del muelle · <strong>I:</strong> Mochila y equipo.</li>
                 <li><strong>L:</strong> Enciclopedia · <strong>Q:</strong> Chatbot Guía · <strong>R:</strong> Ranking · <strong>H:</strong> Tutoriales.</li>`
          }
        </ul>
      </section>
      <section class="tut-card">
        <h3>🐟 Ciclo Completo de Juego</h3>
        <ol>
          <li><strong>Pescar:</strong> Acercate al agua y pulsá <strong>F</strong>. Esperá el tirón fuerte («¡¡ AHORA !!») y pulsá <strong>Espacio</strong>.</li>
          <li><strong>Asegurar o Arriesgar:</strong> Ejemplares de calidad <em>Poco común</em> o superior ofrecen <strong>Arriesgar [F]</strong>: +40% de valor, pero con mecánicas extra.</li>
          <li><strong>Enciclopedia (L):</strong> Cada una de las 9 especies atrapadas desbloquea su ficha científica y récord.</li>
          <li><strong>Vender y Comprar (E):</strong> Entrá a la tienda de Kiwifina para vender peces y comprar <strong>Cañas</strong>, <strong>Cebos</strong> (×5 lanzamientos) y <strong>Anzuelos</strong>.</li>
          <li><strong>Equipar (I):</strong> Cambiá caña, cebo y anzuelo en cualquier parte del mapa.</li>
          <li><strong>Chatbot (Q) y Ranking (R):</strong> Preguntale dudas a la guía o competí en el Top 20 del cartel junto a la tienda.</li>
        </ol>
      </section>
    `;
    cont.appendChild(intro);

    const barraAccion = document.createElement("div");
    barraAccion.className = "tut-general-acciones";
    const btnGuiado = document.createElement("button");
    btnGuiado.type = "button";
    btnGuiado.className = "tut-btn-primario";
    btnGuiado.textContent = "▶ Iniciar / Repetir recorrido guiado paso a paso";
    btnGuiado.addEventListener("click", () => {
      cerrarModal();
      iniciarGuiado(true);
    });
    barraAccion.appendChild(btnGuiado);
    cont.appendChild(barraAccion);
  }

  function renderizarTabMinijuego(cont, info) {
    const wrap = document.createElement("div");
    wrap.className = "tut-mini-layout";

    const colIzq = document.createElement("div");
    colIzq.className = "tut-mini-preview";
    const canvas = document.createElement("canvas");
    canvas.width = 310;
    canvas.height = 175;
    canvas.className = "tut-mini-canvas";
    colIzq.appendChild(canvas);

    const btnPracticar = document.createElement("button");
    btnPracticar.type = "button";
    btnPracticar.className = "tut-btn-practicar";
    btnPracticar.textContent = `🎮 Practicar "${info.nombre}" ahora`;
    btnPracticar.addEventListener("click", () => {
      regresandoDePractica = info.id;
      cerrarModal();
      if (typeof sistemaCaptura !== "undefined" && sistemaCaptura?.iniciarPractica) {
        sistemaCaptura.iniciarPractica(info.rareza);
      }
    });
    colIzq.appendChild(btnPracticar);

    const notaPractica = document.createElement("small");
    notaPractica.textContent =
      "Modo práctica seguro: no gasta cebos ni modifica tu mochila o saldo.";
    colIzq.appendChild(notaPractica);

    const colDer = document.createElement("div");
    colDer.className = "tut-mini-info";

    const meta = document.createElement("p");
    meta.className = "tut-mini-especies";
    meta.innerHTML = `<strong>${info.icono} ${info.nombre}</strong> · ${info.especies}`;
    colDer.appendChild(meta);

    for (const [label, txt] of [
      ["Objetivo", info.objetivo],
      [
        tactilActivo() ? "Controles Táctiles" : "Controles",
        tactilActivo() ? info.controlesTactil : info.controlesPC,
      ],
      ["Sistema y Puntos", info.puntaje],
    ]) {
      const bloque = document.createElement("p");
      bloque.className = "tut-mini-bloque";
      const b = document.createElement("strong");
      b.textContent = label + ": ";
      bloque.append(b, document.createTextNode(txt));
      colDer.appendChild(bloque);
    }

    const tituloMec = document.createElement("h4");
    tituloMec.textContent = "Mecánicas especiales (según calidad / riesgo):";
    colDer.appendChild(tituloMec);

    const ul = document.createElement("ul");
    ul.className = "tut-mini-mecanicas";
    for (const [nom, desc] of info.mecanicas) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = nom + ": ";
      li.append(strong, document.createTextNode(desc));
      ul.appendChild(li);
    }
    colDer.appendChild(ul);

    wrap.append(colIzq, colDer);
    cont.appendChild(wrap);
    iniciarAnimacionModal(canvas, info.rareza);
  }

  function renderizarModal() {
    detenerAnimacionModal();
    renderizarTabsModal();
    const cont = document.getElementById("tut-modal-contenido");
    cont.replaceChildren();
    document.getElementById("tut-check-avisos").checked =
      !!estado.avisosMinijuegos;

    if (tabActual === "general") {
      renderizarTabGeneral(cont);
    } else {
      const info =
        MINIJUEGOS_INFO.find((m) => m.id === tabActual) || MINIJUEGOS_INFO[0];
      renderizarTabMinijuego(cont, info);
    }
  }

  function abrirModal(tab = "general", alertaTexto = "") {
    if (!document.body.classList.contains("jugando")) return;
    if (typeof cerrarChat === "function") cerrarChat();
    tabActual = tab;
    const alertaEl = document.getElementById("tut-alerta-encuentro");
    if (alertaTexto) {
      alertaEl.textContent = alertaTexto;
      alertaEl.hidden = false;
    } else {
      alertaEl.textContent = "";
      alertaEl.hidden = true;
    }
    document.getElementById("tut-modal-volver").textContent =
      contextoPausaSistema ? "▶ ¡Entendido, empezar pelea!" : "Volver al lago";
    renderizarModal();
    if (!dialogo.open) dialogo.showModal();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function cerrarModal() {
    detenerAnimacionModal();
    if (dialogo.open) dialogo.close();
    reanudarTrasModal();
  }

  function reanudarTrasModal() {
    detenerAnimacionModal();
    if (contextoPausaSistema) {
      contextoPausaSistema.pausadoPorTutorial = false;
      contextoPausaSistema = null;
    }
    if (
      document.body.classList.contains("jugando") &&
      !cursorLibre &&
      !regresandoDePractica &&
      typeof sistemaCaptura !== "undefined" &&
      sistemaCaptura.estado === "inactivo"
    ) {
      capturarCursor();
    }
  }

  // ---------- Eventos de UI ----------
  document
    .getElementById("tut-minimizar")
    .addEventListener("click", () => {
      minimizado = !minimizado;
      refrescarHUD();
    });
  document.getElementById("tut-cerrar").addEventListener("click", () => {
    finalizarGuiado();
  });
  document
    .getElementById("tut-btn-minijuegos")
    .addEventListener("click", () => abrirModal("mini-1"));
  document
    .getElementById("tut-btn-anterior")
    .addEventListener("click", retrocederPaso);
  document
    .getElementById("tut-btn-siguiente")
    .addEventListener("click", avanzarPaso);

  document
    .getElementById("tut-modal-cerrar-x")
    .addEventListener("click", cerrarModal);
  document
    .getElementById("tut-modal-volver")
    .addEventListener("click", cerrarModal);
  dialogo.addEventListener("close", reanudarTrasModal);

  document
    .getElementById("tut-check-avisos")
    .addEventListener("change", (e) => {
      estado.avisosMinijuegos = !!e.target.checked;
      guardarEstado(estado);
    });

  document.getElementById("boton-tutorial")?.addEventListener("click", () => {
    if (typeof sistemaCaptura !== "undefined") {
      if (sistemaCaptura.modoPractica) {
        sistemaCaptura.cancelar();
      } else if (sistemaCaptura.estado !== "inactivo") {
        return;
      }
    }
    abrirModal("general");
  });
  document
    .getElementById("abrir-tutorial-ajustes")
    ?.addEventListener("click", () => {
      document.getElementById("ajustes")?.close();
      abrirModal("general");
    });

  // ---------- API pública ----------
  function iniciarGuiado(desdeInicio = false) {
    if (desdeInicio) {
      estado.completado = false;
      estado.pasoActual = 0;
      estado.avisosMinijuegos = true;
      estado.minijuegosVistos = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
      };
      guardarEstado(estado);
    }
    origenPaso1 =
      typeof jugador !== "undefined" && jugador?.posicion
        ? { x: jugador.posicion.x, y: jugador.posicion.y }
        : null;
    guiadoActivo = true;
    minimizado = false;
    pasoCompletadoTimer = 0;
    refrescarHUD();
    hud.hidden = false;
  }

  function evaluarInicio() {
    const rawExistente = (() => {
      try {
        return localStorage.getItem(claveStorage());
      } catch (_) {
        return null;
      }
    })();
    estado = cargarEstado();
    regresandoDePractica = null;
    contextoPausaSistema = null;

    const sinProgreso = esCuentaSinProgreso();
    const esCuentaNueva = !window.modoInvitado && (sinProgreso || !!window.recienRegistrado);
    window.recienRegistrado = false;

    if (esCuentaNueva && !estado.completado) {
      iniciarGuiado(false);
    } else {
      // Cuentas existentes con progreso previo o modo invitado no reciben interrupciones automáticas
      // salvo que inicien el tutorial manualmente.
      if (!rawExistente && (window.modoInvitado || !sinProgreso)) {
        estado.completado = true;
        estado.avisosMinijuegos = false;
        guardarEstado(estado);
      }
      guiadoActivo = false;
      hud.hidden = true;
    }
  }

  function actualizar() {
    if (!document.body.classList.contains("jugando")) {
      hud.hidden = true;
      return;
    }
    if (!guiadoActivo) return;

    // Ocultar temporalmente el card flotante cuando hay diálogos, chat, bienvenida o lucha activa
    // para nunca tapar las barras de PESCA/TENSIÓN ni los modales.
    const ocultoPorContexto =
      (typeof bienvenidaActiva === "function" && bienvenidaActiva()) ||
      !!document.querySelector("dialog[open]") ||
      !!window.chatAbierto ||
      (typeof sistemaCaptura !== "undefined" &&
        sistemaCaptura.estado !== "inactivo") ||
      (typeof estadoLanzamiento !== "undefined" &&
        estadoLanzamiento !== "reposo");

    if (pasoCompletadoTimer > 0) {
      const dt = Math.min(
        (typeof deltaTime !== "undefined" ? deltaTime : 16) / 1000,
        0.05,
      );
      pasoCompletadoTimer -= dt;
      if (pasoCompletadoTimer <= 0) {
        avanzarPaso();
      }
    } else {
      const paso = PASOS_GUIADO[estado.pasoActual];
      if (paso && paso.comprobar()) {
        // Si el paso se cumplió mientras un modal estaba abierto (ej. abrir tienda o enciclopedia),
        // avanzamos sin demora para que al cerrarlo ya espere el siguiente paso.
        if (
          ocultoPorContexto &&
          (estado.pasoActual === 1 || estado.pasoActual >= 3)
        ) {
          avanzarPaso();
        } else {
          pasoCompletadoTimer = 0.9;
          refrescarHUD();
        }
      }
    }

    hud.hidden = ocultoPorContexto;
  }

  function alIniciarMinijuego(pez, sistema) {
    if (!pez || !sistema) return;
    const rareza = Number(pez.rareza) || 1;
    if (!estado.avisosMinijuegos || estado.minijuegosVistos[rareza]) return;
    estado.minijuegosVistos[rareza] = true;
    guardarEstado(estado);
    const info =
      MINIJUEGOS_INFO.find((m) => m.rareza === rareza) || MINIJUEGOS_INFO[0];
    sistema.pausadoPorTutorial = true;
    contextoPausaSistema = sistema;
    const calidad =
      typeof calidadDe === "function" ? calidadDe(pez).nombre : "";
    abrirModal(
      info.id,
      `✨ ¡Primer encuentro con ${info.nombre}! Vas a pescar: ${pez.nombre}${calidad ? " (" + calidad + ")" : ""}.`,
    );
  }

  function alTerminarPractica(rareza, resultado) {
    const tab = regresandoDePractica || (rareza ? "mini-" + rareza : "general");
    regresandoDePractica = null;
    if (resultado === "capturado") {
      abrirModal(
        tab,
        "🎉 ¡Práctica superada! Ya dominás la mecánica de este minijuego.",
      );
    } else if (resultado === "cancelado") {
      abrirModal(tab, "Práctica cancelada. Podés reintentar cuando quieras.");
    } else {
      abrirModal(
        tab,
        "💡 El pez escapó en la práctica. Revisá los consejos arriba y volvé a intentarlo.",
      );
    }
  }

  function ocultar() {
    guiadoActivo = false;
    regresandoDePractica = null;
    contextoPausaSistema = null;
    pasoCompletadoTimer = 0;
    hud.hidden = true;
    cerrarModal();
  }

  window.TutorialJuego = Object.freeze({
    evaluarInicio,
    iniciarGuiado,
    abrirModal,
    cerrarModal,
    actualizar,
    alIniciarMinijuego,
    alTerminarPractica,
    ocultar,
    estaGuiadoActivo: () => guiadoActivo,
    obtenerPasoActual: () => estado.pasoActual,
  });
})();
