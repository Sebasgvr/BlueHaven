// Sistema de caña 3D, lanzamiento parabólico del anzuelo y tanza
let cañaPesca;
let grupoAnzuelo;
let lineaPesca;
let anzueloPesca;
let anzueloLanzado = false;
let estadoLanzamiento = "reposo";
let progresoLanzamiento = 0;
let tiempoEnAgua = 0;
let esperaMordida = 0;
let lanzamientoCaeEnAgua = false;
let puntaCaña = new THREE.Vector3(0.12, -0.22, -0.72);
let destinoPescaMundo = new THREE.Vector3();
let inicioLanzamientoMundo = new THREE.Vector3();
let posicionAnzueloMundo = new THREE.Vector3();
let flotadorPesca = null;
let ondasFlotador = [];
let faseSalpicadura = 0;
let ajusteMiradaPesca = null;

function cancelarPesca() {
  secuenciaLance++;
  if (sistemaCaptura.estado === "inactivo" && estadoLanzamiento === "reposo")
    return;

  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  ajusteMiradaPesca = null;
  if (flotadorPesca) flotadorPesca.visible = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

// Duración (seg) de la preparación del lanzamiento: la caña se echa hacia atrás con el anzuelo colgando
const TIEMPO_PREPARACION_LANZAMIENTO = 0.28;
let preparacionLanzamiento = 0;

// Lanza el anzuelo desde la punta de la caña. Se puede usar desde cualquier lugar:
// si hay agua enfrente cae ahí; si no, cae en el suelo y la línea se recoge sola.
let preparandoLance = false;
let secuenciaLance = 0;
async function lanzarORecogerCaña() {
  if (preparandoLance) return;
  if (estadoLanzamiento === "reposo") {
    const agua = buscarPuntoPescaEnfrente();
    if (agua) {
      preparandoLance = true;
      const secuencia = ++secuenciaLance;
      try {
        efectosLance = await prepararEquipoLance();
        if (
          secuencia === secuenciaLance &&
          document.body.classList.contains("jugando")
        )
          iniciarLanzamientoAnzuelo(agua, true);
      } catch (e) {
        mostrarMensaje("No se pudo preparar el lanzamiento.");
        estadoGuardado(e.message);
      } finally {
        preparandoLance = false;
      }
    } else {
      const direccion = new THREE.Vector3();
      camara3D.getWorldDirection(direccion);
      direccion.y = 0;
      if (direccion.lengthSq() < 0.0001) direccion.set(0, 0, -1);
      direccion.normalize();
      const alcance = TAMAÑO_CELDA * 5;
      iniciarLanzamientoAnzuelo(
        new THREE.Vector3(
          jugador.posicion.x + direccion.x * alcance,
          0.08,
          jugador.posicion.y + direccion.z * alcance,
        ),
        false,
      );
    }
  } else if (
    estadoLanzamiento === "en_agua" ||
    estadoLanzamiento === "esperando"
  ) {
    iniciarRecogidaAnzuelo();
  }
}

function iniciarLanzamientoAnzuelo(destino, enAgua = true) {
  if (!destino) return;
  window.AudioJuego?.efecto("lanzar");
  destinoPescaMundo.copy(destino);
  // Sin animación de mirar hacia abajo: la cámara no se mueve al lanzar
  ajusteMiradaPesca = null;
  inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
  posicionAnzueloMundo.copy(inicioLanzamientoMundo);
  lanzamientoCaeEnAgua = enAgua;
  preparacionLanzamiento = 0;
  anzueloLanzado = true;
  estadoLanzamiento = "lanzando";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  faseSalpicadura = 0;
  if (flotadorPesca) flotadorPesca.visible = false;
}

function actualizarEncuadrePesca(dt) {
  if (!ajusteMiradaPesca) return;
  ajusteMiradaPesca.progreso = Math.min(
    1,
    ajusteMiradaPesca.progreso + dt * 2.4,
  );
  const t = ajusteMiradaPesca.progreso;
  const suave = t * t * (3 - 2 * t);
  jugador.inclinacion = lerp(
    ajusteMiradaPesca.origen,
    ajusteMiradaPesca.destino,
    suave,
  );
  if (t >= 1) ajusteMiradaPesca = null;
}

function buscarPuntoPescaEnfrente() {
  if (!camara3D || !jugador) return null;

  const direccion = new THREE.Vector3();
  camara3D.getWorldDirection(direccion);
  direccion.y = 0;
  if (direccion.lengthSq() < 0.0001) return null;
  direccion.normalize();

  const origenX = jugador.posicion.x;
  const origenZ = jugador.posicion.y;
  const paso = 8;
  const distanciaMaxima = TAMAÑO_CELDA * 9;
  for (
    let distancia = TAMAÑO_CELDA * 0.35;
    distancia <= distanciaMaxima;
    distancia += paso
  ) {
    const x = origenX + direccion.x * distancia;
    const z = origenZ + direccion.z * distancia;
    const columna = Math.floor(x / TAMAÑO_CELDA);
    const fila = Math.floor(z / TAMAÑO_CELDA);
    if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO)
      break;
    if (MAPA[fila][columna] === 3) {
      return new THREE.Vector3(
        (columna + 0.5) * TAMAÑO_CELDA,
        0.08,
        (fila + 0.5) * TAMAÑO_CELDA,
      );
    }
  }
  return null;
}

