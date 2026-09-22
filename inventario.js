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

function precioDe(pez) {
  return PRECIOS_POR_RAREZA[pez.rareza] || 10;
}

function mostrarMensaje(texto) {
  mensajeHUD = texto;
  timerMensaje = 3000;
}

// Busca el id real (de la base) de un pez por nombre, usando el catálogo
// que se cargó al arrancar el juego (ver cargarDatosUsuario en sketch.js).
function obtenerIdPez(nombre) {
  if (typeof catalogoEspecies === "undefined" || !catalogoEspecies) return null;
  const encontrado = catalogoEspecies.find((p) => p.nombre === nombre);
  return encontrado ? encontrado.id : null;
}

async function agregarPez(pez) {
  if (inventario.length >= MAX_RANURAS) {
    mostrarMensaje("Mochila llena. Andá a vender a la tienda.");
    return false;
  }

  const pezId = obtenerIdPez(pez.nombre);
  const item = {
    pez_id: pezId,
    nombre: pez.nombre,
    rareza: pez.rareza,
    sprite: pez.sprite || null,
  };
  inventario.push(item);

  if (pezId) {
    try {
      const res = await fetch("api/guardar_captura.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pez_id: pezId }),
      });
      const data = await res.json();
      if (data.ok) item.id = data.inventario_id; // id en inventario_peces, para poder venderlo
    } catch (err) {
      // sin conexión: el pez queda en la mochila local pero no se guardó en el servidor
    }
  }

  return true;
}

function valorTotalInventario() {
  let total = 0;
  for (const pez of inventario) total += precioDe(pez);
  return total;
}

async function venderPez(indice) {
  if (indice < 0 || indice >= inventario.length) return;
  const pez = inventario[indice];

  if (!pez.id) {
    mostrarMensaje("Esperá un segundo, se está guardando ese pez todavía.");
    return;
  }

  try {
    const res = await fetch("api/vender.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventario_id: pez.id }),
    });
    const data = await res.json();

    if (!data.ok) {
      mostrarMensaje(data.error || "No se pudo vender el pez.");
      return;
    }

    dinero += data.precio;
    inventario.splice(indice, 1);
    mostrarMensaje("Vendiste " + pez.nombre + " por $" + data.precio);
  } catch (err) {
    mostrarMensaje("No se pudo conectar al servidor.");
  }
}

async function venderTodos() {
  if (inventario.length === 0) return;

  try {
    const res = await fetch("api/vender_todos.php", { method: "POST" });
    const data = await res.json();

    if (!data.ok) {
      mostrarMensaje(data.error || "No se pudo vender.");
      return;
    }

    dinero += data.total;
    inventario.length = 0;
    mostrarMensaje("Vendiste todo por $" + data.total);
  } catch (err) {
    mostrarMensaje("No se pudo conectar al servidor.");
  }
}

function abrirMenuTienda() {
  if (inventario.length === 0) {
    mostrarMensaje("No tenés peces para vender.");
    return;
  }
  menuTienda = "tienda";
  if (document.pointerLockElement) document.exitPointerLock();
}

function abrirMenuInventario() {
  menuTienda = "inventario";
  if (document.pointerLockElement) document.exitPointerLock();
}

function cerrarMenu() {
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
    inventario.length > 0 ? "[E]  Vender peces en la tienda" : "[E]  Tienda",
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
  textSize(12);
  let estrellas = "";
  for (let e = 0; e < pez.rareza; e++) estrellas += "*";
  text(estrellas, x + 42 + anchoNombre + 8, y + h / 2);
  fill(255, 230, 150);
  text("$" + precioDe(pez), x + w - 130, y + h / 2);
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

function dibujarPanelInventario() {
  const p = _rectPanel();
  push();
  fill(10, 18, 28, 235);
  stroke(70, 110, 150);
  strokeWeight(2);
  rect(p.x, p.y, p.w, p.h, 12);
  noStroke();

  fill(180, 220, 255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Inventario", p.x + 14, p.y + 26);
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(255, 230, 150);
  text("Valor: $" + valorTotalInventario(), p.x + p.w - 14, p.y + 26);

  if (inventario.length === 0) {
    fill(220, 230, 240);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("Mochila vacía. Pescalos en el lago.", p.x + p.w / 2, p.y + p.h / 2);
  } else {
    for (let i = 0; i < inventario.length && i < MAX_RANURAS; i++) {
      const y = p.y + 52 + i * 38;
      fill(22, 34, 48, 230);
      rect(p.x + 10, y, p.w - 20, 34, 6);
      _dibujarPezFila(inventario[i], p.x + 10, y, p.w - 20, 34);
    }
  }

  fill(160, 200, 240);
  textAlign(CENTER, CENTER);
  textSize(12);
  text("Clic para cerrar", p.x + p.w / 2, p.y + p.h - 20);
  textAlign(LEFT, BASELINE);
  pop();
}