/* Los avisos Realtime solo disparan una lectura: autor y contenido vienen de la RPC. */
window.crearChatSala=({cliente,getSala,getFase})=>{
 const boton=document.createElement('button');boton.id='boton-chat-sala';boton.type='button';boton.hidden=true;boton.textContent='💬 Chat';document.getElementById('barra-juego').append(boton);
 const panel=document.createElement('dialog');panel.id='chat-sala';panel.setAttribute('aria-labelledby','chat-sala-titulo');
 panel.innerHTML=`<header><small>BLUE HAVEN · SOLO TU SALA</small><h2 id="chat-sala-titulo">Charlas junto al lago</h2><p>Últimos 50 mensajes de esta sala. T para abrir · Esc para volver.</p></header><ol id="chat-sala-mensajes" role="log" aria-live="polite" aria-label="Mensajes de la sala"></ol><p id="chat-sala-estado" role="status"></p><form id="chat-sala-form"><label for="chat-sala-texto">Tu mensaje</label><div class="chat-sala-envio"><input id="chat-sala-texto" type="text" maxlength="280" autocomplete="off" placeholder="Escribí para tus compañeros…" required><button id="chat-sala-enviar" type="submit">Enviar</button></div></form><footer><button id="chat-sala-cerrar" type="button">Volver al lago</button></footer>`;
 document.body.append(panel);const el=id=>document.getElementById(id),lista=el('chat-sala-mensajes'),entrada=el('chat-sala-texto');
 let vistos=new Set(),noLeidos=0,version=0,cargando=false,enviando=false,ultimaLectura=0,ultimoEnvio=0,inicial=true,temporizador=null,pendiente=null,secuencia=0,aplicada=0,aviso=null;
 function actualizarEstado(){const activa=!!getSala(),conectado=getFase()==='conectado';boton.hidden=!activa;boton.textContent='💬 Chat'+(noLeidos?' ('+Math.min(noLeidos,50)+')':'');el('chat-sala-enviar').disabled=!conectado||enviando;entrada.disabled=!conectado;if(!activa&&panel.open)panel.close();if(panel.open&&!conectado)el('chat-sala-estado').textContent='Reconectando… Podés seguir leyendo; esperá para enviar.';}
 function mostrar(mensajes,orden){
  if(orden<aplicada||!Array.isArray(mensajes))return;aplicada=orden;
  const cercaDelFinal=lista.scrollHeight-lista.scrollTop-lista.clientHeight<50;
  for(const m of mensajes.slice(-50)){
   if(vistos.has(m.id))continue;vistos.add(m.id);
   if(!inicial&&!panel.open&&!m.es_tuyo)noLeidos++;
   const li=document.createElement('li'),autor=document.createElement('strong'),texto=document.createElement('p'),hora=document.createElement('time');
   autor.textContent=m.es_tuyo?m.nombre+' (vos)':m.nombre;texto.textContent=m.texto;hora.dateTime=m.fecha;hora.textContent=new Date(m.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});li.append(autor,hora,texto);if(m.es_tuyo)li.classList.add('chat-mio');lista.append(li);
  }
  while(lista.children.length>50)lista.firstElementChild.remove();
  vistos=new Set(mensajes.map(m=>m.id));inicial=false;if(cercaDelFinal||enviando)lista.scrollTop=lista.scrollHeight;actualizarEstado();
 }
 async function cargar(forzar=false){
  if(!getSala()||getFase()!=='conectado'||cargando||enviando||(!forzar&&Date.now()-ultimaLectura<750))return;
  const turno=version,orden=++secuencia;cargando=true;ultimaLectura=Date.now();
  try{const datos=await BaseDatos.chatSala(cliente);if(turno!==version)return;mostrar(datos,orden);if(panel.open)el('chat-sala-estado').textContent='Solo pueden leer y enviar quienes estén en esta sala.';}
  catch(err){if(turno===version&&panel.open)el('chat-sala-estado').textContent='No se pudo leer el chat. '+err.message;}
  finally{if(turno===version)cargando=false;}
 }
 function ajustar(){if(!panel.open)return;const vista=window.visualViewport,alto=vista?.height||innerHeight;panel.style.position='fixed';panel.style.margin='0 auto';panel.style.bottom='auto';panel.style.maxHeight=Math.max(160,alto-24)+'px';lista.style.maxHeight=Math.max(60,alto*.3)+'px';panel.style.top=((vista?.offsetTop||0)+Math.max(12,(alto-panel.getBoundingClientRect().height)/2))+'px';if(document.activeElement===entrada)entrada.scrollIntoView({block:'nearest'});}
 window.visualViewport?.addEventListener('resize',ajustar);window.visualViewport?.addEventListener('scroll',ajustar);window.addEventListener('resize',ajustar);
 function abrir(){if(!getSala()||interfazBloqueada()||bienvenidaActiva())return;window.ControlTactil?.soltarTodo();sistemaCaptura.soltarBoton();noLeidos=0;actualizarEstado();panel.showModal();ajustar();if(document.pointerLockElement)document.exitPointerLock();lista.scrollTop=lista.scrollHeight;cargar(true);entrada.focus();}
 async function enviar(e){
  e.preventDefault();if(enviando||!getSala()||getFase()!=='conectado')return;
  const texto=entrada.value.trim();if(!texto)return;
  if(FiltrosCuentas.contieneOfensas(texto)){el('chat-sala-estado').textContent='El mensaje contiene palabras no permitidas.';return;}
  if(Date.now()-ultimoEnvio<1000){el('chat-sala-estado').textContent='Esperá un segundo antes de enviar otro mensaje.';return;}
  if(!pendiente||pendiente.texto!==texto)pendiente={texto,token:crypto.randomUUID()};
  const turno=version,orden=++secuencia;enviando=true;actualizarEstado();el('chat-sala-estado').textContent='Enviando…';
  try{const datos=await BaseDatos.chatSala(cliente,texto,pendiente.token);if(turno!==version)return;mostrar(datos,orden);if(entrada.value.trim()===texto)entrada.value='';pendiente=null;ultimoEnvio=Date.now();el('chat-sala-estado').textContent='Mensaje enviado.';}
  catch(err){if(turno===version)el('chat-sala-estado').textContent='No se pudo enviar. '+err.message;}
  finally{if(turno===version){enviando=false;actualizarEstado();entrada.focus();}}
 }
 function avisar(){if(aviso||!getSala())return;aviso=setTimeout(()=>{aviso=null;if(cargando||enviando){avisar();return;}cargar(true)},750);}
 function iniciar(){clearInterval(temporizador);temporizador=setInterval(()=>{if(panel.open)cargar()},3000);cargar(true);actualizarEstado();}
 function limpiar(){++version;clearTimeout(aviso);aviso=null;clearInterval(temporizador);temporizador=null;cargando=enviando=false;vistos.clear();noLeidos=0;inicial=true;ultimaLectura=ultimoEnvio=0;pendiente=null;secuencia=aplicada=0;entrada.value='';lista.replaceChildren();el('chat-sala-estado').textContent='';panel.close();actualizarEstado();}
 boton.addEventListener('click',abrir);el('chat-sala-form').addEventListener('submit',enviar);el('chat-sala-cerrar').addEventListener('click',()=>{panel.close();if(!cursorLibre&&!interfazBloqueada())capturarCursor()});
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='t'&&!e.repeat&&!e.target.closest('input,textarea,select,[contenteditable="true"]')){if(getSala()&&!interfazBloqueada()&&!bienvenidaActiva()){e.preventDefault();abrir();}}});
 return Object.freeze({iniciar,limpiar,cargar,avisar,actualizarEstado});
};
