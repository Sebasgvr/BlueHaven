// Una llamada de dibujo por tipo de baldosa, en lugar de una por celda.
const OPCIONES_GRAFICAS = {
  baja: { escala: 0.65, fps: 30 },
  media: { escala: 0.85, fps: 60 },
  alta: { escala: 1, fps: 60 },
};
let opcionesGraficas = { calidad: 'media', fps: false, volumen: 1, silencio: false, musica:true };
try { Object.assign(opcionesGraficas, JSON.parse(localStorage.getItem('BLUEHAVEN_AJUSTES') || '{}')); } catch (_) {}
let muestrasFPS = [];
let ultimoIndicador = 0;
function interfazBloqueada() {
  return !document.body.classList.contains('jugando') || !!window.chatAbierto || !!document.querySelector('dialog[open]');
}
function aplicarCalidadGrafica() {
  const config = OPCIONES_GRAFICAS[opcionesGraficas.calidad] || OPCIONES_GRAFICAS.media;
  if (typeof renderizador3D !== 'undefined' && renderizador3D) {
    renderizador3D.setPixelRatio(config.escala);
    renderizador3D.setSize(window.innerWidth, window.innerHeight);
  }
  if (typeof frameRate === 'function') frameRate(config.fps);
}
function construirTerrenoInstanciado(materialPared) {
  const grupos = new Map();
  for (let f = 0; f < MAPA_ALTO; f++) for (let c = 0; c < MAPA_ANCHO; c++) {
    const tipo = MAPA[f][c];
    if (tipo === 3) continue;
    const clave = tipo === 1 ? 'pared' : obtenerClaveBaldosa(f, c);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push([f, c]);
  }
  const piso = new THREE.PlaneGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA);
  const pared = new THREE.BoxGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA, TAMAÑO_CELDA);
  const matriz = new THREE.Object3D();
  for (const [clave, celdas] of grupos) {
    const esMuro = clave === 'pared';
    const mesh = new THREE.InstancedMesh(esMuro ? pared : piso, esMuro ? materialPared : obtenerMaterialBaldosa(clave), celdas.length);
    mesh.name = 'terreno-' + clave;
    mesh.frustumCulled = false; // Three r128 no calcula límites de instancias.
    celdas.forEach(([f, c], i) => {
      matriz.position.set((c + 0.5) * TAMAÑO_CELDA, esMuro ? TAMAÑO_CELDA / 2 : 0, (f + 0.5) * TAMAÑO_CELDA);
      matriz.rotation.set(esMuro ? 0 : -Math.PI / 2, 0, 0);
      matriz.updateMatrix();
      mesh.setMatrixAt(i, matriz.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.matrixAutoUpdate = false;
    escena3D.add(mesh);
  }
}
function actualizarRendimiento() {
  muestrasFPS.push(deltaTime);
  if (muestrasFPS.length > 60) muestrasFPS.shift();
  if (performance.now() - ultimoIndicador < 500) return;
  ultimoIndicador = performance.now();
  const fps = Math.round(1000 / (muestrasFPS.reduce((a,b) => a+b, 0) / muestrasFPS.length));
  const info = `${fps} FPS · ${renderizador3D.info.render.calls} llamadas de dibujo`;
  document.getElementById('detalle-rendimiento').textContent = info;
  const hud = document.getElementById('rendimiento-hud');
  hud.textContent = opcionesGraficas.fps ? info : '';
}
const hudRendimiento = document.createElement('div');
hudRendimiento.id = 'rendimiento-hud';
document.body.appendChild(hudRendimiento);
let cursorLibre = false;
function capturarCursor() {
  if (window.ControlTactil?.activo || typeof renderizador3D === 'undefined' || !renderizador3D || document.pointerLockElement) return;
  try { const pedido=renderizador3D.domElement.requestPointerLock(); if(pedido?.catch)pedido.catch(()=>{}); } catch (_) {}
}
function abrirAjustes() {
  if (!document.body.classList.contains('jugando')) return;
  if (typeof cerrarChat==='function') cerrarChat();
  sistemaCaptura.soltarBoton();
  document.getElementById('ajustes').showModal();
  if (document.pointerLockElement) document.exitPointerLock();
}
function aplicarAudio() {
  const volumen=opcionesGraficas.silencio?0:opcionesGraficas.volumen;
  if (typeof p5!=='undefined' && p5.soundOut) {
    const salida=p5.soundOut;
    salida.output.gain.cancelScheduledValues(salida.audiocontext.currentTime);
    salida.output.gain.value=volumen;
  }
  else if (typeof masterVolume==='function') masterVolume(volumen);
  document.querySelectorAll('audio,video').forEach(m=>{m.volume=opcionesGraficas.volumen;m.muted=opcionesGraficas.silencio;});
  document.getElementById('valor-volumen').textContent=Math.round(opcionesGraficas.volumen*100)+'%';
}
opcionesGraficas.volumen=Math.min(1,Math.max(0,Number(opcionesGraficas.volumen)||0));
document.getElementById('boton-ajustes').addEventListener('click',abrirAjustes);
document.getElementById('calidad-grafica').value=opcionesGraficas.calidad;
document.getElementById('mostrar-fps').checked=opcionesGraficas.fps;
document.getElementById('volumen-general').value=opcionesGraficas.volumen*100;
document.getElementById('silenciar-audio').checked=opcionesGraficas.silencio;
document.getElementById('musica-ambiente').checked=opcionesGraficas.musica;
function guardarAjustes() {
  opcionesGraficas.calidad=document.getElementById('calidad-grafica').value;
  opcionesGraficas.fps=document.getElementById('mostrar-fps').checked;
  opcionesGraficas.volumen=Number(document.getElementById('volumen-general').value)/100;
  opcionesGraficas.silencio=document.getElementById('silenciar-audio').checked;
  opcionesGraficas.musica=document.getElementById('musica-ambiente').checked;
  localStorage.setItem('BLUEHAVEN_AJUSTES',JSON.stringify(opcionesGraficas));
  aplicarAudio();aplicarCalidadGrafica();
}
document.getElementById('ajustes').addEventListener('input',guardarAjustes);
document.getElementById('ajustes').addEventListener('change',guardarAjustes);
document.getElementById('cerrar-ajustes').addEventListener('click',()=>{if(!cursorLibre)capturarCursor();});
let teniaCursorCapturado=false;
document.addEventListener('pointerlockchange',()=>{
  const perdioCursor=teniaCursorCapturado&&!document.pointerLockElement;
  teniaCursorCapturado=!!document.pointerLockElement;
  if (perdioCursor && !cursorLibre && !interfazBloqueada() && !ENCICLOPEDIA.abierta) abrirAjustes();
});
document.addEventListener('keydown',e=>{
  if(!document.body.classList.contains('jugando'))return;
  if(e.key==='Escape') {
    e.preventDefault();e.stopImmediatePropagation();
    const ajustes=document.getElementById('ajustes'),tienda=document.getElementById('comercio');
    if(ajustes.open)ajustes.close();
    else if(document.getElementById('tarjeta-captura')?.open)cerrarTarjetaCaptura();
    else if(tienda?.open)cerrarComercio();
    else if(document.querySelector('dialog[open]'))document.querySelector('dialog[open]').close();
    else if(window.chatAbierto)cerrarChat();
    else if(ENCICLOPEDIA.abierta)cerrarEnciclopedia();
    else {cancelarPesca();abrirAjustes();}
    return;
  }
  if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(e.key.toLowerCase()==='p'&&!interfazBloqueada()) {
    e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
    cursorLibre=!!document.pointerLockElement;
    if(cursorLibre)document.exitPointerLock();else capturarCursor();
  }
},true);
aplicarAudio();
document.addEventListener('visibilitychange', () => {
  if (!window.juegoPreparado) return;
  if (document.hidden) { noLoop(); sistemaCaptura.soltarBoton(); }
  else if (document.body.classList.contains('jugando')) loop();
});
