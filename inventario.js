const MAX_RANURAS = 10;

const PRECIOS_POR_RAREZA = {
  1: 50,
  2: 120,
  3: 300,
  4: 800,
  5: 2000,
};

let inventario = [];
let dinero = 0;
let menuTienda = "cerrado";
let mensajeHUD = "";
let timerMensaje = 0;

function precioBaseDe(pez) {
  return (pez && PRECIOS_POR_RAREZA[pez.rareza]) || 10;
}

// El precio se fija una sola vez por ejemplar.
function calcularPrecio(pez) {
  if (pez && typeof pez.precio === "number" && pez.precio > 0) {
    return pez.precio;
  }
  const multiplicador = (pez && pez.multiplicadorCalidad) || 1;
  const bonus = pez && pez.capturaRiesgo ? BONUS_RIESGO : 1;
  return Math.round(precioBaseDe(pez) * multiplicador * bonus);
}

function precioDe(pez) {
  return calcularPrecio(pez);
}

function mostrarMensaje(texto) {
  mensajeHUD = texto;
  timerMensaje = 3000;
  if(typeof dialogoComercio!=='undefined' && dialogoComercio.open) mensajeComercio(texto);
}

// Busca el id real (de la base) de un pez por nombre, usando el catálogo
// cargado al iniciar sesión (si está disponible).
function obtenerIdPez(nombre) {
  if (typeof catalogoEspecies === "undefined" || !catalogoEspecies) return null;
  const encontrado = catalogoEspecies.find((p) => p.nombre === nombre);
  return encontrado ? encontrado.id : null;
}

let operacionInventario = false;
async function apiJuego(ruta, datos = {}) {
  const partida = window.partidaId;
  const resultado = await BaseDatos.operar(ruta, datos);
  if (partida !== window.partidaId) throw new Error("La partida cambió durante la operación.");
  return resultado;
}
async function agregarPez(pez) {
  const ejemplar = { ...pez, pez_id: obtenerIdPez(pez.nombre), precio: calcularPrecio(pez) };
  if (window.modoInvitado) {
    if (inventario.length < MAX_RANURAS) inventario.push(ejemplar);
    else mostrarMensaje("Mochila llena: captura registrada y liberada.");
    guardarProgresoLocal();
    return true;
  }
  if (!ejemplar.pez_id) { estadoGuardado("Especie sin catálogo: no se pudo guardar."); return false; }
  try {
    const data = await apiJuego("guardar_captura", {
      pez_id: ejemplar.pez_id, calidad: ejemplar.calidadId, riesgo: !!ejemplar.capturaRiesgo,
      captura_token: window.crypto.randomUUID()
    });
    if (data.inventario_id) inventario.push({ ...ejemplar, id: data.inventario_id, precio: data.precio });
    else mostrarMensaje("Mochila llena: captura registrada y liberada.");
    guardarProgresoLocal();
    estadoGuardado("Captura guardada");
    return true;
  } catch (e) { estadoGuardado("No se guardó la captura: " + e.message); return false; }
}
function valorTotalInventario() { return inventario.reduce((total, pez) => total + precioDe(pez), 0); }
async function venderPez(indice) {
  if (operacionInventario || !inventario[indice]) return;
  operacionInventario = true;
  const pez = inventario[indice];
  try {
    let precio = precioDe(pez);
    if (!window.modoInvitado) {
      const data = await apiJuego("vender", { inventario_id: pez.id });
      precio = data.precio; dinero = Number(data.dinero);
    } else dinero += precio;
    inventario.splice(inventario.indexOf(pez), 1);
    mostrarMensaje("Vendiste " + pez.nombre + " por $" + precio);
    guardarProgresoLocal(); estadoGuardado("Progreso guardado");
  } catch (e) { estadoGuardado(e.message); if(typeof mensajeComercio==='function')mensajeComercio(e.message,true); }
  finally { operacionInventario = false; }
}
async function venderTodos() {
  if (operacionInventario || !inventario.length) return;
  operacionInventario = true;
  try {
    let total = valorTotalInventario();
    if (!window.modoInvitado) {
      const data = await apiJuego("vender_todos"); total = data.total; dinero = Number(data.dinero);
    } else dinero += total;
    inventario.length = 0;
    mostrarMensaje("Vendiste todo por $" + total);
    guardarProgresoLocal(); estadoGuardado("Progreso guardado");
  } catch (e) { estadoGuardado(e.message); if(typeof mensajeComercio==='function')mensajeComercio(e.message,true); }
  finally { operacionInventario = false; }
}

