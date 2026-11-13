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
function claveProgreso() {
  return "BLUEHAVEN_PROGRESO_V2_" + (window.modoInvitado ? "invitado" : "usuario_" + window.sesionUsuario?.usuario_id);
}
function reiniciarEstadoEnMemoria() {
  for (const k in REGISTRO_CAPTURAS) delete REGISTRO_CAPTURAS[k];
  if(typeof TIENDA!=='undefined' && TIENDA.regreso) salirDeLaTienda();
  if(typeof reiniciarEquipo==='function') reiniciarEquipo();
  inventario = []; dinero = 0; tieneCañaBambu = false; cañaEquipada = "basica";
}
function estadoGuardado(mensaje) {
  const el = document.getElementById("estado-guardado");
  if (el) el.textContent = mensaje;
}

function guardarProgresoLocal() {
  try {
    const datos = {
      equipoPesca: typeof equipoPesca!=='undefined'?equipoPesca:null,
      objetosPesca: typeof objetosPesca!=='undefined'?objetosPesca:null,
      registro: REGISTRO_CAPTURAS,
      dinero: typeof dinero !== "undefined" ? dinero : 0,
      inventario: typeof inventario !== "undefined" ? inventario : [],
      tieneCañaBambu:
        typeof tieneCañaBambu !== "undefined" ? tieneCañaBambu : false,
      cañaEquipada:
        typeof cañaEquipada !== "undefined" ? cañaEquipada : "basica",
    };
    localStorage.setItem(claveProgreso(), JSON.stringify(datos));
  } catch (e) {
    console.warn("No se pudo guardar progreso en localStorage:", e);
  }
}

function cargarProgresoLocal() {
  try {
    const raw = localStorage.getItem(claveProgreso());
    if (!raw) return;
    const datos = JSON.parse(raw);
    if (datos && typeof datos === "object") {
      if (datos.registro && typeof datos.registro === "object") {
        Object.assign(REGISTRO_CAPTURAS, datos.registro);
      }
      if (window.modoInvitado && typeof datos.dinero === "number" && typeof dinero !== "undefined") {
        dinero = datos.dinero;
      }
      if (
        window.modoInvitado && Array.isArray(datos.inventario) &&
        typeof inventario !== "undefined"
      ) {
        inventario.length = 0;
        for (const item of datos.inventario) inventario.push(item);
      }
      if (
        window.modoInvitado && typeof datos.tieneCañaBambu === "boolean" &&
        typeof tieneCañaBambu !== "undefined"
      ) {
        tieneCañaBambu = datos.tieneCañaBambu;
      }
      if (window.modoInvitado && typeof equipoPesca !== 'undefined') {
        if(datos.objetosPesca && datos.equipoPesca){
          for(const producto of PRODUCTOS_TIENDA) objetosPesca[producto.id]=Math.max(0,Math.floor(Number(datos.objetosPesca[producto.id])||0));
          objetosPesca.basica=1;objetosPesca.sin_cebo=1;objetosPesca.simple=1;
          for(const categoria of ['cana','cebo','anzuelo']){
            const id=datos.equipoPesca[categoria];
            if(productoDe(id)?.categoria===categoria && cantidadObjeto(id)>0)equipoPesca[categoria]=id;
          }
        } else if(datos.tieneCañaBambu){objetosPesca.bambu=1;equipoPesca.cana=datos.cañaEquipada==='bambu'?'bambu':'basica';}
        sincronizarEquipoVisual();
      }

    }
  } catch (e) {
    console.warn("No se pudo cargar progreso de localStorage:", e);
  }
}

function reiniciarProgresoLocal() {
  try {
    localStorage.removeItem(claveProgreso());
  } catch (e) {}
  for (const k in REGISTRO_CAPTURAS) delete REGISTRO_CAPTURAS[k];
  if (typeof dinero !== "undefined") dinero = 0;
  if (typeof inventario !== "undefined") inventario.length = 0;
  if (typeof tieneCañaBambu !== "undefined") tieneCañaBambu = false;
  if (typeof cañaEquipada !== "undefined") cañaEquipada = "basica";
  if (typeof mostrarMensaje === "function")
    mostrarMensaje("Progreso reiniciado.");
}

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
  guardarProgresoLocal();
}

function registroDe(nombre) {
  return REGISTRO_CAPTURAS[nombre] || null;
}

function mejorCalidadDe(nombre) {
  const registro = registroDe(nombre);
  if (!registro || !registro.mejorCalidadId) return null;
  return CALIDAD_POR_ID[registro.mejorCalidadId] || null;
}
