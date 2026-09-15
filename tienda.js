const TIENDA = {
  posicion: null,
  escena: null,
  camara: null,
  renderizador: null,
  modelo: null,
  objetoMundo: null,
  canvas: null,
  cargada: false,
  anchoColision: TAMAÑO_CELDA * 1.25,
  profundidadColision: TAMAÑO_CELDA * 1.1,
  altoPantalla: 210,
};

function tiendaInicializar() {
  // Mueve la tienda cambiando estas coordenadas de columna y fila.
  TIENDA.posicion = createVector(TAMAÑO_CELDA * 9, TAMAÑO_CELDA * 10);
  TIENDA.canvas = document.createElement("canvas");
  TIENDA.canvas.width = 320;
  TIENDA.canvas.height = 240;

  TIENDA.escena = new THREE.Scene();
  TIENDA.camara = new THREE.PerspectiveCamera(30, 320 / 240, 0.01, 100);
  TIENDA.camara.position.set(0, 1.4, 5.2);
  TIENDA.camara.lookAt(0, 0.85, 0);

  TIENDA.renderizador = new THREE.WebGLRenderer({
    canvas: TIENDA.canvas,
    alpha: true,
    antialias: true,
  });
  TIENDA.renderizador.setPixelRatio(1);
  TIENDA.renderizador.setSize(320, 240, false);
  TIENDA.renderizador.setClearColor(0x000000, 0);

  TIENDA.escena.add(new THREE.HemisphereLight(0xfff1d6, 0x38484e, 2.4));
  const luz = new THREE.DirectionalLight(0xffe0ad, 3);
  luz.position.set(-3, 5, 4);
  TIENDA.escena.add(luz);

  const cargador = new THREE.OBJLoader();
  cargador.load(
    "models/tienda/source/Tienda_02.obj",
    (modelo) => {
      const textura = new THREE.TextureLoader().load(
        "models/tienda/textures/Tienda_02_initialShadingGroup_BaseColor.10.png",
      );
      textura.colorSpace = THREE.SRGBColorSpace;

      modelo.traverse((objeto) => {
        if (!objeto.isMesh) return;
        objeto.material = new THREE.MeshStandardMaterial({
          map: textura,
          roughness: 0.82,
          metalness: 0,
          side: THREE.DoubleSide,
        });
      });

      const caja = new THREE.Box3().setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = 2.9 / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.position.y = -0.55;
      TIENDA.escena.add(modelo);
      TIENDA.modelo = modelo;
      TIENDA.cargada = true;
    },
    undefined,
    (error) => console.error("No se pudo cargar la tienda:", error),
  );
}

function tiendaColisiona(posicion) {
  if (!TIENDA.posicion) return false;

  const mitadAncho = TIENDA.anchoColision / 2;
  const mitadProfundidad = TIENDA.profundidadColision / 2;

  return (
    Math.abs(posicion.x - TIENDA.posicion.x) <= mitadAncho &&
    Math.abs(posicion.y - TIENDA.posicion.y) <= mitadProfundidad
  );
}

function crearObjetoTienda3D() {
  if (!TIENDA.posicion || !escena3D) return;

  const cargadorOBJ = new THREE.OBJLoader();
  cargadorOBJ.load(
    "models/tienda/source/Tienda_02.obj",
    (modelo) => {
      const textura = new THREE.TextureLoader().load(
        "models/tienda/textures/Tienda_02_initialShadingGroup_BaseColor.10.png",
      );
      textura.colorSpace = THREE.SRGBColorSpace;

      modelo.traverse((objeto) => {
        if (!objeto.isMesh) return;
        objeto.material = new THREE.MeshStandardMaterial({
          map: textura,
          roughness: 0.82,
          metalness: 0,
          side: THREE.DoubleSide,
        });
      });

      const caja = new THREE.Box3().setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = (TAMAÑO_CELDA * 1.8) / Math.max(tamaño.x, tamaño.y, tamaño.z);

      modelo.position.sub(centro);
      modelo.scale.setScalar(escala);
      modelo.rotation.y = Math.PI;
      modelo.position.set(TIENDA.posicion.x, 0, TIENDA.posicion.y);
      escena3D.add(modelo);
      TIENDA.objetoMundo = modelo;
    },
    undefined,
    (error) => console.error("No se pudo cargar la tienda 3D:", error),
  );
}

window.crearObjetoTienda3D = crearObjetoTienda3D;