function calcularPuntaCañaMundo() {
  // El origen local (0, 0, 0) de la malla del anzuelo de la caña (`fishing_rod_hook`)
  // está exactamente en la punta superior de la caña.
  if (mallaHookActiva && cañaPesca) {
    cañaPesca.updateMatrixWorld(true);
    return mallaHookActiva.localToWorld(new THREE.Vector3(0, 0, 0));
  }
  if (puntaCañaLocalLista && cañaPesca) {
    cañaPesca.updateMatrixWorld(true);
    return cañaPesca.localToWorld(puntaCañaLocal.clone());
  }
  const puntaLocal = new THREE.Vector3(3.0, -3.0, -1.4).add(puntaCaña);
  return puntaLocal.applyQuaternion(camara3D.quaternion).add(camara3D.position);
}

function actualizarPosicionAnzueloEnArco(progreso) {
  // Interpola siempre desde la punta ACTUAL de la caña para que el anzuelo
  // salga de la punta y vuelva a la punta aunque el jugador o la caña se muevan.
  inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
  posicionAnzueloMundo
    .copy(inicioLanzamientoMundo)
    .lerp(destinoPescaMundo, progreso);
  const distancia = inicioLanzamientoMundo.distanceTo(destinoPescaMundo);
  const alturaArco = Math.min(18, Math.max(7, distancia * 0.08));
  posicionAnzueloMundo.y += Math.sin(progreso * Math.PI) * alturaArco;
}

function iniciarRecogidaAnzuelo() {
  if (!anzueloLanzado || sistemaCaptura.estado !== "inactivo") return;
  estadoLanzamiento = "retrayendo";
  progresoLanzamiento = 1;
  tiempoEnAgua = 0;
}

function retraerAnzuelo() {
  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  if (flotadorPesca) flotadorPesca.visible = false;
  sistemaCaptura.cancelar();
  actualizarCañaPesca();
}

function actualizarLanzamientoAnzuelo() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  if (estadoLanzamiento === "lanzando") {
    // Fase 1: preparación. La caña se echa hacia atrás y el anzuelo cuelga de la punta.
    if (preparacionLanzamiento < TIEMPO_PREPARACION_LANZAMIENTO) {
      preparacionLanzamiento += dt;
      inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
      posicionAnzueloMundo.copy(inicioLanzamientoMundo);
      return;
    }
    // Fase 2: latigazo. El anzuelo sale disparado desde la punta de la caña en arco.
    progresoLanzamiento = Math.min(1, progresoLanzamiento + dt * 1.05);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento >= 1) {
      if (lanzamientoCaeEnAgua) {
        estadoLanzamiento = "en_agua";
        window.AudioJuego?.efecto("agua");
        posicionAnzueloMundo.copy(destinoPescaMundo);
        faseSalpicadura = 1;
        esperaMordida = random(2, 6) * efectosLance.espera;
      } else {
        mostrarMensaje("Ahí no hay agua. Apuntá hacia el lago para pescar.");
        estadoLanzamiento = "retrayendo";
      }
    }
  } else if (estadoLanzamiento === "retrayendo") {
    // El anzuelo vuelve a la punta de la caña (que se mueve), no a donde estaba al lanzar
    inicioLanzamientoMundo.copy(calcularPuntaCañaMundo());
    progresoLanzamiento = Math.max(0, progresoLanzamiento - dt * 1.8);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento === 0) retraerAnzuelo();
  } else if (estadoLanzamiento === "en_agua") {
    tiempoEnAgua += dt;
    if (tiempoEnAgua >= esperaMordida) {
      estadoLanzamiento = "esperando";
      sistemaCaptura.iniciar(elegirPezAleatorio());
    }
  }
}

