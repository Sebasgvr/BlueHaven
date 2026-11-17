// Chatbot de BlueHaven: guía de pesca conectada a la base de datos.
const botonChat = document.getElementById("boton-chat");
const panelChat = document.getElementById("panel-chat");
const listaMensajes = document.getElementById("chat-mensajes");
const contenedorSugerencias = document.getElementById("chat-sugerencias");
const formChat = document.getElementById("chat-form");
const inputChat = document.getElementById("chat-input");
const botonCerrarChat = document.getElementById("chat-cerrar");

let chatAbierto = false;
let chatEnviando = false;
window.chatAbierto = chatAbierto;

const SUGERENCIAS = [
  "¿Cómo pescar el Atún?",
  "¿Qué cebo recomiendas para la Carpa?",
  "¿Dónde vive la Trucha Arcoíris?",
  "¿De qué tamaño es el Esturión Gigante?",
  "¿Qué peces hay?",
];

function chatJugando() {
  return document.body.classList.contains("jugando");
}

function abrirChat() {
  if (!chatJugando() || document.querySelector("dialog[open]")) return;
  if (typeof sistemaCaptura !== "undefined") sistemaCaptura.soltarBoton();
  chatAbierto = true;
  window.chatAbierto = true;
  panelChat.classList.remove("oculto");
  botonChat.classList.add("oculto");
  botonChat.setAttribute("aria-expanded", "true");
  if (document.pointerLockElement) document.exitPointerLock();
  saludarChat();
  inputChat.focus();
}

function cerrarChat() {
  chatAbierto = false;
  window.chatAbierto = false;
  panelChat.classList.add("oculto");
  botonChat.classList.remove("oculto");
  botonChat.setAttribute("aria-expanded", "false");
}

function agregarMensaje(remitente, texto, esError) {
  const burbuja = document.createElement("div");
  burbuja.className = "chat-burbuja";
  burbuja.textContent = texto;
  const msg = document.createElement("div");
  msg.className = "chat-msg " + remitente + (esError ? " error" : "");
  msg.appendChild(burbuja);
  listaMensajes.appendChild(msg);
  listaMensajes.scrollTop = listaMensajes.scrollHeight;
}

function mensajeCargando() {
  const msg = document.createElement("div");
  msg.className = "chat-msg bot";
  msg.id = "chat-cargando";
  const burbuja = document.createElement("div");
  burbuja.className = "chat-burbuja";
  burbuja.textContent = "Escribiendo…";
  msg.appendChild(burbuja);
  listaMensajes.appendChild(msg);
  listaMensajes.scrollTop = listaMensajes.scrollHeight;
}

function quitarCargando() {
  const el = document.getElementById("chat-cargando");
  if (el) el.remove();
}

async function preguntar(texto) {
  texto = (texto || "").trim();
  if (!texto || chatEnviando) return;
  if (FiltrosCuentas.contieneOfensas(texto)) {
    agregarMensaje(
      "bot",
      "Escribí tu pregunta sin insultos ni palabras ofensivas.",
    );
    inputChat.focus();
    return;
  }
  chatEnviando = true;
  agregarMensaje("usuario", texto);
  mensajeCargando();
  inputChat.value = "";

  // Busca por nombre completo o por palabras del nombre (así "trucha" encuentra "Trucha Arcoíris").
  // Gana la especie con más palabras coincidentes; si hay empate gana el nombre más largo.
  const normalizar = (t) =>
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const pregunta = normalizar(texto);
  let pez = null,
    mejorPuntos = 0;
  for (const p of ENCICLOPEDIA.peces) {
    const tokens = normalizar(p.nombre)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4);
    if (!tokens.length) continue;
    const completo = pregunta.includes(normalizar(p.nombre))
      ? 100 + p.nombre.length
      : 0;
    const coincidencias = tokens.filter((t) => pregunta.includes(t)).length;
    const puntos =
      completo ||
      (coincidencias > 0
        ? coincidencias * 10 + normalizar(p.nombre).length
        : 0);
    if (puntos > mejorPuntos) {
      mejorPuntos = puntos;
      pez = p;
    }
  }
  if (mejorPuntos <= 0) pez = null;
  const respuesta = pez
    ? `${pez.nombre}\n${pez.descripcion}\nHábitat: ${pez.habitat}\nCebo: ${pez.ceboRecomendado}\n${pez.datoCurioso || ""}`
    : "Podés preguntarme por: " +
      ENCICLOPEDIA.peces.map((p) => p.nombre).join(", ") +
      ". Usá F para pescar, I para la mochila y L para la enciclopedia.";
  quitarCargando();
  agregarMensaje("bot", respuesta);
  chatEnviando = false;
  inputChat.focus();
  if (!window.modoInvitado) {
    try {
      await BaseDatos.registrarPregunta(texto, respuesta);
    } catch (err) {
      console.warn("No se pudo guardar la consulta de la guía:", err.message);
    }
  }
}

function crearSugerencias() {
  for (const s of SUGERENCIAS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip-sugerencia";
    chip.textContent = s;
    chip.addEventListener("click", () => preguntar(s));
    contenedorSugerencias.appendChild(chip);
  }
}

function saludarChat() {
  if (document.body.classList.contains("chat-saludado")) return;
  document.body.classList.add("chat-saludado");
  agregarMensaje(
    "bot",
    "¡Hola! Soy tu guía de pesca 🎣\nPreguntame por una especie y te cuento cómo encontrarla.",
  );
}

formChat.addEventListener("submit", (e) => {
  e.preventDefault();
  preguntar(inputChat.value);
});

botonCerrarChat.addEventListener("click", cerrarChat);
botonChat.addEventListener("click", abrirChat);

document.addEventListener("keydown", (e) => {
  const esCampo =
    e.target &&
    (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

  if (e.key === "Escape" && chatAbierto) {
    cerrarChat();
    return;
  }

  if (esCampo) return;

  const tecla = (e.key || "").toLowerCase();
  if (
    tecla === "q" &&
    chatJugando() &&
    !chatAbierto &&
    !document.getElementById("ajustes").open &&
    !document.getElementById("comercio")?.open
  ) {
    abrirChat();
  }
});

crearSugerencias();