function abrirMenuTienda() {
  if (!cercaDeTienda()) return;
  if (!entrarALaTienda()) { mostrarMensaje("No se pudo encontrar un lugar libre en la tienda."); return; }
  abrirComercio('tienda');
}
function abrirMenuInventario() { abrirComercio('equipo'); }

function cerrarMenu() {
  if (typeof dialogoComercio!=='undefined' && dialogoComercio.open) dialogoComercio.close();
  menuTienda = "cerrado";
}

function dibujarHUD() {
  push();
  const ancho = 96;
  const alto = 26;
  let y = 10;

  fill(0, 0, 0, 150);
  noStroke();
  rect(width - ancho - 12, y, ancho, alto, 13);

  fill(255, 205, 60);
  stroke(160, 115, 15);
  strokeWeight(1.5);
  ellipse(width - ancho - 12 + 18, y + alto / 2, 15, 15);
  fill(120, 80, 10);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(11);
  text("$", width - ancho - 12 + 18, y + alto / 2 + 0.5);

  fill(255);
  textSize(14);
  text(String(dinero), width - ancho - 12 + 38, y + alto / 2 + 0.5);

  y += alto + 6;
  fill(0, 0, 0, 150);
  rect(width - ancho - 12, y, ancho, alto, 13);
  fill(255, 230, 150);
  textSize(13);
  text(
    "Mochila " + inventario.length + "/" + MAX_RANURAS,
    width - ancho - 12 + ancho / 2,
    y + alto / 2 + 0.5,
  );
  textAlign(LEFT, BASELINE);

  if (timerMensaje > 0) {
    timerMensaje -= deltaTime;
    fill(0, 0, 0, 170);
    rect(width / 2 - 115, height - 56, 230, 32, 8);
    fill(255, 255, 255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(mensajeHUD, width / 2, height - 40);
    textAlign(LEFT, BASELINE);
  }
  pop();
}

function dibujarIndicadorTienda() {
  const pulso = (sin(frameCount * 0.08) + 1) / 2;

  fill(0, 0, 0, 135);
  noStroke();
  rect(width / 2 - 115, height * 0.85 - 20, 230, 36, 8);

  fill(255, 210, 90, 185 + pulso * 70);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(
    "[E]  Entrar · Comprar / Vender",
    width / 2,
    height * 0.85 - 2,
  );
  textAlign(LEFT, BASELINE);
}

function _rectPanel() {
  const ancho = min(460, width - 30);
  const alto = min(480, height - 30);
  return { x: (width - ancho) / 2, y: (height - alto) / 2, w: ancho, h: alto };
}

function _construirLayoutVenta() {
  const panel = _rectPanel();
  const filas = [];
  for (let i = 0; i < inventario.length; i++) {
    const y = panel.y + 52 + i * 38;
    filas.push({
      y,
      vender: {
        x: panel.x + panel.w - 120,
        y: y + 3,
        w: 106,
        h: 28,
        indice: i,
      },
    });
  }
  return {
    panel,
    filas,
    todo: {
      x: panel.x + panel.w - 150,
      y: panel.y + panel.h - 46,
      w: 138,
      h: 30,
    },
    cerrar: { x: panel.x + 12, y: panel.y + panel.h - 46, w: 100, h: 30 },
  };
}

function _dibujarPezFila(pez, x, y, w, h) {
  const sprite = pez.sprite && spritesPeces[pez.sprite];
  if (sprite) {
    image(sprite, x + 8, y + 2, h - 4, h - 4);
  }

  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  const anchoNombre = textWidth(pez.nombre);
  text(pez.nombre, x + 42, y + h / 2);

  fill(255, 200, 60);
  textSize(9);
  let estrellas = "";
  for (let e = 0; e < pez.rareza; e++) estrellas += "*";
  text(estrellas, x + 42 + anchoNombre + 6, y + h / 2);

  const calidad = calidadDe(pez);
  dibujarEtiquetaCalidad(calidad, x + w - 108, y + h / 2, 10, "derecha");

  fill(255, 230, 150);
  textSize(12);
  textAlign(RIGHT, CENTER);
  text("$" + precioDe(pez), x + w - 8, y + h / 2);

  textAlign(LEFT, BASELINE);
}

function _dibujarBoton(r, colorTexto, texto, tamFuente) {
  push();
  fill(30, 45, 65, 240);
  stroke(120, 160, 200);
  strokeWeight(1.5);
  rect(r.x, r.y, r.w, r.h, 8);
  fill(colorTexto);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(tamFuente || 13);
  text(texto, r.x + r.w / 2, r.y + r.h / 2);
  textAlign(LEFT, BASELINE);
  pop();
}

function dibujarPanelVenta() {
  const l = _construirLayoutVenta();
  const p = l.panel;
  push();
  fill(10, 18, 28, 235);
  stroke(70, 110, 150);
  strokeWeight(2);
  rect(p.x, p.y, p.w, p.h, 12);
  noStroke();

  fill(120, 190, 255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Pescadería: Vender", p.x + 14, p.y + 26);
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(255, 230, 150);
  text("Dinero: $" + dinero, p.x + p.w - 14, p.y + 26);

  if (inventario.length === 0) {
    fill(220, 230, 240);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(
      "No tenés peces. Pescalos en el lago y volvé.",
      p.x + p.w / 2,
      p.y + p.h / 2 - 20,
    );
  } else {
    for (let i = 0; i < l.filas.length; i++) {
      const f = l.filas[i];
      fill(22, 34, 48, 230);
      rect(p.x + 10, f.y, p.w - 20, 34, 6);
      const pez = inventario[f.vender.indice];
      _dibujarPezFila(pez, p.x + 10, f.y, p.w - 20, 34);
      _dibujarBoton(f.vender, 255, "Vender");
    }
    _dibujarBoton(l.todo, 255, "Vender todo");
  }

  _dibujarBoton(l.cerrar, 200, "Salir");
  pop();
}

function manejarClicVenta(x, y) {
  const l = _construirLayoutVenta();
  const dentro = (r) =>
    x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  if (dentro(l.cerrar)) {
    cerrarMenu();
    return;
  }
  if (inventario.length === 0) return;
  if (dentro(l.todo)) {
    venderTodos();
    return;
  }
  for (const f of l.filas) {
    if (!dentro(f.vender)) continue;
    venderPez(f.vender.indice);
    return;
  }
}

function _rectPanelInventario() {
  const ancho = min(460, width - 30);
  const alto = min(540, height - 30);
  return { x: (width - ancho) / 2, y: (height - alto) / 2, w: ancho, h: alto };
}

// Botones para elegir la caña que se sostiene
function _layoutCañasInventario(p) {
  const w = (p.w - 30) / 2;
  const y = p.y + 40;
  return [
    { tipo: "basica", nombre: "Caña básica", x: p.x + 10, y, w, h: 34 },
    { tipo: "bambu", nombre: "Caña de Bambú", x: p.x + 20 + w, y, w, h: 34 },
  ];
}

function dibujarPanelInventario() {
  const p = _rectPanelInventario();
  push();
  fill(10, 18, 28, 235);
  stroke(70, 110, 150);
  strokeWeight(2);
  rect(p.x, p.y, p.w, p.h, 12);
  noStroke();

  fill(180, 220, 255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Inventario", p.x + 14, p.y + 22);
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(255, 230, 150);
  text("Valor: $" + valorTotalInventario(), p.x + p.w - 14, p.y + 22);

  // Selector de caña
  for (const b of _layoutCañasInventario(p)) {
    const bloqueada = b.tipo === "bambu" && !tieneCañaBambu;
    const equipada = cañaEquipada === b.tipo && !bloqueada;
    push();
    fill(equipada ? color(25, 75, 55, 240) : color(30, 45, 65, 240));
    stroke(equipada ? color(70, 180, 120) : color(120, 160, 200));
    strokeWeight(equipada ? 2.5 : 1.5);
    rect(b.x, b.y, b.w, b.h, 8);
    noStroke();
    fill(bloqueada ? color(130, 140, 150) : color(255));
    textAlign(CENTER, CENTER);
    textSize(13);
    text(
      b.nombre + (equipada ? "  ✓" : bloqueada ? "  (bloqueada)" : ""),
      b.x + b.w / 2,
      b.y + b.h / 2,
    );
    pop();
  }

  if (inventario.length === 0) {
    fill(220, 230, 240);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("Mochila vacía. Pescalos en el lago.", p.x + p.w / 2, p.y + p.h / 2);
  } else {
    for (let i = 0; i < inventario.length && i < MAX_RANURAS; i++) {
      const y = p.y + 88 + i * 38;
      fill(22, 34, 48, 230);
      rect(p.x + 10, y, p.w - 20, 34, 6);
      _dibujarPezFila(inventario[i], p.x + 10, y, p.w - 20, 34);
    }
  }

  fill(160, 200, 240);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(
    "Clic en una caña para equiparla  •  Clic fuera o [I] para cerrar",
    p.x + p.w / 2,
    p.y + p.h - 20,
  );
  textAlign(LEFT, BASELINE);
  pop();
}

function manejarClicInventario(x, y) {
  const p = _rectPanelInventario();
  for (const b of _layoutCañasInventario(p)) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      seleccionarCaña(b.tipo);
      return;
    }
  }
  cerrarMenu();
}

const PRECIO_CAÑA_TIENDA = 150;
let tieneCañaBambu = false;
// Caña que se tiene en la mano: "basica" o "bambu"
let cañaEquipada = "basica";

// Cambia la caña que se sostiene (solo si se tiene). Se llama desde el inventario.
function seleccionarCaña(tipo) { return equiparProducto(tipo); }
function abrirMenuComprarCaña() { abrirMenuTienda(); comercio.pagina='comprar'; comercio.categoria='cana'; renderizarComercio(); }
async function comprarCañaTienda() {
  if (cantidadObjeto('bambu')) { await equiparProducto('bambu'); return; }
  await comprarProducto('bambu');
  if (cantidadObjeto('bambu')) await equiparProducto('bambu');
}

function _rectPanelCompra() {
  const ancho = min(360, width - 30);
  const alto = min(280, height - 30);
  return { x: (width - ancho) / 2, y: (height - alto) / 2, w: ancho, h: alto };
}

function dibujarPanelComprarCaña() {
  const p = _rectPanelCompra();
  push();
  fill(12, 20, 32, 240);
  stroke(70, 120, 180);
  strokeWeight(2);
  rect(p.x, p.y, p.w, p.h, 12);
  noStroke();

  fill(130, 200, 255);
  textSize(17);
  textAlign(CENTER, CENTER);
  text("Pescadería: Caña de Pescar", p.x + p.w / 2, p.y + 26);

  const boxX = p.x + p.w / 2 - 32;
  const boxY = p.y + 54;
  fill(24, 38, 56, 220);
  stroke(60, 100, 140);
  strokeWeight(1.5);
  rect(boxX, boxY, 64, 64, 8);
  noStroke();

  fill(255, 220, 100);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("🎣", boxX + 32, boxY + 32);

  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Caña de Bambú", p.x + p.w / 2, p.y + 132);

  fill(255, 215, 80);
  textSize(14);
  text(
    "Precio: $" + PRECIO_CAÑA_TIENDA + "  (Tenés: $" + dinero + ")",
    p.x + p.w / 2,
    p.y + 154,
  );

  const btnW = 140;
  const btnH = 34;
  const btnY = p.y + p.h - 48;

  const btnComprar = { x: p.x + 24, y: btnY, w: btnW, h: btnH };
  push();
  fill(25, 75, 55, 240);
  stroke(70, 180, 120);
  strokeWeight(1.5);
  rect(btnComprar.x, btnComprar.y, btnComprar.w, btnComprar.h, 8);
  fill(140, 255, 180);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text(
    tieneCañaBambu ? "Comprada" : "Comprar [E]",
    btnComprar.x + btnComprar.w / 2,
    btnComprar.y + btnComprar.h / 2,
  );
  pop();

  const btnCancelar = { x: p.x + p.w - btnW - 24, y: btnY, w: btnW, h: btnH };
  push();
  fill(65, 30, 35, 240);
  stroke(180, 80, 90);
  strokeWeight(1.5);
  rect(btnCancelar.x, btnCancelar.y, btnCancelar.w, btnCancelar.h, 8);
  fill(255, 170, 175);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text(
    "Cancelar [Q]",
    btnCancelar.x + btnCancelar.w / 2,
    btnCancelar.y + btnCancelar.h / 2,
  );
  pop();

  pop();
}

function manejarClicComprarCaña(x, y) {
  const p = _rectPanelCompra();
  const btnW = 140;
  const btnH = 34;
  const btnY = p.y + p.h - 48;
  const btnComprar = { x: p.x + 24, y: btnY, w: btnW, h: btnH };
  const btnCancelar = { x: p.x + p.w - btnW - 24, y: btnY, w: btnW, h: btnH };

  const dentro = (r) =>
    x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  if (dentro(btnComprar)) {
    comprarCañaTienda();
  } else if (dentro(btnCancelar)) {
    cerrarMenu();
  }
}