// ===== CAÑA EN MANO =====
// Modelos disponibles. Se cargan una sola vez y se reutilizan al cambiar de caña.
const MODELOS_CAÑA = {
  basica: { ruta: "models/fishing_rod/scene.gltf", ocultar: [] },
  bambu: { ruta: "models/bamboo_fishing_rod/scene.gltf", ocultar: ["robe"] },
  metal: {
    ruta: "models/bamboo_fishing_rod/scene.gltf",
    ocultar: ["robe"],
    metal: true,
  },
};
const cacheModelosCaña = {};
let cañaVisualActual = null;
// Malla del anzuelo+tanza propia de la caña (`fishing_rod_hook_0`).
// Cuando no se pesca queda recogida colgando de la punta; cuando se lanza se estira hacia el agua.
let mallaHookActiva = null;
const puntaCañaLocal = new THREE.Vector3(-1.01, 3.3, -4.35);
let puntaCañaLocalLista = true;

function _prepararMallaHook(malla) {
  malla.geometry = malla.geometry.clone();
  const attr = malla.geometry.attributes.position;
  malla.userData.posicionesBase = new Float32Array(attr.array);
  malla.frustumCulled = false;
  malla.renderOrder = 20;
  if (malla.material) {
    malla.material = malla.material.clone();
    malla.material.side = THREE.DoubleSide;
    malla.material.depthTest = false;
    malla.material.needsUpdate = true;
  }
}

// Carga (o reutiliza) el modelo de una caña y prepara su anzuelo integrado.
function obtenerModeloCaña(tipo, alTerminar) {
  const config = MODELOS_CAÑA[tipo];
  if (!config) return;
  if (cacheModelosCaña[tipo]) {
    alTerminar(cacheModelosCaña[tipo]);
    return;
  }

  // Para la caña de bambú nos aseguramos de tener cargada la básica primero,
  // así reutilizamos el mismo anzuelo colgante en la punta.
  if (tipo !== "basica" && !cacheModelosCaña.basica) {
    obtenerModeloCaña("basica", () => obtenerModeloCaña("bambu", alTerminar));
    return;
  }

  new THREE.GLTFLoader().load(
    config.ruta,
    (resultado) => {
      const modelo = resultado.scene;
      let mallaHook = null;

      modelo.traverse((objeto) => {
        const nombre = (objeto.name || "").toLowerCase();
        if (config.ocultar.some((n) => nombre.includes(n))) {
          objeto.visible = false;
          return;
        }
        if (!objeto.isMesh) return;
        if (nombre.includes("hook")) {
          mallaHook = objeto;
        }
        if (objeto.material) {
          if (config.metal) {
            objeto.material = objeto.material.clone();
            objeto.material.map = null;
            objeto.material.color.setHex(0xb9c7d5);
            objeto.material.metalness = 0.8;
            objeto.material.roughness = 0.3;
          }
          objeto.material.side = THREE.DoubleSide;
          objeto.material.depthTest = false;
          objeto.material.needsUpdate = true;
        }
      });

      const contenedor = new THREE.Group();

      if (tipo === "basica") {
        const caja = new THREE.Box3().setFromObject(modelo);
        const tamaño = caja.getSize(new THREE.Vector3());
        const escala = 3.5 / Math.max(tamaño.x, tamaño.y, tamaño.z);

        modelo.scale.setScalar(escala);
        modelo.position.set(6, -0.8, 6);
        modelo.rotation.set(0.4, 0.2, 0.5);
        modelo.renderOrder = 20;
        contenedor.add(modelo);
        contenedor.updateMatrixWorld(true);

        let matrizHookEnCaña = null;
        if (mallaHook) {
          _prepararMallaHook(mallaHook);
          matrizHookEnCaña = mallaHook.matrixWorld.clone();
        }
        const punta = mallaHook
          ? new THREE.Vector3(0, 0, 0).applyMatrix4(matrizHookEnCaña)
          : new THREE.Vector3(-1.01, 3.3, -4.35);

        cacheModelosCaña.basica = {
          modelo: contenedor,
          mallaHook,
          matrizHookEnCaña,
          punta,
        };
        alTerminar(cacheModelosCaña.basica);
      } else {
        // Alineamos la caña de bambú en la misma posición de mano y punta que la básica
        modelo.scale.setScalar(0.805);
        modelo.position.set(-0.008, 1.276, -5.166);
        modelo.rotation.set(1.1765, 0.5389, 0);
        modelo.renderOrder = 20;
        contenedor.add(modelo);

        const basica = cacheModelosCaña.basica;
        if (basica && basica.mallaHook && basica.matrizHookEnCaña) {
          mallaHook = new THREE.Mesh(
            basica.mallaHook.geometry,
            basica.mallaHook.material,
          );
          _prepararMallaHook(mallaHook);
          basica.matrizHookEnCaña.decompose(
            mallaHook.position,
            mallaHook.quaternion,
            mallaHook.scale,
          );
          contenedor.add(mallaHook);
        }

        const punta = basica
          ? basica.punta.clone()
          : new THREE.Vector3(-1.01, 3.3, -4.35);

        cacheModelosCaña[tipo] = {
          modelo: contenedor,
          mallaHook,
          punta,
        };
        alTerminar(cacheModelosCaña[tipo]);
      }
    },
    undefined,
    (error) => console.error("No se pudo cargar la caña " + tipo + ":", error),
  );
}

