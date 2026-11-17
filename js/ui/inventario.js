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
  if (typeof dialogoComercio !== "undefined" && dialogoComercio.open)
    mensajeComercio(texto);
}

// Busca el id real (de la base) de un pez por nombre, usando el catÃ¡logo
// cargado al iniciar sesiÃ³n (si estÃ¡ disponible).
function obtenerIdPez(nombre) {
  if (typeof catalogoEspecies === "undefined" || !catalogoEspecies) return null;
  const encontrado = catalogoEspecies.find((p) => p.nombre === nombre);
  return encontrado ? encontrado.id : null;
}

let operacionInventario = false;
async function agregarPez(pez) {
  const ejemplar = {
    ...pez,
    pez_id: obtenerIdPez(pez.nombre),
    precio: calcularPrecio(pez),
  };
  if (window.modoInvitado) {
    if (inventario.length < MAX_RANURAS) inventario.push(ejemplar);
    else mostrarMensaje("Mochila llena: captura registrada y liberada.");
    guardarProgresoLocal();
    return true;
  }
  if (!ejemplar.pez_id) {
    estadoGuardado("Especie sin catÃ¡logo: no se pudo guardar.");
    return false;
  }
  try {
    const data = await apiJuego("guardar_captura", {
      pez_id: ejemplar.pez_id,
      calidad: ejemplar.calidadId,
      riesgo: !!ejemplar.capturaRiesgo,
      captura_token: window.crypto.randomUUID(),
    });
    if (data.inventario_id)
      inventario.push({
        ...ejemplar,
        id: data.inventario_id,
        precio: data.precio,
      });
    else mostrarMensaje("Mochila llena: captura registrada y liberada.");
    guardarProgresoLocal();
    estadoGuardado("Captura guardada");
    return true;
  } catch (e) {
    estadoGuardado("No se guardÃ³ la captura: " + e.message);
    return false;
  }
}
function valorTotalInventario() {
  return inventario.reduce((total, pez) => total + precioDe(pez), 0);
}
async function venderPez(indice) {
  if (operacionInventario || !inventario[indice]) return;
  operacionInventario = true;
  const pez = inventario[indice];
  try {
    let precio = precioDe(pez);
    if (!window.modoInvitado) {
      const data = await apiJuego("vender", { inventario_id: pez.id });
      precio = data.precio;
      dinero = Number(data.dinero);
    } else dinero += precio;
    inventario.splice(inventario.indexOf(pez), 1);
    window.AudioJuego?.efecto("monedas");
    mostrarMensaje("Vendiste " + pez.nombre + " por $" + precio);
    guardarProgresoLocal();
    estadoGuardado("Progreso guardado");
  } catch (e) {
    estadoGuardado(e.message);
    if (typeof mensajeComercio === "function") mensajeComercio(e.message, true);
  } finally {
    operacionInventario = false;
  }
}
async function venderTodos() {
  if (operacionInventario || !inventario.length) return;
  operacionInventario = true;
  try {
    let total = valorTotalInventario();
    if (!window.modoInvitado) {
      const data = await apiJuego("vender_todos");
      total = data.total;
      dinero = Number(data.dinero);
    } else dinero += total;
    inventario.length = 0;
    window.AudioJuego?.efecto("monedas");
    mostrarMensaje("Vendiste todo por $" + total);
    guardarProgresoLocal();
    estadoGuardado("Progreso guardado");
  } catch (e) {
    estadoGuardado(e.message);
    if (typeof mensajeComercio === "function") mensajeComercio(e.message, true);
  } finally {
    operacionInventario = false;
  }
}

function abrirMenuTienda() {
  if (!cercaDeTienda()) return;
  if (!entrarALaTienda()) {
    mostrarMensaje("No se pudo encontrar un lugar libre en la tienda.");
    return;
  }
  abrirComercio("tienda");
}
function abrirMenuInventario() {
  abrirComercio("equipo");
}

function cerrarMenu() {
  if (typeof dialogoComercio !== "undefined" && dialogoComercio.open)
    cerrarComercio();
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
  text("[E]  Entrar · Comprar / Vender", width / 2, height * 0.85 - 2);
  textAlign(LEFT, BASELINE);
}

let tieneCañaBambu = false;
let cañaEquipada = "basica";

function seleccionarCaña(tipo) {
  return equiparProducto(tipo);
}
function abrirMenuComprarCaña() {
  abrirMenuTienda();
  comercio.pagina = "comprar";
  comercio.categoria = "cana";
  renderizarComercio();
}
