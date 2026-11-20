// Sistema de diálogos RPG de Kiwifina con voz sintetizada estilo Animal Crossing.
(() => {
  const CONSEJOS_KIWIFINA = [
    "¿Buscás especies raras? Las lombrices son rápidas, ¡pero los mariscos atraen peces mucho más exóticos y valiosos!",
    "Las cañas de bambú y de metal son permanentes: una vez que las comprás, te quedan para siempre y facilitan todos los minijuegos.",
    "El anzuelo de precisión te da más tiempo para clavar la caña cuando el pez pica. ¡Es ideal si sentís que pican muy rápido!",
    "El anzuelo reforzado reduce la dificultad en la pelea de pesca. Con peces pesados como el Esturión, se nota un montón.",
    "La Carpa y la Trucha Arcoíris son ideales para juntar tus primeras monedas en la orilla cerca del muelle.",
    "Cuidado con el Pez Globo: cuando se infla, tenés que anticipar sus movimientos bruscos y no desesperarte.",
    "Cada paquete de cebo rinde 5 lanzamientos exactos. ¡Fijate bien cuántos te quedan antes de buscar peces difíciles!",
    "Dicen los viejos pescadores que en lo profundo del lago duerme un Dragón... Si alguna vez te pica, ¡preparate para una pelea en varias etapas!",
    "Para capturar al Pez Remo o la Ballena Azul vas a necesitar el mejor equipo del lago. ¡Ahorrá tus monedas y mejorá tu caña!",
    "Consultá la Enciclopedia pulsando [L]: cada vez que capturás un pez nuevo, se desbloquean sus datos biológicos y curiosidades.",
  ];

  const DESPEDIDAS_KIWIFINA = [
    "¡Buena pesca! Que el lago te sea generoso hoy.",
    "¡Volvé cuando quieras! Acá siempre hay cebos frescos y buena charla.",
    "¡Cuidate de los tirones en el agua profunda! ¡Hasta la próxima!",
    "¡Muchos éxitos! Si sacás algo colosal, ¡traémelo a la tienda!",
  ];

  // Elemento <dialog>
  const dialogo = document.createElement("dialog");
  dialogo.id = "dialogo-kiwifina";
  dialogo.className = "dialogo-kiwifina";
  dialogo.setAttribute("aria-labelledby", "kiwifina-nombre");

  dialogo.innerHTML = `
    <div class="kiwifina-caja">
      <div class="kiwifina-avatar-columna">
        <div class="kiwifina-avatar-marco">
          <div class="kiwifina-emote-burbuja" id="kiwifina-emote" style="display: none;"></div>
          <img src="models/3D/CaraKIWIFINAL.png" alt="Kiwifina" class="kiwifina-avatar-img" id="kiwifina-avatar" />
        </div>
        <span class="kiwifina-nombre-badge" id="kiwifina-nombre">Kiwifina</span>
      </div>
      <div class="kiwifina-cuerpo">
        <div class="kiwifina-texto-area">
          <p class="kiwifina-texto" id="kiwifina-texto"></p>
          <span class="kiwifina-indicador-continuar" id="kiwifina-cursor">▼</span>
        </div>
        <div class="kiwifina-opciones" id="kiwifina-opciones"></div>
      </div>
    </div>
    <div class="kiwifina-pista-teclado">
      <span>[Espacio / Clic] Continuar • [Esc] Salir</span>
    </div>
  `;

  document.body.appendChild(dialogo);

  const elTexto = dialogo.querySelector("#kiwifina-texto");
  const elCursor = dialogo.querySelector("#kiwifina-cursor");
  const elOpciones = dialogo.querySelector("#kiwifina-opciones");
  const elAvatar = dialogo.querySelector("#kiwifina-avatar");
  const elEmote = dialogo.querySelector("#kiwifina-emote");

  let typewriterTimeout = null;
  let indiceTexto = 0;
  let textoObjetivo = "";
  let escribiendo = false;
  let opcionesPendientes = null;
  let onCompletarCallback = null;
  let ultimoConsejoIndex = -1;
  let emoteTimeout = null;

  function mostrarEmoteKiwifina(tipo = "sorpresa", duracion = 1800) {
    if (!elEmote) return;
    if (emoteTimeout) {
      clearTimeout(emoteTimeout);
      emoteTimeout = null;
    }

    elEmote.className = "kiwifina-emote-burbuja emote-" + tipo;
    let icono = "!";
    if (tipo === "sorpresa") icono = "!";
    else if (tipo === "alegria" || tipo === "musica") icono = "🎵";
    else if (tipo === "idea") icono = "💡";
    else if (tipo === "sudor") icono = "💧";
    else if (tipo === "corazon") icono = "💖";

    elEmote.innerHTML = `<span class="emote-icono">${icono}</span>`;
    elEmote.style.display = "flex";

    if (elAvatar) {
      elAvatar.classList.remove(
        "reaccion-sorpresa",
        "reaccion-alegria",
        "reaccion-idea",
        "reaccion-sudor",
        "reaccion-corazon",
      );
      elAvatar.classList.add("reaccion-" + tipo);
    }

    if (typeof AudioJuego !== "undefined" && AudioJuego.efectoEmote) {
      AudioJuego.efectoEmote(tipo);
    }

    if (typeof animarSalto3DKiwifina === "function") {
      const altura = tipo === "sorpresa" ? 4.5 : tipo === "alegria" ? 3 : 1.5;
      animarSalto3DKiwifina(altura);
    }

    emoteTimeout = setTimeout(() => {
      elEmote.classList.add("desvanecer");
      setTimeout(() => {
        elEmote.style.display = "none";
        elEmote.classList.remove("desvanecer", "emote-" + tipo);
        if (elAvatar) {
          elAvatar.classList.remove("reaccion-" + tipo);
        }
      }, 250);
    }, duracion);
  }

  function vozAnimalese(char) {
    if (typeof AudioJuego !== "undefined" && AudioJuego.vozKiwifina) {
      AudioJuego.vozKiwifina(char);
    }
  }

  function finalizarEscritura() {
    if (typewriterTimeout) {
      clearTimeout(typewriterTimeout);
      typewriterTimeout = null;
    }
    escribiendo = false;
    elTexto.textContent = textoObjetivo;
    if (elAvatar) elAvatar.classList.remove("hablando");

    if (opcionesPendientes && opcionesPendientes.length > 0) {
      elCursor.style.display = "none";
      renderizarOpciones(opcionesPendientes);
    } else {
      elCursor.style.display = "inline-block";
    }

    if (typeof onCompletarCallback === "function") {
      const cb = onCompletarCallback;
      onCompletarCallback = null;
      cb();
    }
  }

  function avanzarTypewriter() {
    if (indiceTexto < textoObjetivo.length) {
      const char = textoObjetivo[indiceTexto];
      elTexto.textContent += char;
      indiceTexto++;

      if (char !== " " && char !== "\n") {
        vozAnimalese(char);
      }

      // Pausa más natural en signos de puntuación
      let demora = 28;
      if (char === "." || char === "!" || char === "?") {
        demora = 140;
      } else if (char === "," || char === ";") {
        demora = 70;
      }

      typewriterTimeout = setTimeout(avanzarTypewriter, demora);
    } else {
      finalizarEscritura();
    }
  }

  function decir(texto, opciones = null, onFin = null) {
    if (typewriterTimeout) {
      clearTimeout(typewriterTimeout);
      typewriterTimeout = null;
    }
    textoObjetivo = texto;
    indiceTexto = 0;
    escribiendo = true;
    opcionesPendientes = opciones;
    onCompletarCallback = onFin;

    elTexto.textContent = "";
    elCursor.style.display = "none";
    elOpciones.style.display = "none";
    elOpciones.replaceChildren();

    if (elAvatar) elAvatar.classList.add("hablando");
    avanzarTypewriter();
  }

  function saltarOContinuar() {
    if (!dialogo.open) return;
    if (escribiendo) {
      finalizarEscritura();
    } else if (opcionesPendientes && opcionesPendientes.length > 0) {
      // Si ya terminó de escribir y hay opciones, enfocar la primera opción
      const primerBoton = elOpciones.querySelector("button");
      if (primerBoton) primerBoton.focus();
    } else {
      // Si no había opciones, mostrar las opciones principales por defecto
      mostrarOpcionesPrincipales();
    }
  }

  function renderizarOpciones(opciones) {
    elOpciones.replaceChildren();
    for (const op of opciones) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kiwifina-boton-opcion" + (op.clase ? " " + op.clase : "");
      btn.innerHTML = op.texto;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof AudioJuego !== "undefined" && AudioJuego.efecto) {
          AudioJuego.efecto("ui");
        }
        op.accion();
      });
      elOpciones.append(btn);
    }
    elOpciones.style.display = "flex";
  }

  function opcionesPrincipales() {
    return [
      {
        texto: "🛒 Ver tienda (Comprar)",
        accion: () => {
          cerrarDialogoKiwifina(false);
          if (typeof abrirComercio === "function") {
            abrirComercio("tienda");
            if (typeof cambiarPaginaComercio === "function") {
              cambiarPaginaComercio("comprar");
            }
          }
        },
      },
      {
        texto: "💰 Vender capturas",
        accion: () => {
          cerrarDialogoKiwifina(false);
          if (typeof abrirComercio === "function") {
            abrirComercio("tienda");
            if (typeof cambiarPaginaComercio === "function") {
              cambiarPaginaComercio("vender");
            }
          }
        },
      },
      {
        texto: "💡 Pedir un consejo",
        accion: darConsejo,
      },
      {
        texto: "👋 Hasta luego",
        clase: "opcion-salir",
        accion: despedirse,
      },
    ];
  }

  function mostrarOpcionesPrincipales() {
    renderizarOpciones(opcionesPrincipales());
  }

  function darConsejo() {
    mostrarEmoteKiwifina("idea");
    let indice = Math.floor(Math.random() * CONSEJOS_KIWIFINA.length);
    if (indice === ultimoConsejoIndex && CONSEJOS_KIWIFINA.length > 1) {
      indice = (indice + 1) % CONSEJOS_KIWIFINA.length;
    }
    ultimoConsejoIndex = indice;
    const consejo = CONSEJOS_KIWIFINA[indice];

    decir(consejo, opcionesPrincipales());
  }

  function despedirse() {
    mostrarEmoteKiwifina("corazon");
    const despedida =
      DESPEDIDAS_KIWIFINA[
        Math.floor(Math.random() * DESPEDIDAS_KIWIFINA.length)
      ];
    decir(despedida, null, () => {
      setTimeout(() => {
        cerrarDialogoKiwifina(true);
      }, 1000);
    });
  }

  function generarSaludoInicial() {
    const tienePeces =
      typeof inventario !== "undefined" &&
      Array.isArray(inventario) &&
      inventario.length > 0;

    if (tienePeces) {
      const tieneLegendario = inventario.some(
        (p) => p && (p.rareza === "legendario" || p.rareza === "epico"),
      );
      if (tieneLegendario) {
        mostrarEmoteKiwifina("sorpresa");
        return "¡Guau, mirá eso! ¡Siento una presencia legendaria en tu mochila! ¿Querés que te la compre o buscás renovar tu equipo?";
      }
      mostrarEmoteKiwifina("alegria");
      const cant = inventario.length;
      return `¡Hola pescador! Veo que traés ${cant} ${cant === 1 ? "captura fresca" : "capturas frescas"} en la mochila. ¿Querés venderlas o mejorar tu equipo?`;
    }

    if (typeof dinero !== "undefined" && dinero <= 10) {
      mostrarEmoteKiwifina("sudor");
      return "¡Hola! Uyy, veo que andamos con los bolsillos un poco flacos hoy... ¡Pescá unas carpas en la orilla para empezar!";
    }

    const saludos = [
      "¡Hola! Bienvenid@ a la tienda del muelle. Soy Kiwifina. ¿En qué te puedo ayudar hoy?",
      "¡Qué lindo día para pescar! El agua está calma y los peces andan con ganas de picar. ¿Buscás equipo nuevo o algún consejo?",
      "¡Hola! Acá en la tienda tengo cañas reforzadas, anzuelos y cebos frescos. ¿Qué necesitás para tu jornada?",
      "¡Buenas! Si tenés dudas sobre qué cebo usar o cómo sacar especies difíciles, ¡preguntame lo que quieras!",
    ];

    return saludos[Math.floor(Math.random() * saludos.length)];
  }

  function iniciarDialogoKiwifina(textoPersonalizado = null) {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (typeof dialogoComercio !== "undefined" && dialogoComercio.open) {
      dialogoComercio.close();
    }

    const texto = textoPersonalizado || generarSaludoInicial();
    decir(texto, opcionesPrincipales());

    if (!dialogo.open) {
      dialogo.showModal();
    }
  }

  function cerrarDialogoKiwifina(salirDelLocal = false) {
    if (typewriterTimeout) {
      clearTimeout(typewriterTimeout);
      typewriterTimeout = null;
    }
    escribiendo = false;
    if (dialogo.open) {
      dialogo.close();
    }
    if (salirDelLocal && typeof salirDeLaTienda === "function") {
      // Campanilla suave al salir de la tienda
      if (window.AudioJuego && typeof window.AudioJuego.campanillaTienda === "function")
        window.AudioJuego.campanillaTienda(true);
      salirDeLaTienda();
    }
  }

  // Interacción: Clic en la caja o botones
  dialogo.addEventListener("click", (e) => {
    // Si hizo clic en un botón de opción, dejamos que el botón maneje su evento
    if (e.target.closest("button")) return;
    saltarOContinuar();
  });

  // Interacción por teclado (Espacio, Enter, E para avanzar; Escape para salir)
  window.addEventListener("keydown", (e) => {
    if (!dialogo.open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cerrarDialogoKiwifina(true);
      return;
    }

    if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
      if (document.activeElement && document.activeElement.tagName === "BUTTON") {
        return; // El botón procesará la tecla
      }
      e.preventDefault();
      saltarOContinuar();
    }
  });

  dialogo.addEventListener("cancel", (e) => {
    e.preventDefault();
    cerrarDialogoKiwifina(true);
  });

  // Exportar al ámbito global
  window.iniciarDialogoKiwifina = iniciarDialogoKiwifina;
  window.cerrarDialogoKiwifina = cerrarDialogoKiwifina;
  window.mostrarEmoteKiwifina = mostrarEmoteKiwifina;
  window.decirKiwifina = decir;
  window.dialogoKiwifina = dialogo;
})();