// Restaura o estira el anzuelo propio de la caña (`fishing_rod_hook_0`).
// Cuando `estirado` es false, los vértices vuelven a su posición original (recogido en la caña).
// Cuando `estirado` es true, la tanza sale de la punta (0,0,0) y el anzuelo viaja hasta `finalMundo`.
function actualizarGeometriaHookCaña(estirado, inicioMundo, finalMundo) {
  if (!mallaHookActiva || !mallaHookActiva.geometry) return;
  const attr = mallaHookActiva.geometry.attributes.position;
  const base = mallaHookActiva.userData.posicionesBase;
  if (!attr || !base) return;
  const arr = attr.array;

  if (!estirado) {
    arr.set(base);
    attr.needsUpdate = true;
    return;
  }

  mallaHookActiva.updateMatrixWorld(true);
  const distancia = inicioMundo.distanceTo(finalMundo);
  const sagMax = Math.min(3.2, distancia * 0.008);
  // Escala progresiva con la distancia para que el anzuelo de la caña se siga viendo en el agua
  const escalaHook = Math.max(1, Math.min(11, distancia / 16));
  const puntoTemp = new THREE.Vector3();

  const puntoEnCurvaLocal = (tramo) => {
    puntoTemp.copy(inicioMundo).lerp(finalMundo, tramo);
    puntoTemp.y -= Math.sin(tramo * Math.PI) * sagMax;
    return mallaHookActiva.worldToLocal(puntoTemp);
  };

  const p0 = puntoEnCurvaLocal(0).clone();
  const p1 = puntoEnCurvaLocal(1 / 3).clone();
  const p2 = puntoEnCurvaLocal(2 / 3).clone();
  const p3 = puntoEnCurvaLocal(1).clone();

  const totalVertices = attr.count;
  for (let i = 0; i < totalVertices; i++) {
    const idx = i * 3;
    const x0 = base[idx];
    const y0 = base[idx + 1];
    const z0 = base[idx + 2];

    if (z0 > -1.6) {
      // Vértices de la tanza (anillos en z ≈ 0, -0.56, -1.12)
      let pCentro = p0;
      if (z0 < -0.84) pCentro = p2;
      else if (z0 < -0.28) pCentro = p1;
      arr[idx] = pCentro.x + x0;
      arr[idx + 1] = pCentro.y + y0;
      arr[idx + 2] = pCentro.z;
    } else {
      // Vértices del anzuelo en el extremo de la tanza (z0 <= -1.60, unidos en z = -1.68)
      arr[idx] = p3.x + x0 * escalaHook;
      arr[idx + 1] = p3.y + y0 * escalaHook;
      arr[idx + 2] = p3.z + (z0 + 1.68) * escalaHook;
    }
  }
  attr.needsUpdate = true;
}

