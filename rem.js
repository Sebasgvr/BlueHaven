const REM = {
  posicion: null,
  escena: null,
  camara: null,
  renderizador: null,
  modelo: null,
  modeloEnTienda: null,
  canvas: null,
  cargado: false,
};

function remInicializar() {
  REM.posicion = TIENDA.posicion.copy();
  REM.canvas = document.createElement("canvas");
  REM.canvas.width = 256;
  REM.canvas.height = 256;

  REM.escena = new THREE.Scene();
  REM.camara = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  REM.camara.position.set(0, 1.2, 3.4);
  REM.camara.lookAt(0, 0, 0);

  REM.renderizador = new THREE.WebGLRenderer({
    canvas: REM.canvas,
    alpha: true,
    antialias: true,
  });
  REM.renderizador.setPixelRatio(1);
  REM.renderizador.setSize(256, 256, false);
  REM.renderizador.setClearColor(0x000000, 0);

  const luzPrincipal = new THREE.HemisphereLight(0xffffff, 0x53616a, 2.2);
  REM.escena.add(luzPrincipal);
  const luzFrontal = new THREE.DirectionalLight(0xffe1b0, 2.5);
  luzFrontal.position.set(-2, 4, 3);
  REM.escena.add(luzFrontal);

  const cargador = new THREE.GLTFLoader();
  cargador.load(
    "models/rem/scene.gltf",
    (resultado) => {
      REM.modelo = resultado.scene;
      const caja = new THREE.Box3().setFromObject(REM.modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamaño = caja.getSize(new THREE.Vector3());
      const escala = 1.65 / Math.max(tamaño.x, tamaño.y, tamaño.z);

      REM.modelo.position.sub(centro);
      REM.modelo.scale.setScalar(escala);
      REM.modelo.scale.multiplyScalar(0.52);
      REM.modelo.position.set(0.55, -0.35, 0.25);
      REM.escena.add(REM.modelo);
      REM.modelo.rotation.y = Math.PI;
      REM.modeloEnTienda = REM.modelo.clone();
      REM.modeloEnTienda.position.set(0, 0.5, -0.18);
      REM.modeloEnTienda.scale.multiplyScalar(1.9);
      REM.modeloEnTienda.rotation.y = Math.PI;
      TIENDA.escena.add(REM.modeloEnTienda);
      REM.cargado = true;
    },
    undefined,
    (error) => console.error("No se pudo cargar Rem:", error),
  );
}

function remEstaVisible() {
  if (!REM.cargado) return false;

  const deltaX = REM.posicion.x - jugador.posicion.x;
  const deltaY = REM.posicion.y - jugador.posicion.y;
  const distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  let diferencia = Math.atan2(deltaY, deltaX) - jugador.angulo;

  while (diferencia > Math.PI) diferencia -= TWO_PI;
  while (diferencia < -Math.PI) diferencia += TWO_PI;
  if (Math.abs(diferencia) > jugador.fov * 0.62) return false;

  const pared = lanzarRayo(jugador.angulo + diferencia);
  return !pared || pared.distancia >= distancia - TAMAÑO_CELDA * 0.25;
}

function remDibujar() {
  if (!remEstaVisible()) return;

  REM.renderizador.render(REM.escena, REM.camara);

  const deltaX = REM.posicion.x - jugador.posicion.x;
  const deltaY = REM.posicion.y - jugador.posicion.y;
  const distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  let diferencia = Math.atan2(deltaY, deltaX) - jugador.angulo;
  while (diferencia > Math.PI) diferencia -= TWO_PI;
  while (diferencia < -Math.PI) diferencia += TWO_PI;

  const distanciaFocal = ANCHO_JUEGO / 2 / tan(jugador.fov / 2);
  const centroX = ANCHO_JUEGO / 2 + tan(diferencia) * distanciaFocal;
  const alto = (TAMAÑO_CELDA * 1.75 / distancia) * distanciaFocal;
  const ancho = alto;

  const contexto = pantallaJuego.drawingContext;
  contexto.save();
  contexto.drawImage(
    REM.canvas,
    centroX - ancho / 2,
    ALTO_JUEGO / 2 - alto / 2,
    ancho,
    alto,
  );
  contexto.restore();
}
