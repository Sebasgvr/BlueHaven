const CALIDADES = [
  {
    id: "comun",
    nombre: "Común",
    nivel: 1,
    peso: 60,
    multiplicador: 1,
    escalaDificultad: 1,
    color: [205, 210, 220],
    icono: "●",
  },
  {
    id: "poco_comun",
    nombre: "Poco común",
    nivel: 2,
    peso: 25,
    multiplicador: 1.5,
    escalaDificultad: 1.1,
    color: [90, 210, 120],
    icono: "◆",
  },
  {
    id: "raro",
    nombre: "Raro",
    nivel: 3,
    peso: 10,
    multiplicador: 2.25,
    escalaDificultad: 1.22,
    color: [80, 160, 255],
    icono: "★",
  },
  {
    id: "epico",
    nombre: "Épico",
    nivel: 4,
    peso: 4,
    multiplicador: 3.5,
    escalaDificultad: 1.38,
    color: [190, 110, 255],
    icono: "✦",
  },
  {
    id: "legendario",
    nombre: "Legendario",
    nivel: 5,
    peso: 1,
    multiplicador: 5.5,
    escalaDificultad: 1.55,
    color: [255, 190, 60],
    icono: "♛",
  },
];

const CALIDAD_POR_ID = {};
for (const calidad of CALIDADES) CALIDAD_POR_ID[calidad.id] = calidad;

const BONUS_RIESGO = 1.4;

// La calidad es global y no depende de la especie.
function rollCalidad() {
  const total = CALIDADES.reduce((suma, calidad) => suma + calidad.peso, 0);
  let tirada = random(total);
  for (const calidad of CALIDADES) {
    tirada -= calidad.peso;
    if (tirada <= 0) return calidad;
  }
  return CALIDADES[0];
}

function calidadDe(pez) {
  if (!pez) return CALIDADES[0];
  if (pez.calidadId && CALIDAD_POR_ID[pez.calidadId]) {
    return CALIDAD_POR_ID[pez.calidadId];
  }
  return CALIDADES[0];
}

function colorCalidad(calidad, alpha) {
  const datos = typeof calidad === "string" ? CALIDAD_POR_ID[calidad] : calidad;
  const c = datos || CALIDADES[0];
  return color(c.color[0], c.color[1], c.color[2], alpha == null ? 255 : alpha);
}

// Devuelve el ancho ocupado.
function dibujarEtiquetaCalidad(calidad, x, y, tam, alineacion) {
  const datos = typeof calidad === "string" ? CALIDAD_POR_ID[calidad] : calidad;
  if (!datos) return 0;

  const texto = datos.icono + " " + datos.nombre;
  const t = tam || 11;
  push();
  textSize(t);
  textAlign(CENTER, CENTER);
  const ancho = textWidth(texto) + 16;
  const alto = t + 9;
  let izquierda = x;
  if (alineacion === "derecha") izquierda = x - ancho;
  else if (alineacion === "centro") izquierda = x - ancho / 2;

  fill(datos.color[0], datos.color[1], datos.color[2], 45);
  stroke(datos.color[0], datos.color[1], datos.color[2], 230);
  strokeWeight(1.2);
  rect(izquierda, y - alto / 2, ancho, alto, alto / 2);

  noStroke();
  fill(datos.color[0], datos.color[1], datos.color[2]);
  text(texto, izquierda + ancho / 2, y + 0.5);
  pop();
  return ancho;
}

// Colección en memoria: capturas y mejor ejemplar por especie.
const REGISTRO_CAPTURAS = {};

function registrarCaptura(pez) {
  if (!pez || !pez.nombre) return;
  const calidad = calidadDe(pez);
  const registro = REGISTRO_CAPTURAS[pez.nombre] || {
    capturas: 0,
    mejorCalidadId: null,
    mejorPrecio: 0,
    ultimaCalidadId: null,
  };

  registro.capturas++;
  registro.ultimaCalidadId = calidad.id;

  const mejorActual = registro.mejorCalidadId
    ? CALIDAD_POR_ID[registro.mejorCalidadId]
    : null;
  const precio = pez.precio || 0;
  if (
    !mejorActual ||
    calidad.nivel > mejorActual.nivel ||
    (calidad.nivel === mejorActual.nivel &&
      precio > (registro.mejorPrecio || 0))
  ) {
    registro.mejorCalidadId = calidad.id;
    registro.mejorPrecio = precio;
  }

  REGISTRO_CAPTURAS[pez.nombre] = registro;
}

function registroDe(nombre) {
  return REGISTRO_CAPTURAS[nombre] || null;
}

function mejorCalidadDe(nombre) {
  const registro = registroDe(nombre);
  if (!registro || !registro.mejorCalidadId) return null;
  return CALIDAD_POR_ID[registro.mejorCalidadId] || null;
}