// Cambia la caña que se sostiene (reemplaza la anterior).
function equiparCaña(tipo) {
  if (!cañaPesca) return;
  obtenerModeloCaña(tipo, (info) => {
    // Si mientras cargaba se eligió otra caña, no pisar la elección más reciente
    const deseada =
      typeof cañaEquipada !== "undefined" ? cañaEquipada : "basica";
    if (deseada !== tipo) return;
    while (cañaPesca.children.length > 0) {
      cañaPesca.remove(cañaPesca.children[0]);
    }
    cañaPesca.add(info.modelo);
    mallaHookActiva = info.mallaHook || null;
    puntaCañaLocal.copy(info.punta);
    puntaCañaLocalLista = true;
    cañaVisualActual = tipo;
  });
}

// Compatibilidad: equipa la caña de bambú
function equiparCañaBambu() {
  equiparCaña("bambu");
}

function cargarCañaPesca() {
  cañaPesca = new THREE.Group();
  cañaPesca.visible =
    typeof bienvenidaActiva === "function" ? !bienvenidaActiva() : true;
  escena3D.add(cañaPesca);

  // Este grupo vive en el mundo, no en la cámara: así el flotador no gira con la mirada.
  grupoAnzuelo = new THREE.Group();
  escena3D.add(grupoAnzuelo);

  // Caña que se sostiene (básica o de bambú, según la guardada/equipada)
  equiparCaña(typeof cañaEquipada !== "undefined" ? cañaEquipada : "basica");

  const puntosLinea = Array.from({ length: 17 }, () => new THREE.Vector3());
  const geometriaLinea = new THREE.BufferGeometry().setFromPoints(puntosLinea);
  lineaPesca = new THREE.Line(
    geometriaLinea,
    new THREE.LineBasicMaterial({
      color: 0x1b1f26,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    }),
  );
  lineaPesca.renderOrder = 19;
  lineaPesca.frustumCulled = false;
  lineaPesca.visible = false;
  grupoAnzuelo.add(lineaPesca);

  anzueloPesca = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI * 1.55),
    new THREE.MeshStandardMaterial({
      color: 0xe7d9b0,
      metalness: 0.58,
      roughness: 0.36,
    }),
  );
  anzueloPesca.rotation.set(0.5, 0, 0);
  anzueloPesca.visible = false;
  grupoAnzuelo.add(anzueloPesca);

  crearFlotadorPesca();
}

