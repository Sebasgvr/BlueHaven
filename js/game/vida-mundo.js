// Subsistema de vida en el mundo 3D: peces en el agua, pájaros y gaviotas en
// el cielo, nubes a la deriva, destellos de sol y Kiwifina viva.
(() => {
  // ===== PECES NADANDO EN EL LAGO =====
  let grupoPeces = null;
  const peces = [];
  const CANTIDAD_PECES = 10;

  // Textura procedural de silueta de pez estilo Animal Crossing
  function crearTexturaSiluetaPez() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 32;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "rgba(14, 45, 62, 0.75)";

    // Cuerpo ahusado
    ctx.beginPath();
    ctx.ellipse(26, 16, 18, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aleta caudal (cola)
    ctx.beginPath();
    ctx.moveTo(42, 16);
    ctx.lineTo(58, 8);
    ctx.quadraticCurveTo(52, 16, 58, 24);
    ctx.closePath();
    ctx.fill();

    // Aletas pectorales
    ctx.beginPath();
    ctx.ellipse(22, 16, 6, 11, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function celdaEsAgua(x, z) {
    if (typeof esAgua !== "function") return true;
    const cx = Math.floor(x / TAMAÑO_CELDA);
    const cz = Math.floor(z / TAMAÑO_CELDA);
    return esAgua(cx, cz);
  }

  function crearPecesAgua(escena) {
    grupoPeces = new THREE.Group();
    const tex = crearTexturaSiluetaPez();

    const geoBase = new THREE.PlaneGeometry(16, 8);
    // Orientado paralelo al agua
    geoBase.rotateX(-Math.PI / 2);

    const matBase = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Buscar celdas de agua válidas para colocar los peces
    const celdasAgua = [];
    if (typeof MAPA !== "undefined" && typeof MAPA_ALTO !== "undefined") {
      for (let f = 0; f < MAPA_ALTO; f++) {
        for (let c = 0; c < MAPA_ANCHO; c++) {
          if (MAPA[f][c] === 3) {
            celdasAgua.push({
              x: (c + 0.5) * TAMAÑO_CELDA,
              z: (f + 0.5) * TAMAÑO_CELDA,
            });
          }
        }
      }
    }

    if (!celdasAgua.length) return;

    for (let i = 0; i < CANTIDAD_PECES; i++) {
      const celda = celdasAgua[Math.floor(Math.random() * celdasAgua.length)];
      const malla = new THREE.Mesh(geoBase, matBase.clone());

      // Variación sutil de tamaño por especie/ejemplar
      const escala = 0.85 + Math.random() * 0.55;
      malla.scale.set(escala, 1, escala);

      // Posicionado apenas por encima del plano de agua para visibilidad perfecta
      const yAgua = typeof AGUA_NIVEL_Y !== "undefined" ? AGUA_NIVEL_Y : -0.05;
      malla.position.set(
        celda.x + (Math.random() - 0.5) * TAMAÑO_CELDA * 0.6,
        yAgua + 0.08,
        celda.z + (Math.random() - 0.5) * TAMAÑO_CELDA * 0.6,
      );

      const angulo = Math.random() * Math.PI * 2;
      // La silueta mira hacia -x local: con esta rotación apunta justo en la
      // dirección de avance (antes nadaban de costado).
      malla.rotation.y = Math.PI - angulo;

      peces.push({
        malla,
        angulo,
        velocidad: 18 + Math.random() * 16,
        tiempoGiro: 2 + Math.random() * 4,
        aleteo: Math.random() * Math.PI * 2,
        escalaBase: escala,
      });

      grupoPeces.add(malla);
    }

    escena.add(grupoPeces);
  }

  function actualizarPeces(dt) {
    if (!peces.length) return;

    // De vez en cuando algún pez rompe la superficie con un salto.
    decidirSaltoPez(dt);

    // Verificar si el flotador de pesca está en el agua
    let posFlotador = null;
    if (
      typeof flotadorPesca !== "undefined" &&
      flotadorPesca &&
      flotadorPesca.visible
    ) {
      posFlotador = flotadorPesca.position;
    }

    for (const p of peces) {
      // Mientras salta no nada: sale en arco y vuelve a caer al agua.
      if (p.salto) {
        actualizarSaltoPez(p, dt);
        continue;
      }
      p.aleteo += p.velocidad * dt * 0.35;
      p.tiempoGiro -= dt;

      // Si hay un flotador cerca, el pez más cercano se siente atraído
      if (posFlotador) {
        const distFlotador = Math.hypot(
          posFlotador.x - p.malla.position.x,
          posFlotador.z - p.malla.position.z,
        );
        if (distFlotador < TAMAÑO_CELDA * 2.2 && distFlotador > 10) {
          const angHaciaFlotador = Math.atan2(
            posFlotador.z - p.malla.position.z,
            posFlotador.x - p.malla.position.x,
          );
          // Giro suave hacia el cebo
          let difAng = angHaciaFlotador - p.angulo;
          while (difAng > Math.PI) difAng -= Math.PI * 2;
          while (difAng < -Math.PI) difAng += Math.PI * 2;
          p.angulo += difAng * Math.min(1, dt * 2.5);
        }
      } else if (p.tiempoGiro <= 0) {
        // Giro aleatorio natural cada pocos segundos
        p.angulo += (Math.random() - 0.5) * 1.4;
        p.tiempoGiro = 2.5 + Math.random() * 4.5;
      }

      // Predecir avance para no salirse del agua
      const avanceX = Math.cos(p.angulo) * p.velocidad * dt;
      const avanceZ = Math.sin(p.angulo) * p.velocidad * dt;
      const futuroX = p.malla.position.x + avanceX * 6;
      const futuroZ = p.malla.position.z + avanceZ * 6;

      if (!celdaEsAgua(futuroX, futuroZ)) {
        // Si hay orilla o tierra adelante, dar media vuelta suave
        p.angulo += Math.PI * 0.75 + Math.random() * 0.5;
        p.tiempoGiro = 2.0;
      } else {
        p.malla.position.x += avanceX;
        p.malla.position.z += avanceZ;
      }

      // Animación de nado: suave bamboleo de aleta
      const bamboleo = Math.sin(p.aleteo) * 0.12;
      p.malla.rotation.y = Math.PI - p.angulo + bamboleo;
    }
  }

  // ===== PÁJAROS VOLANDO EN EL CIELO =====
  let grupoPajaros = null;
  const pajaros = [];
  const CANTIDAD_PAJAROS = 4;

  function crearGeometriaPajaro() {
    // Pajaro estilizado con alas articuladas mediante vértices en V
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Ala izquierda
      -10, 0, -4, 0, 0, 0, 0, 0, 8,

      // Ala derecha
      0, 0, 0, 10, 0, -4, 0, 0, 8,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }

  function crearPajarosCielo(escena) {
    grupoPajaros = new THREE.Group();
    const geo = crearGeometriaPajaro();
    const mat = new THREE.MeshBasicMaterial({
      color: 0x223545,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const centroLagoX = TAMAÑO_CELDA * 18;
    const centroLagoZ = TAMAÑO_CELDA * 14;

    for (let i = 0; i < CANTIDAD_PAJAROS; i++) {
      const malla = new THREE.Mesh(geo, mat);
      const radioOrbita = 220 + i * 55;
      const altura = 200 + i * 18;
      const velocidadAngular = 0.18 + Math.random() * 0.08;
      const fase = (i / CANTIDAD_PAJAROS) * Math.PI * 2;

      pajaros.push({
        malla,
        centroX: centroLagoX,
        centroZ: centroLagoZ,
        radio: radioOrbita,
        altura,
        angulo: fase,
        velocidad: velocidadAngular,
        faseAleteo: Math.random() * Math.PI * 2,
      });

      grupoPajaros.add(malla);
    }

    escena.add(grupoPajaros);
  }

  function actualizarPajaros(dt) {
    for (const p of pajaros) {
      p.angulo += p.velocidad * dt;
      p.faseAleteo += dt * 9;

      const x = p.centroX + Math.cos(p.angulo) * p.radio;
      const z = p.centroZ + Math.sin(p.angulo) * p.radio;

      p.malla.position.set(x, p.altura, z);

      // Orientar en la dirección tangente del vuelo
      const rumbo = p.angulo + Math.PI / 2;
      p.malla.rotation.y = -rumbo;

      // Inclinación bancada en curva y aleteo vertical
      const aleteo = Math.sin(p.faseAleteo);
      p.malla.rotation.z = 0.15 + aleteo * 0.08;
      p.malla.scale.y = 1 + aleteo * 0.35;
    }
  }

  // ===== GAVIOTAS CRUZANDO EL CIELO EN V =====
  let grupoGaviotas = null;
  const gaviotas = [];
  const CANTIDAD_GAVIOTAS = 6;
  const bandaGaviotas = {
    x: 0,
    z: 0,
    angulo: 0,
    velocidad: 70,
    altura: 300,
    tiempo: 0,
  };

  function crearGeometriaGaviota() {
    const geo = new THREE.BufferGeometry();
    // Diedro suave: las puntas del ala quedan 4 unidades por encima de las
    // raíces, así la silueta nunca se ve de canto (y se lee bien desde abajo).
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          -16,
          4,
          2, // 0: punta del ala izquierda
          -3,
          0,
          -3, // 1: raíz izquierda delantera
          -3,
          0,
          4, // 2: raíz izquierda trasera
          16,
          4,
          2, // 3: punta del ala derecha
          3,
          0,
          -3, // 4: raíz derecha delantera
          3,
          0,
          4, // 5: raíz derecha trasera
          0,
          0,
          -5, // 6: pico
          -2,
          0,
          3, // 7: cuerpo izquierdo
          2,
          0,
          3, // 8: cuerpo derecho
        ]),
        3,
      ),
    );
    // Puntas de ala oscuras: la firma visual de la gaviota.
    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(
        new Float32Array([
          0.15, 0.18, 0.24, 1, 1, 1, 1, 1, 1, 0.15, 0.18, 0.24, 1, 1, 1, 1, 1,
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ]),
        3,
      ),
    );
    geo.setIndex([0, 1, 2, 3, 5, 4, 6, 7, 8]);
    return geo;
  }

  function reposicionarBandaGaviotas() {
    const margen = 600;
    const ancho = MAPA_ANCHO * TAMAÑO_CELDA;
    const alto = MAPA_ALTO * TAMAÑO_CELDA;
    const lado = Math.floor(Math.random() * 4);
    let x, z;
    if (lado === 0) {
      x = -margen;
      z = Math.random() * alto;
    } else if (lado === 1) {
      x = ancho + margen;
      z = Math.random() * alto;
    } else if (lado === 2) {
      x = Math.random() * ancho;
      z = -margen;
    } else {
      x = Math.random() * ancho;
      z = alto + margen;
    }
    // Rumbo hacia el centro con sesgo: siempre cruzan de lado a lado.
    const sesgoX = (Math.random() - 0.5) * ancho * 0.7;
    const sesgoZ = (Math.random() - 0.5) * alto * 0.7;
    bandaGaviotas.x = x;
    bandaGaviotas.z = z;
    bandaGaviotas.angulo = Math.atan2(
      alto / 2 + sesgoZ - z,
      ancho / 2 + sesgoX - x,
    );
    bandaGaviotas.velocidad = 55 + Math.random() * 40;
    bandaGaviotas.altura = 250 + Math.random() * 110;
    bandaGaviotas.tiempo = 0;
  }

  function crearBandaGaviotas(escena) {
    grupoGaviotas = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    reposicionarBandaGaviotas();
    for (let i = 0; i < CANTIDAD_GAVIOTAS; i++) {
      const geo = crearGeometriaGaviota();
      const malla = new THREE.Mesh(geo, material);
      gaviotas.push({
        malla,
        geo,
        rango: i, // 0 = líder de la formación
        lado: i % 2 ? 1 : -1,
        fase: Math.random() * Math.PI * 2,
        amp: 5.5,
        planeando: false,
        tiempoPlaneo: 1 + Math.random() * 2,
        bob: Math.random() * Math.PI * 2,
      });
      grupoGaviotas.add(malla);
    }
    escena.add(grupoGaviotas);
  }

  function actualizarGaviotas(dt) {
    if (!gaviotas.length) return;
    bandaGaviotas.tiempo += dt;
    bandaGaviotas.x +=
      Math.cos(bandaGaviotas.angulo) * bandaGaviotas.velocidad * dt;
    bandaGaviotas.z +=
      Math.sin(bandaGaviotas.angulo) * bandaGaviotas.velocidad * dt;

    const ancho = MAPA_ANCHO * TAMAÑO_CELDA;
    const alto = MAPA_ALTO * TAMAÑO_CELDA;
    if (
      bandaGaviotas.x < -900 ||
      bandaGaviotas.x > ancho + 900 ||
      bandaGaviotas.z < -900 ||
      bandaGaviotas.z > alto + 900
    ) {
      reposicionarBandaGaviotas();
    }

    const dirX = Math.cos(bandaGaviotas.angulo);
    const dirZ = Math.sin(bandaGaviotas.angulo);
    const perpX = -dirZ;
    const perpZ = dirX;
    const alturaBase =
      bandaGaviotas.altura + Math.sin(bandaGaviotas.tiempo * 0.6) * 9;

    for (const g of gaviotas) {
      // El líder va en punta; los demás se acomodan en la V hacia atrás.
      const atras = g.rango * 26;
      const lateral = g.rango * (g.lado * 15);
      g.malla.position.set(
        bandaGaviotas.x - dirX * atras + perpX * lateral,
        alturaBase +
          Math.sin(bandaGaviotas.tiempo * 1.1 + g.bob) * 5 +
          g.rango * 3,
        bandaGaviotas.z - dirZ * atras + perpZ * lateral,
      );
      // El frente del modelo apunta hacia -z: así viajan de cara al rumbo.
      g.malla.rotation.y = -bandaGaviotas.angulo - Math.PI / 2;

      // Aleteo alternando con planeos largos, como las gaviotas reales.
      g.tiempoPlaneo -= dt;
      if (g.tiempoPlaneo <= 0) {
        g.planeando = !g.planeando;
        g.tiempoPlaneo = g.planeando
          ? 1.2 + Math.random() * 1.6
          : 2 + Math.random() * 2.4;
      }
      const amplitudObjetivo = g.planeando ? 1.2 : 5.5;
      g.amp += (amplitudObjetivo - g.amp) * Math.min(1, dt * 5);
      g.fase += dt * (g.planeando ? 3 : 11);
      const impulso = Math.sin(g.fase) * g.amp + (g.planeando ? 2.5 : 0);
      const pos = g.geo.attributes.position;
      // Se conserva el diedro base (y = 4) y se le suma el aleteo.
      pos.array[1] = 4 + impulso; // punta izquierda (vértice 0, componente y)
      pos.array[10] = 4 + impulso; // punta derecha (vértice 3, componente y)
      pos.needsUpdate = true;
    }
  }

  // ===== NUBES PIXEL-ART A LA DERIVA =====
  let grupoNubes = null;
  const nubes = [];

  // Nube dibujada en bloques de 4 px: silueta de varios bultos con base plana.
  function crearTexturaNube(indice) {
    const CELDA = 4;
    const GRILLA_ANCHO = 32;
    const GRILLA_ALTO = 16;
    const BASE = 13;
    const canvas = document.createElement("canvas");
    canvas.width = GRILLA_ANCHO * CELDA;
    canvas.height = GRILLA_ALTO * CELDA;
    const ctx = canvas.getContext("2d");
    const azar = crearAleatorioConSemilla(20261130 + indice * 137);

    // Tres a cinco bultos superpuestos forman la silueta.
    const bultos = [];
    const cantidad = 3 + Math.floor(azar() * 3);
    for (let i = 0; i < cantidad; i++) {
      const t = cantidad === 1 ? 0.5 : i / (cantidad - 1);
      bultos.push({
        x: 5 + t * 22 + (azar() - 0.5) * 3,
        y:
          9.5 -
          Math.sin(t * Math.PI) * (2.5 + azar() * 3) +
          (azar() - 0.5) * 1.5,
        rx: 3.5 + azar() * 3,
        ry: 2.6 + azar() * 2,
      });
    }

    const relleno = [];
    for (let y = 0; y < GRILLA_ALTO; y++) {
      relleno[y] = [];
      for (let x = 0; x < GRILLA_ANCHO; x++) {
        let dentro = false;
        for (const b of bultos) {
          const dx = (x + 0.5 - b.x) / b.rx;
          const dy = (y + 0.5 - b.y) / b.ry;
          if (dx * dx + dy * dy <= 1) {
            dentro = true;
            break;
          }
        }
        relleno[y][x] = dentro;
      }
    }
    // Cada columna baja hasta la línea base: nube con piso parejo.
    for (let x = 0; x < GRILLA_ANCHO; x++) {
      let arriba = -1;
      for (let y = 0; y < GRILLA_ALTO; y++) {
        if (relleno[y][x]) {
          arriba = y;
          break;
        }
      }
      if (arriba >= 0 && arriba <= BASE)
        for (let y = arriba; y <= BASE; y++) relleno[y][x] = true;
    }

    for (let y = 0; y < GRILLA_ALTO; y++) {
      for (let x = 0; x < GRILLA_ANCHO; x++) {
        if (!relleno[y][x]) continue;
        const abajoLleno = y + 1 < GRILLA_ALTO && relleno[y + 1][x];
        // La fila inferior toma sombra azulada; el resto, blanco.
        ctx.fillStyle = abajoLleno ? "#ffffff" : "#cfe8fa";
        ctx.fillRect(x * CELDA, y * CELDA, CELDA, CELDA);
      }
    }

    const textura = new THREE.CanvasTexture(canvas);
    textura.magFilter = THREE.NearestFilter;
    textura.minFilter = THREE.LinearMipmapLinearFilter;
    return textura;
  }

  function crearNubesCielo(escena) {
    grupoNubes = new THREE.Group();
    const ancho = MAPA_ANCHO * TAMAÑO_CELDA;
    const alto = MAPA_ALTO * TAMAÑO_CELDA;
    const texturas = [0, 1, 2].map(crearTexturaNube);

    let cantidad = 12;
    if (typeof opcionesGraficas !== "undefined") {
      if (opcionesGraficas.calidad === "baja") cantidad = 8;
      else if (opcionesGraficas.calidad === "alta") cantidad = 16;
    }

    for (let i = 0; i < cantidad; i++) {
      const material = new THREE.SpriteMaterial({
        map: texturas[i % texturas.length],
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity: 0.82 + Math.random() * 0.18,
      });
      const nube = new THREE.Sprite(material);
      const anchoNube = 300 + Math.random() * 300;
      nube.scale.set(anchoNube, anchoNube / 2, 1);
      nube.position.set(
        -600 + Math.random() * (ancho + 1200),
        430 + Math.random() * 260,
        -400 + Math.random() * (alto + 800),
      );
      grupoNubes.add(nube);
      nubes.push({
        sprite: nube,
        velocidad: 5 + Math.random() * 9,
        bordeIzquierdo: -600,
        bordeDerecho: ancho + 600,
        opacidad: material.opacity,
      });
    }
    escena.add(grupoNubes);
  }

  function actualizarNubes(dt) {
    for (const n of nubes) {
      n.sprite.position.x += n.velocidad * dt;
      const x = n.sprite.position.x;
      const zonaMuerte = 700;
      // Se desvanecen hacia el borde de la vuelta: nunca aparecen de golpe.
      const izquierda = Math.min(
        1,
        Math.max(0, (x - n.bordeIzquierdo) / zonaMuerte),
      );
      const derecha = Math.min(
        1,
        Math.max(0, (n.bordeDerecho - x) / zonaMuerte),
      );
      n.sprite.material.opacity = n.opacidad * Math.min(izquierda, derecha);
      if (x > n.bordeDerecho) n.sprite.position.x = n.bordeIzquierdo;
    }
  }

  // ===== SALPICADURAS DE AGUA Y PECES SALTANDO =====
  // Gotas en un InstancedMesh (un solo draw call) + anillos que se expanden
  // sobre la superficie. Sirve para el lance, la picada, los saltos de peces
  // y un ripio ambiental constante.
  const MAX_GOTAS = 150;
  const MAX_ANILLOS = 10;
  const GRAVEDAD_GOTA = 62;
  let mallaGotas = null;
  const gotas = [];
  const anillosSalpicadura = [];
  let tiempoProximoSalto = 5;
  let tiempoProximoRipio = 4;

  const _objetoGota = new THREE.Object3D();
  const _qYawSalto = new THREE.Quaternion();
  const _qCabeceoSalto = new THREE.Quaternion();
  const _ejeUpSalto = new THREE.Vector3(0, 1, 0);
  const _ejeLateralSalto = new THREE.Vector3();

  function nivelAgua() {
    return typeof AGUA_NIVEL_Y !== "undefined" ? AGUA_NIVEL_Y : -0.05;
  }

  function crearEfectosAgua(escena) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    mallaGotas = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      material,
      MAX_GOTAS,
    );
    mallaGotas.frustumCulled = false;
    mallaGotas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Gotas: mezcla de espuma blanca y celeste, una por instancia.
    const colorEspuma = new THREE.Color(0xf7feff);
    const colorAgua = new THREE.Color(0x9fe3ff);
    const color = new THREE.Color();
    for (let i = 0; i < MAX_GOTAS; i++) {
      gotas.push({
        activo: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        vida: 0,
        vidaMax: 1,
        tam: 1,
      });
      color.copy(colorEspuma).lerp(colorAgua, Math.random());
      mallaGotas.setColorAt(i, color);
      _objetoGota.position.set(0, -500, 0);
      _objetoGota.scale.setScalar(0);
      _objetoGota.updateMatrix();
      mallaGotas.setMatrixAt(i, _objetoGota.matrix);
    }
    if (mallaGotas.instanceColor) mallaGotas.instanceColor.needsUpdate = true;
    mallaGotas.instanceMatrix.needsUpdate = true;
    escena.add(mallaGotas);

    for (let i = 0; i < MAX_ANILLOS; i++) {
      const anillo = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.85, 14),
        new THREE.MeshBasicMaterial({
          color: 0xd8f6ff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      anillo.rotation.x = -Math.PI / 2;
      anillo.visible = false;
      escena.add(anillo);
      anillosSalpicadura.push({
        malla: anillo,
        activo: false,
        t: 0,
        dur: 1,
        escalaMax: 1,
      });
    }
  }

  // Intensidad 1 = impacto normal del anzuelo; 0.3 = ripio suave.
  function salpicadura(x, z, intensidad = 1) {
    if (!mallaGotas) return;
    const yAgua = nivelAgua();

    const anillo = anillosSalpicadura.find((a) => !a.activo);
    if (anillo) {
      anillo.activo = true;
      anillo.t = 0;
      anillo.dur = 0.5 + Math.random() * 0.3;
      anillo.escalaMax = 2.5 + intensidad * 4.5;
      anillo.malla.position.set(x, yAgua + 0.07, z);
      anillo.malla.scale.setScalar(0.4);
      anillo.malla.visible = true;
    }

    let cantidad = Math.round((6 + Math.random() * 7) * intensidad);
    if (
      typeof opcionesGraficas !== "undefined" &&
      opcionesGraficas.calidad === "baja"
    )
      cantidad = Math.round(cantidad * 0.6);

    let emitidas = 0;
    for (const g of gotas) {
      if (emitidas >= cantidad) break;
      if (g.activo) continue;
      const angulo = Math.random() * Math.PI * 2;
      const fuerza = (2.5 + Math.random() * 6.5) * intensidad;
      g.activo = true;
      g.x = x + Math.cos(angulo) * 0.5 * intensidad;
      g.z = z + Math.sin(angulo) * 0.5 * intensidad;
      g.y = yAgua + 0.35;
      g.vx = Math.cos(angulo) * fuerza;
      g.vz = Math.sin(angulo) * fuerza;
      g.vy = (12 + Math.random() * 10) * (0.75 + intensidad * 0.35);
      g.vida = g.vidaMax = 0.5 + Math.random() * 0.45;
      g.tam = (0.5 + Math.random() * 0.7) * (0.8 + intensidad * 0.35);
      emitidas++;
    }
  }

  function actualizarSalpicaduras(dt) {
    if (!mallaGotas) return;
    const yAgua = nivelAgua();

    for (let i = 0; i < gotas.length; i++) {
      const g = gotas[i];
      if (g.activo) {
        g.vy -= GRAVEDAD_GOTA * dt;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.z += g.vz * dt;
        g.vida -= dt;
        if (g.vida <= 0 || g.y <= yAgua) g.activo = false;
      }
      // Las gotas se encogen al final de su vida: nunca desaparecen de golpe.
      const escala = g.activo
        ? g.tam * Math.min(1, (g.vida / g.vidaMax) * 3)
        : 0;
      _objetoGota.position.set(g.x, g.y, g.z);
      _objetoGota.scale.setScalar(escala);
      _objetoGota.updateMatrix();
      mallaGotas.setMatrixAt(i, _objetoGota.matrix);
    }
    mallaGotas.instanceMatrix.needsUpdate = true;

    for (const a of anillosSalpicadura) {
      if (!a.activo) continue;
      a.t += dt;
      const u = a.t / a.dur;
      if (u >= 1) {
        a.activo = false;
        a.malla.visible = false;
        continue;
      }
      a.malla.scale.setScalar(0.4 + u * a.escalaMax);
      a.malla.material.opacity = (1 - u) * 0.55;
    }
  }

  // Elige un pez cerca de la cámara con agua abierta adelante y lo lanza.
  function decidirSaltoPez(dt) {
    if (typeof camara3D === "undefined" || !camara3D) return;
    tiempoProximoSalto -= dt;
    if (tiempoProximoSalto > 0) return;

    const camX = camara3D.position.x;
    const camZ = camara3D.position.z;
    let mejor = null;
    let mejorDist = Infinity;
    for (const p of peces) {
      if (p.salto) continue;
      const px = p.malla.position.x;
      const pz = p.malla.position.z;
      const dist = Math.hypot(px - camX, pz - camZ);
      if (dist > 450 || dist < 14) continue;
      const futX = px + Math.cos(p.angulo) * TAMAÑO_CELDA * 1.5;
      const futZ = pz + Math.sin(p.angulo) * TAMAÑO_CELDA * 1.5;
      if (!celdaEsAgua(futX, futZ)) continue;
      if (dist < mejorDist) {
        mejorDist = dist;
        mejor = p;
      }
    }
    // Sin candidatos a la vista se reintenta enseguida; con salto, espera
    // una pausa larga: es un detalle de ambiente, no una coreografía.
    if (!mejor) {
      tiempoProximoSalto = 1.5 + Math.random() * 2;
      return;
    }
    tiempoProximoSalto = 4 + Math.random() * 7;
    mejor.salto = {
      t: 0,
      dur: 0.8 + Math.random() * 0.4,
      altura: 9 + Math.random() * 8,
    };
    window.AudioJuego?.efecto("agua_suave");
  }

  function actualizarSaltoPez(p, dt) {
    const s = p.salto;
    s.t += dt;
    const u = Math.min(1, s.t / s.dur);
    const yAgua = nivelAgua();

    p.malla.position.x += Math.cos(p.angulo) * p.velocidad * 1.4 * dt;
    p.malla.position.z += Math.sin(p.angulo) * p.velocidad * 1.4 * dt;
    p.malla.position.y = yAgua + 0.08 + Math.sin(u * Math.PI) * s.altura;

    // Cabeceo: sale erguido hacia arriba y entra de picado al agua.
    const cabeceo = -Math.cos(u * Math.PI) * 0.9;
    const dirX = Math.cos(p.angulo);
    const dirZ = Math.sin(p.angulo);
    _ejeLateralSalto.set(dirZ, 0, -dirX);
    _qYawSalto.setFromAxisAngle(_ejeUpSalto, Math.PI - p.angulo);
    _qCabeceoSalto.setFromAxisAngle(_ejeLateralSalto, cabeceo);
    p.malla.quaternion.copy(_qCabeceoSalto).multiply(_qYawSalto);

    if (u >= 1) {
      p.malla.position.y = yAgua + 0.08;
      p.malla.quaternion.identity();
      p.salto = null;
      salpicadura(p.malla.position.x, p.malla.position.z, 0.8);
      window.AudioJuego?.efecto("agua_suave");
    }
  }

  // Pequeñas ondas al azar: el lago nunca queda absolutamente quieto.
  function actualizarRipiosAmbiente(dt) {
    tiempoProximoRipio -= dt;
    if (tiempoProximoRipio > 0) return;
    tiempoProximoRipio = 4 + Math.random() * 6;
    if (typeof MAPA === "undefined" || typeof MAPA_ANCHO === "undefined")
      return;
    for (let intento = 0; intento < 8; intento++) {
      const fila = Math.floor(Math.random() * MAPA_ALTO);
      const columna = Math.floor(Math.random() * MAPA_ANCHO);
      if (MAPA[fila][columna] !== 3) continue;
      salpicadura(
        (columna + 0.5) * TAMAÑO_CELDA,
        (fila + 0.5) * TAMAÑO_CELDA,
        0.3,
      );
      return;
    }
  }

  // ===== SEGUIMIENTO DE MIRADA Y VIDA DE KIWIFINA EN 3D =====
  function actualizarKiwifinaViva() {
    // Animación de Kiwifina desactivada — permanece estática
  }

  // ===== DESTELLOS DE SOL EN EL AGUA (GLIMMER) =====
  let destellos = null;
  function crearDestellosAgua(escena) {
    const CANTIDAD = 45;
    const posiciones = new Float32Array(CANTIDAD * 3);
    const yAgua = typeof AGUA_NIVEL_Y !== "undefined" ? AGUA_NIVEL_Y : -0.05;

    // Generar destellos aleatorios sobre la zona de agua del lago
    for (let i = 0; i < CANTIDAD; i++) {
      posiciones[i * 3] = TAMAÑO_CELDA * (11 + Math.random() * 15);
      posiciones[i * 3 + 1] = yAgua + 0.12;
      posiciones[i * 3 + 2] = TAMAÑO_CELDA * (7 + Math.random() * 12);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));

    // Canvas texture para el destello brillante
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.35, "rgba(180, 240, 255, 0.75)");
    grad.addColorStop(1, "rgba(100, 200, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const tex = new THREE.CanvasTexture(c);

    const mat = new THREE.PointsMaterial({
      size: 5.5,
      map: tex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    destellos = new THREE.Points(geo, mat);
    escena.add(destellos);
  }

  function actualizarDestellos(dt) {
    if (!destellos) return;
    const tiempo = performance.now() * 0.0025;
    // Titileo suave del sol sobre el agua
    destellos.material.opacity = 0.45 + Math.sin(tiempo) * 0.25;
  }

  // ===== API PRINCIPAL =====
  function inicializarVidaMundo(escena) {
    crearPecesAgua(escena);
    crearPajarosCielo(escena);
    crearBandaGaviotas(escena);
    crearNubesCielo(escena);
    crearDestellosAgua(escena);
    crearEfectosAgua(escena);
  }

  function actualizarVidaMundo(dt) {
    actualizarPeces(dt);
    actualizarPajaros(dt);
    actualizarGaviotas(dt);
    actualizarNubes(dt);
    actualizarKiwifinaViva();
    actualizarDestellos(dt);
    actualizarSalpicaduras(dt);
    actualizarRipiosAmbiente(dt);
  }

  window.inicializarVidaMundo = inicializarVidaMundo;
  window.actualizarVidaMundo = actualizarVidaMundo;
  // Lo usan la caña (al caer el anzuelo) y el sistema de captura (al picar).
  window.SistemaEfectosAgua = { salpicadura };
})();
