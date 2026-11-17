// Enciclopedia de especies: interfaz modal responsiva y accesible.
const dialogoEnciclopedia = document.createElement("dialog");
dialogoEnciclopedia.id = "dialogo-enciclopedia";
dialogoEnciclopedia.setAttribute("aria-labelledby", "enciclopedia-titulo");
dialogoEnciclopedia.innerHTML = `
  <header class="enciclopedia-cabecera">
    <div>
      <small>BLUE HAVEN · GUÍA DE CAMPO</small>
      <h2 id="enciclopedia-titulo">📖 Enciclopedia de Especies</h2>
    </div>
    <div id="enciclopedia-progreso" class="enciclopedia-progreso"></div>
  </header>
  <div class="enciclopedia-cuerpo">
    <nav id="enciclopedia-lista" class="enciclopedia-lista" aria-label="Especies de peces"></nav>
    <article id="enciclopedia-detalle" class="enciclopedia-detalle"></article>
  </div>
  <footer class="enciclopedia-pie">
    <small>Navegá con las flechas o hacé clic en un pez · [L] o [Esc] para cerrar</small>
    <button id="enciclopedia-cerrar" type="button">Volver al lago</button>
  </footer>
`;
document.body.appendChild(dialogoEnciclopedia);

const ENCICLOPEDIA = {
  get abierta() {
    return dialogoEnciclopedia.open;
  },
  set abierta(val) {
    if (val && !dialogoEnciclopedia.open) abrirEnciclopedia();
    else if (!val && dialogoEnciclopedia.open) cerrarEnciclopedia();
  },
  indiceSeleccionado: 0,
  peces: CATALOGO_ESPECIES,
};

function renderizarDetalleEnciclopedia(indice) {
  ENCICLOPEDIA.indiceSeleccionado = indice;
  const pez = CATALOGO_ESPECIES[indice];
  const detalle = document.getElementById("enciclopedia-detalle");
  detalle.replaceChildren();
  if (!pez) return;

  const botones = document.querySelectorAll(".enciclopedia-item-boton");
  botones.forEach((b, i) =>
    b.setAttribute("aria-current", String(i === indice)),
  );

  const registro =
    typeof REGISTRO_CAPTURAS !== "undefined"
      ? REGISTRO_CAPTURAS[pez.nombre]
      : null;
  const descubierto = !!registro;

  const ficha = document.createElement("div");
  ficha.className = "enciclopedia-ficha";

  const imagen = document.createElement("img");
  imagen.src = "textures/peces/" + pez.sprite;
  imagen.alt = descubierto ? pez.nombre : "Silueta de pez sin descubrir";
  imagen.className =
    "enciclopedia-pez-img" + (descubierto ? "" : " sin-descubrir");
  ficha.appendChild(imagen);

  const titulo = document.createElement("h3");
  titulo.textContent = descubierto ? pez.nombre : "Especie no descubierta";
  ficha.appendChild(titulo);

  if (!descubierto) {
    const aviso = document.createElement("p");
    aviso.className = "enciclopedia-aviso-bloqueado";
    aviso.textContent =
      "Pescá en el lago para registrar los datos científicos y hábitos de esta especie.";
    ficha.appendChild(aviso);
    detalle.appendChild(ficha);
    return;
  }

  const datosLista = [
    ["Nombre científico", pez.nombreCientifico || "—"],
    ["Hábitat", pez.habitat || "Lago"],
    ["Alimentación", pez.alimentacion || "—"],
    ["Tamaño promedio", pez.tamaño || "—"],
    ["Peso promedio", pez.peso || "—"],
    ["Cebo recomendado", pez.ceboRecomendado || "Cualquiera"],
    ["Dato curioso", pez.datoCurioso || ""],
    ["Capturas", String(registro.capturas || 0)],
  ];

  const tabla = document.createElement("dl");
  tabla.className = "enciclopedia-datos";
  for (const [clave, valor] of datosLista) {
    if (!valor) continue;
    const dt = document.createElement("dt");
    dt.textContent = clave;
    const dd = document.createElement("dd");
    dd.textContent = valor;
    tabla.appendChild(dt);
    tabla.appendChild(dd);
  }
  ficha.appendChild(tabla);
  detalle.appendChild(ficha);
}

function renderizarEnciclopedia() {
  const lista = document.getElementById("enciclopedia-lista");
  const progreso = document.getElementById("enciclopedia-progreso");
  lista.replaceChildren();

  const total = CATALOGO_ESPECIES.length;
  let descubiertas = 0;

  CATALOGO_ESPECIES.forEach((pez, i) => {
    const registro =
      typeof REGISTRO_CAPTURAS !== "undefined"
        ? REGISTRO_CAPTURAS[pez.nombre]
        : null;
    const descubierto = !!registro;
    if (descubierto) descubiertas++;

    const b = document.createElement("button");
    b.type = "button";
    b.className = "enciclopedia-item-boton" + (descubierto ? "" : " bloqueado");
    b.setAttribute(
      "aria-current",
      String(i === ENCICLOPEDIA.indiceSeleccionado),
    );

    const icono = document.createElement("span");
    icono.className = "enciclopedia-item-icono";
    icono.textContent = descubierto ? "🐟" : "🔒";

    const nombre = document.createElement("span");
    nombre.className = "enciclopedia-item-nombre";
    nombre.textContent = descubierto ? pez.nombre : `Especie ${i + 1}`;

    b.appendChild(icono);
    b.appendChild(nombre);
    b.addEventListener("click", () => renderizarDetalleEnciclopedia(i));
    lista.appendChild(b);
  });

  progreso.textContent = `Descubiertas: ${descubiertas} / ${total}`;
  renderizarDetalleEnciclopedia(ENCICLOPEDIA.indiceSeleccionado);
}

function abrirEnciclopedia() {
  if (typeof preparandoLance !== "undefined" && preparandoLance) return;
  if (typeof interfazBloqueada === "function" && interfazBloqueada()) return;
  if (document.pointerLockElement) document.exitPointerLock();
  renderizarEnciclopedia();
  dialogoEnciclopedia.showModal();
}

function cerrarEnciclopedia() {
  if (dialogoEnciclopedia.open) dialogoEnciclopedia.close();
  if (document.body.classList.contains("jugando") && !cursorLibre) {
    capturarCursor();
  }
}

document
  .getElementById("enciclopedia-cerrar")
  .addEventListener("click", cerrarEnciclopedia);
dialogoEnciclopedia.addEventListener("cancel", cerrarEnciclopedia);

// Stubs para compatibilidad transparente con sketch.js
function dibujarEnciclopedia() {}
function manejarClicEnciclopedia() {}
function manejarRuedaEnciclopedia() {}
function actualizarHoverEnciclopedia() {}
function navegarEnciclopedia(dir) {
  const total = CATALOGO_ESPECIES.length;
  if (total === 0) return;
  const nuevo = (ENCICLOPEDIA.indiceSeleccionado + dir + total) % total;
  renderizarDetalleEnciclopedia(nuevo);
}