function crearFlotadorPesca() {
  flotadorPesca = new THREE.Group();
  flotadorPesca.visible = false;

  ondasFlotador = [];
  for (let indice = 0; indice < 2; indice++) {
    const onda = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.86, 12),
      new THREE.MeshBasicMaterial({
        color: 0xbdefff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    onda.rotation.x = -Math.PI / 2;
    onda.position.y = 0.035 + indice * 0.006;
    flotadorPesca.add(onda);
    ondasFlotador.push(onda);
  }

  escena3D.add(flotadorPesca);
}

function actualizarFlotadorPesca(dt) {
  if (!flotadorPesca) return;
  faseSalpicadura = Math.max(0, faseSalpicadura - dt * 1.7);

  if (!anzueloLanzado || estadoLanzamiento === "lanzando") {
    flotadorPesca.visible = false;
    return;
  }

  flotadorPesca.visible = true;
  const fase = frameCount * 0.085;
  let tiron = 0;
  if (sistemaCaptura.estado === "tiron_suave") {
    tiron = -0.18 * Math.abs(Math.sin(fase * 2));
  } else if (sistemaCaptura.estado === "doble_tiron") {
    tiron = -0.36 * Math.abs(Math.sin(fase * 3));
  } else if (sistemaCaptura.estado === "tiron_fuerte") {
    tiron = -0.62 - 0.12 * Math.abs(Math.sin(fase * 4));
  }

  if (estadoLanzamiento === "retrayendo") {
    flotadorPesca.position.copy(posicionAnzueloMundo);
  } else {
    flotadorPesca.position.set(
      destinoPescaMundo.x,
      0.08 + Math.sin(fase) * 0.075 + tiron,
      destinoPescaMundo.z,
    );
    flotadorPesca.rotation.z = Math.sin(fase * 0.6) * 0.035;
  }

  ondasFlotador.forEach((onda, indice) => {
    const ciclo = (frameCount * 0.018 + indice * 0.48) % 1;
    const escala = 0.55 + ciclo * 1.15 + faseSalpicadura * 0.9;
    onda.scale.setScalar(escala);
    onda.material.opacity = Math.min(
      0.34,
      (1 - ciclo) * 0.15 + faseSalpicadura * 0.32,
    );
  });
}

// Animación de la caña al lanzar: 1) se echa hacia atrás (preparación),
// 2) latigazo hacia adelante cuando sale el anzuelo, 3) vuelve a su posición.
// Devuelve las rotaciones extra (x, z) en radianes que se suman a la pose base.
function calcularAnimacionCaña() {
  const suavizar = (t) => t * t * (3 - 2 * t);
  const ATRAS = 0.62; // rotateX positivo = punta hacia el jugador
  const ADELANTE = -0.5; // rotateX negativo = punta hacia el agua

  if (estadoLanzamiento === "lanzando") {
    if (preparacionLanzamiento < TIEMPO_PREPARACION_LANZAMIENTO) {
      const t = suavizar(
        preparacionLanzamiento / TIEMPO_PREPARACION_LANZAMIENTO,
      );
      return { x: ATRAS * t, z: 0.1 * t };
    }
    const p = progresoLanzamiento;
    if (p < 0.2) {
      // Latigazo rápido de atrás hacia adelante
      const t = suavizar(p / 0.2);
      return { x: lerp(ATRAS, ADELANTE, t), z: lerp(0.1, -0.12, t) };
    }
    // Recuperación suave hasta la pose base
    const t = suavizar((p - 0.2) / 0.8);
    return { x: lerp(ADELANTE, 0, t), z: lerp(-0.12, 0, t) };
  }
  if (estadoLanzamiento === "retrayendo") {
    return { x: Math.sin(progresoLanzamiento * Math.PI) * 0.22, z: 0 };
  }
  return { x: 0, z: 0 };
}

function actualizarCañaPesca() {
  if (!cañaPesca || !lineaPesca || !anzueloPesca) return;

  camara3D.updateMatrixWorld(true);
  const desplazamiento = new THREE.Vector3(3.0, -3.0, -1.4);
  desplazamiento.applyQuaternion(camara3D.quaternion);
  cañaPesca.position.copy(camara3D.position).add(desplazamiento);
  cañaPesca.quaternion.copy(camara3D.quaternion);

  const animacionCaña = calcularAnimacionCaña();
  const animacionTiron =
    sistemaCaptura.estado === "tiron_fuerte"
      ? Math.sin(frameCount * 0.65) * 0.12
      : 0;
  cañaPesca.rotateX(0.12 + animacionCaña.x + animacionTiron);
  cañaPesca.rotateZ(-0.18 + animacionCaña.z);

  // Mientras no se está pescando (o durante la preparación hacia atrás),
  // el anzuelo queda recogido en la propia caña colgando de la punta.
  // Al lanzar, ese mismo anzuelo y la línea se estiran desde la punta hacia el agua.
  const enPreparacion =
    estadoLanzamiento === "lanzando" &&
    preparacionLanzamiento < TIEMPO_PREPARACION_LANZAMIENTO;
  const estirado = anzueloLanzado && !enPreparacion;

  anzueloPesca.visible = false;
  if (!estirado) {
    lineaPesca.visible = false;
    actualizarGeometriaHookCaña(false);
    return;
  }

  const inicio = calcularPuntaCañaMundo();
  const final = new THREE.Vector3();
  if (estadoLanzamiento === "lanzando" || estadoLanzamiento === "retrayendo") {
    final.copy(posicionAnzueloMundo);
  } else {
    final.set(
      destinoPescaMundo.x,
      flotadorPesca.position.y + 0.12,
      destinoPescaMundo.z,
    );
  }

  actualizarGeometriaHookCaña(true, inicio, final);

  lineaPesca.visible = true;
  const posiciones = lineaPesca.geometry.attributes.position.array;
  const cantidadPuntos = posiciones.length / 3;
  const distancia = inicio.distanceTo(final);
  for (let indice = 0; indice < cantidadPuntos; indice++) {
    const tramo = indice / (cantidadPuntos - 1);
    const punto = inicio.clone().lerp(final, tramo);
    const sag = Math.sin(tramo * Math.PI) * Math.min(3.2, distancia * 0.008);
    punto.y -= sag;
    posiciones[indice * 3] = punto.x;
    posiciones[indice * 3 + 1] = punto.y;
    posiciones[indice * 3 + 2] = punto.z;
  }
  lineaPesca.geometry.attributes.position.needsUpdate = true;
  lineaPesca.geometry.computeBoundingSphere();
}
