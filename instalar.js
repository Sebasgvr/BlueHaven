(() => {
 const dialogo=document.createElement('dialog');dialogo.id='instalar-app';dialogo.setAttribute('aria-labelledby','instalar-titulo');
 dialogo.innerHTML=`<header><img src="icons/icon-192.png" alt="" width="72" height="72"><small>BLUE HAVEN · EN TU CELULAR</small><h2 id="instalar-titulo">El lago, siempre a mano</h2><p>Instalá el juego con su propio ícono y abrilo como una app.</p></header><p id="instalar-estado" role="status" aria-live="polite"></p><div id="instalar-instrucciones"></div><p class="instalar-nota">El modo invitado puede usarse sin conexión cuando los archivos estén guardados. Tu progreso de invitado queda en este dispositivo. Las cuentas, el guardado en Supabase, el ranking y las salas necesitan internet.</p><p id="instalar-archivos" role="status"></p><button id="instalar-confirmar" type="button" hidden>Instalar Blue Haven</button><button id="instalar-actualizar" type="button" hidden>Actualizar y reiniciar</button><footer><button id="instalar-cerrar" type="button">Volver</button></footer>`;
 document.body.appendChild(dialogo);
 const el=id=>document.getElementById(id),soporte='serviceWorker'in navigator&&window.isSecureContext;
 const independiente=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const iphone=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 let invitacion=null,registro=null,preparado=false,fallo=false,instalando=false,reiniciando=false;
 function mostrar(){
  const instalada=independiente();
  el('instalar-estado').textContent=instalada?'Ya estás jugando desde la app.':instalando?'Terminá la instalación en el aviso del navegador.':'Se instala desde tu navegador y agrega un ícono a la pantalla de inicio.';
  el('instalar-confirmar').hidden=!invitacion||instalada;el('instalar-confirmar').disabled=instalando;
  el('instalar-instrucciones').replaceChildren();
  const p=document.createElement('p');
  p.textContent=instalada?'Podés usar el ícono de Blue Haven en tu pantalla de inicio para volver al lago.':iphone?'En Safari: tocá Compartir → Agregar a pantalla de inicio → Agregar. Si aparece «Abrir como app», dejalo activado.':invitacion?'Tocá «Instalar Blue Haven» y confirmá la instalación.':/Android/.test(navigator.userAgent)?'Abrí esta página en Chrome o un navegador compatible. En su menú ⋮ elegí «Instalar aplicación» o «Agregar a pantalla de inicio». Si estás dentro de WhatsApp o Instagram, primero abrila en el navegador.':'En Chrome o Edge, buscá el ícono de instalación en la barra de direcciones o la opción «Instalar» en su menú. También podés abrir esta página en tu celular.';
  el('instalar-instrucciones').append(p);
  el('instalar-archivos').textContent=!soporte?'Este navegador no permite guardar el juego para usarlo sin conexión. Usá HTTPS y un navegador actualizado.':fallo?'No se pudieron guardar todos los archivos. Revisá tu conexión y el espacio disponible, y volvé a abrir la página.':preparado?'✓ Archivos guardados: el invitado está disponible sin conexión.':'Guardando los archivos del juego… Esperá con internet hasta que aparezca la confirmación.';
  el('instalar-actualizar').hidden=!registro?.waiting;
  el('instalar-acceso').textContent=registro?.waiting?'⬆ Actualizar Blue Haven':'📲 Instalar en el celular';
  el('instalar-ajustes').textContent=registro?.waiting?'⬆ Actualización disponible':'📲 Instalar / actualizar juego';
  el('boton-ajustes').classList.toggle('actualizacion-disponible',!!registro?.waiting);
  el('boton-ajustes').title=registro?.waiting?'Hay una actualización del juego disponible':'Ajustes del juego';
  if(registro?.waiting)el('instalar-archivos').textContent+=' Hay una versión nueva lista. Actualizá cuando termines de pescar; el juego se reiniciará.';
 }
 function abrir(){mostrar();window.ControlTactil?.soltarTodo();if(typeof sistemaCaptura!=='undefined')sistemaCaptura?.soltarBoton();dialogo.showModal();if(document.pointerLockElement)document.exitPointerLock();}
 el('instalar-acceso').addEventListener('click',abrir);el('instalar-ajustes').addEventListener('click',abrir);
 el('instalar-cerrar').addEventListener('click',()=>{dialogo.close();if(document.body.classList.contains('jugando')&&!interfazBloqueada()&&!cursorLibre)capturarCursor()});
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();invitacion=e;mostrar()});
 window.addEventListener('appinstalled',()=>{invitacion=null;instalando=false;el('instalar-estado').textContent='¡Blue Haven instalado! Buscá su ícono en el inicio.';el('instalar-confirmar').hidden=true});
 el('instalar-confirmar').addEventListener('click',async()=>{
  if(!invitacion||instalando)return;const aviso=invitacion;invitacion=null;instalando=true;mostrar();
  try{await aviso.prompt();const respuesta=await aviso.userChoice;el('instalar-estado').textContent=respuesta.outcome==='accepted'?'Instalación aceptada. El navegador agregará el ícono de Blue Haven.':'Podés instalarlo más adelante desde el menú del navegador.';}
  catch(_){el('instalar-estado').textContent='Usá la opción de instalación del menú del navegador.';}
  finally{instalando=false;el('instalar-confirmar').hidden=true;}
 });
 el('instalar-actualizar').addEventListener('click',()=>{if(!registro?.waiting)return;reiniciando=true;el('instalar-actualizar').disabled=true;registro.waiting.postMessage({tipo:'ACTUALIZAR'})});
 if(soporte){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reiniciando)location.reload()});
  window.addEventListener('load',async()=>{
   try{
    registro=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
    function observar(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='redundant'&&!registro.active){fallo=true;mostrar()}if(worker.state==='installed')mostrar()});}
    observar(registro.installing);registro.addEventListener('updatefound',()=>observar(registro.installing));
    navigator.serviceWorker.ready.then(()=>{preparado=true;mostrar()});mostrar();
   }catch(_){fallo=true;mostrar();}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)registro?.update().catch(()=>{})});
 }
 mostrar();
})();
