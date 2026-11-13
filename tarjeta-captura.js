// Ficha de captura: comparte los datos y los sprites de la enciclopedia.
const tarjetaCaptura=document.createElement('dialog');
tarjetaCaptura.id='tarjeta-captura';tarjetaCaptura.setAttribute('aria-labelledby','captura-nombre');
tarjetaCaptura.innerHTML=`<article class="captura-ficha"><header><span>✦ NUEVA CAPTURA ✦</span><h2 id="captura-nombre"></h2><p id="captura-cientifico"></p></header><div class="captura-cuerpo"><div class="captura-retrato"><img id="captura-sprite" alt=""><strong id="captura-calidad"></strong><span id="captura-valor"></span></div><div><p id="captura-descripcion"></p><dl id="captura-datos"></dl><aside id="captura-curiosidad"></aside></div></div><footer><p id="captura-guardado" role="status" aria-live="polite"></p><button id="captura-continuar" type="button">Seguir pescando</button></footer></article>`;
document.body.appendChild(tarjetaCaptura);
let guardandoTarjeta=false;
function ajustarTarjetaCaptura() {
  if(!tarjetaCaptura.open)return;
  const ficha=tarjetaCaptura.querySelector('.captura-ficha');
  ficha.style.zoom=1;
  const disponible=Math.max(1,(window.visualViewport?.height||window.innerHeight)-28);
  const altura=tarjetaCaptura.getBoundingClientRect().height;
  ficha.style.zoom=Math.min(1,(disponible-4)/Math.max(1,altura-4));
}
window.addEventListener('resize',ajustarTarjetaCaptura);
window.visualViewport?.addEventListener('resize',ajustarTarjetaCaptura);
document.getElementById('captura-sprite').addEventListener('load',ajustarTarjetaCaptura);
document.fonts?.ready.then(ajustarTarjetaCaptura);
function cerrarTarjetaCaptura(){if(!guardandoTarjeta)tarjetaCaptura.close();}
document.getElementById('captura-continuar').addEventListener('click',()=>{cerrarTarjetaCaptura();if(!cursorLibre)capturarCursor();});
tarjetaCaptura.addEventListener('cancel',e=>{e.preventDefault();cerrarTarjetaCaptura();});
tarjetaCaptura.addEventListener('close',()=>{if(document.body.classList.contains('jugando'))cancelarPesca();});
async function mostrarTarjetaCaptura(ejemplar) {
  window.AudioJuego?.efecto('captura');
  const pez={...CATALOGO_ESPECIES.find(p=>p.nombre===ejemplar.nombre),...ejemplar};
  const calidad=calidadDe(pez),partida=window.partidaId,llena=inventario.length>=MAX_RANURAS;
  const texto=(id,valor)=>document.getElementById(id).textContent=valor||'Sin datos';
  texto('captura-nombre',pez.nombre);texto('captura-cientifico',pez.nombreCientifico);
  texto('captura-calidad',calidad.icono+' '+calidad.nombre);texto('captura-valor','$'+precioDe(pez)+(pez.capturaRiesgo?' · Bonus por riesgo':''));
  texto('captura-descripcion',pez.descripcion);texto('captura-curiosidad','¿Sabías que…? '+(pez.datoCurioso||''));
  const imagen=document.getElementById('captura-sprite');imagen.src='textures/peces/'+(SPRITES_ESPECIES[pez.nombre]||pez.sprite);imagen.alt=pez.nombre;
  tarjetaCaptura.style.setProperty('--brillo-captura',calidad.color.join(', '));
  const datos=document.getElementById('captura-datos');datos.replaceChildren();
  for(const [titulo,valor] of [['Rareza de especie',pez.rareza+' / 5'],['Hábitat',pez.habitat],['Alimentación',pez.alimentacion],['Tamaño',pez.tamaño],['Peso',pez.peso],['Dificultad',pez.dificultad],['Cebo recomendado',pez.ceboRecomendado]]) {
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=titulo;dd.textContent=valor||'Desconocido';datos.append(dt,dd);
  }
  guardandoTarjeta=true;document.getElementById('captura-continuar').disabled=true;
  texto('captura-guardado','Guardando tu captura…');
  tarjetaCaptura.showModal();ajustarTarjetaCaptura();sistemaCaptura.soltarBoton();
  if(document.pointerLockElement)document.exitPointerLock();
  try {
    const guardado=await agregarPez(pez);
    if(partida!==window.partidaId)return;
    if(guardado)registrarCaptura(pez);
    texto('captura-guardado',guardado?(llena?'Mochila llena: especie registrada y ejemplar liberado.':'¡Captura guardada en tu mochila!'):'No se pudo guardar la captura. Revisá la conexión.');
  } catch(err) {if(partida===window.partidaId)texto('captura-guardado','No se pudo guardar: '+err.message);}
  finally {if(partida===window.partidaId){guardandoTarjeta=false;document.getElementById('captura-continuar').disabled=false;ajustarTarjetaCaptura();}}
}
