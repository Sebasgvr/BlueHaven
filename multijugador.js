/* Salas de cuatro: Realtime transporta posiciones y avisos de chat, nunca economía. */
(() => {
 const colores=[0x75cfbd,0xe6ac66,0x9eabef,0xe88eaf];
 const panel=document.createElement('dialog');panel.id='multijugador';panel.setAttribute('aria-labelledby','sala-titulo');
 panel.innerHTML=`<header><small>BLUE HAVEN · SALAS PRIVADAS</small><h2 id="sala-titulo">Un lago para compartir</h2><p>Hasta 4 jugadores. Cada uno conserva su pesca, equipo y progreso.</p></header><p id="sala-mensaje" role="status" aria-live="polite"></p><div id="sala-acceso"><button id="sala-crear" type="button">Crear sala privada</button><form id="sala-formulario"><label for="sala-entrada">Código de invitación</label><div class="sala-unirse"><input id="sala-entrada" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="15" placeholder="ABCDEF-123456" required pattern="[0-9a-fA-F -]{12,15}"><button id="sala-unir" type="submit">Unirme</button></div></form></div><section id="sala-dentro" hidden><p class="sala-codigo-label">Invitá a tus amigos con este código</p><div class="sala-codigo-fila"><output id="sala-codigo"></output><button id="sala-copiar" type="button">Copiar</button></div><p id="sala-conexion" role="status"></p><ul id="sala-jugadores" aria-label="Jugadores de la sala"></ul><p class="sala-nota">La sala dura hasta 24 horas. Si se desconecta alguien, su lugar se libera en 75 segundos. Podés seguir pescando si se corta la conexión.</p><button id="sala-salir" type="button">Salir de la sala</button></section><footer><button id="sala-volver" type="button">Volver al juego</button></footer>`;
 document.body.appendChild(panel);
 const el=id=>document.getElementById(id);
 let cliente=crypto.randomUUID();try{cliente=sessionStorage.getItem('BH_SALA_CLIENTE')||cliente;sessionStorage.setItem('BH_SALA_CLIENTE',cliente)}catch(_){}
 let sala=null,canal=null,fase='solo',mensaje='',ocupado=false,generacion=0,latido=null,envio=null,consultando=false,ultimaConsulta=0,ultimoEnvio=0,ultimaPose='',secuencia=0;
 const chat=crearChatSala({cliente,getSala:()=>sala,getFase:()=>fase});
 const avatares=new Map(),online=new Set(),ultimas=new Map();
 // Geometrías compartidas: tres personajes agregan pocas mallas sin modelos pesados.
 let geometria,materiales;
 const estado={get sala(){return sala},get fase(){return fase},get jugadoresVisibles(){return avatares.size}};
 window.Multijugador=Object.freeze({actualizar,desconectar,abrir,estado});
 function ui(){
  chat.actualizarEstado();
  const activa=!!sala;el('sala-acceso').hidden=activa||window.modoInvitado;el('sala-dentro').hidden=!activa;
  el('sala-mensaje').textContent=window.modoInvitado?'Iniciá sesión con una cuenta para crear o unirte a una sala. Tu partida de invitado sigue siendo individual.':mensaje;
  el('sala-crear').disabled=el('sala-unir').disabled=ocupado;el('sala-salir').disabled=ocupado;
  const boton=el('boton-multijugador');boton.textContent=activa?'👥 Sala '+sala.jugadores.length+'/4':'👥 Multijugador';
  if(!activa)return;
  el('sala-codigo').textContent=sala.codigo.slice(0,6)+'-'+sala.codigo.slice(6);
  el('sala-conexion').textContent=fase==='conectado'?'Conectado · '+sala.jugadores.length+'/4 jugadores':fase==='reconectando'?'Reconectando… Tu progreso está a salvo.':'Conectando al lago…';
  el('sala-jugadores').replaceChildren(...sala.jugadores.map(j=>{const li=document.createElement('li'),punto=document.createElement('span');punto.className='sala-color';punto.style.background='#'+colores[j.asiento].toString(16).padStart(6,'0');li.append(punto,document.createTextNode(j.nombre+(j.id===sala.yo?' (vos)':online.has(j.id)?'':' · conectando')));return li}));
 }
 function abrir(){if(interfazBloqueada()||bienvenidaActiva())return;window.ControlTactil?.soltarTodo();sistemaCaptura.soltarBoton();ui();panel.showModal();if(document.pointerLockElement)document.exitPointerLock();}
 function quitarAvatar(id){const a=avatares.get(id);if(!a)return;escena3D.remove(a.grupo);a.etiqueta.material.map.dispose();a.etiqueta.material.dispose();avatares.delete(id);ultimas.delete(id);}
 function limpiar(){for(const id of avatares.keys())quitarAvatar(id);online.clear();ultimas.clear();}
 async function desconectar(avisar=true){
  ++generacion;clearInterval(latido);clearInterval(envio);latido=envio=null;const anterior=canal,tenia=!!sala;canal=null;sala=null;fase='solo';ultimaPose='';ultimoEnvio=0;consultando=false;limpiar();chat.limpiar();
  // Iniciar la salida con la sesión vigente, antes de logout. El lease cubre cierres abruptos.
  const salida=avisar&&tenia?BaseDatos.sala('salir','',cliente).catch(()=>null):Promise.resolve();
  if(anterior)BaseDatos.cerrarCanalSala(anterior).catch(()=>{});ui();await salida;
 }
 async function conectar(accion,codigo=''){
  if(ocupado||window.modoInvitado)return;ocupado=true;mensaje='Preparando la sala…';ui();const turno=++generacion,partida=window.partidaId;
  try{
   const datos=await BaseDatos.sala(accion,codigo,cliente);if(turno!==generacion||partida!==window.partidaId){if(partida===window.partidaId)await BaseDatos.sala('salir','',cliente);return;}
   sala=datos;const asiento=datos.jugadores.find(j=>j.id===datos.yo)?.asiento||0;if(asiento&&Math.hypot(jugador.posicion.x-TAMAÑO_CELDA*18.5,jugador.posicion.y-TAMAÑO_CELDA*27.5)<2){const posicion=createVector(jugador.posicion.x+asiento*26,jugador.posicion.y);if(!jugador._hayColision(posicion))jugador.posicion.set(posicion);}
   fase='conectando';mensaje='';ui();
   const actual=await BaseDatos.canalSala(datos.canal,datos.yo);
   if(turno!==generacion){BaseDatos.cerrarCanalSala(actual);return;}
   canal=actual;
   actual.on('broadcast',{event:'chat_aviso'},()=>{if(canal===actual)chat.avisar()});
   actual.on('broadcast',{event:'pose'},({payload})=>recibir(payload));
   actual.on('presence',{event:'sync'},()=>{
    if(canal!==actual)return;online.clear();for(const id of Object.keys(actual.presenceState()))online.add(id);
    for(const id of avatares.keys())if(!online.has(id))quitarAvatar(id);
    ui();consultar();enviar(true);
   });
   actual.subscribe(async status=>{
    if(canal!==actual)return;
    if(status==='SUBSCRIBED'){
     fase='conectado';ui();chat.iniciar();await actual.track({conectado:true});if(canal===actual){consultar(true);enviar(true);}
    }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){fase='reconectando';limpiar();ui();}
   });
   latido=setInterval(()=>consultar(true),12000);envio=setInterval(()=>enviar(),125);
  }catch(err){if(turno===generacion){mensaje=err.message;await desconectar();}}
  finally{ocupado=false;ui();}
 }
 async function consultar(forzar=false){
  if(!sala||consultando||(!forzar&&Date.now()-ultimaConsulta<1000))return;
  const turno=generacion;consultando=true;ultimaConsulta=Date.now();
  try{const datos=await BaseDatos.sala('estado','',cliente);if(turno!==generacion)return;sala=datos;if(canal?.state==='joined')fase='conectado';for(const id of avatares.keys())if(!datos.jugadores.some(j=>j.id===id))quitarAvatar(id);ui();chat.cargar();}
  catch(err){if(turno!==generacion)return;if(/cerró|venció|otra pestaña|sesión/.test(err.message)){mensaje=err.message;await desconectar();}else{fase='reconectando';limpiar();ui();}}
  finally{if(turno===generacion)consultando=false;}
 }
 function pose(){
  if(typeof jugador==='undefined'||!jugador)return null;
  return {x:Math.round(jugador.posicion.x*10)/10,z:Math.round(jugador.posicion.y*10)/10,y:Math.round((jugador.alturaPiso+jugador.alturaSalto||0)*10)/10,a:Math.round(jugador.angulo*1000)/1000,c:!!jugador.agachado,p:sistemaCaptura.estado!=='inactivo'||estadoLanzamiento!=='reposo',pausa:interfazBloqueada()||document.hidden};
 }
 function enviar(forzar=false){
  if(!canal||!sala||fase!=='conectado'||!document.body.classList.contains('jugando'))return;
  const p=pose();if(!p)return;const firma=JSON.stringify(p);if(!forzar&&firma===ultimaPose&&Date.now()-ultimoEnvio<1000)return;
  ultimoEnvio=Date.now();ultimaPose=firma;
  // Todo dato recibido es cosmético y se valida. No existe RPC de dinero/inventario en este canal.
  canal.send({type:'broadcast',event:'pose',payload:{id:sala.yo,n:++secuencia,...p}}).catch(()=>{});
 }
 function recibir(p){
  if(!sala||fase!=='conectado'||!p||p.id===sala.yo)return;
  const j=sala.jugadores.find(j=>j.id===p.id);if(!j){consultar();return;}
  if(!online.has(p.id))return;
  if(![p.x,p.z,p.y,p.a,p.n].every(Number.isFinite)||p.x<0||p.z<0||p.x>MAPA_ANCHO*TAMAÑO_CELDA||p.z>MAPA_ALTO*TAMAÑO_CELDA||p.y<0||p.y>600||Math.abs(p.a)>1e6||!Number.isSafeInteger(p.n))return;
  const previa=ultimas.get(p.id);if(previa&&p.n<=previa.n)return;
  const objetivo={...p,a:Math.atan2(Math.sin(p.a),Math.cos(p.a)),p:p.p===true,c:p.c===true,tiempo:performance.now()};ultimas.set(p.id,objetivo);
  let a=avatares.get(p.id);if(!a){a=crearAvatar(j);a.grupo.position.set(p.x,p.y,p.z);a.grupo.rotation.y=-objetivo.a-Math.PI/2;avatares.set(p.id,a);}
 }
 function crearAvatar(j){
  if(!geometria){geometria={caja:new THREE.BoxGeometry(1,1,1),cabeza:new THREE.SphereGeometry(1,8,6),sombrero:new THREE.CylinderGeometry(1,1,1,10),cana:new THREE.CylinderGeometry(.65,.65,48,5)};materiales={piel:new THREE.MeshLambertMaterial({color:0xe6b88b}),oscuro:new THREE.MeshLambertMaterial({color:0x293c46}),sombrero:new THREE.MeshLambertMaterial({color:0xd6b57c}),colores:colores.map(color=>new THREE.MeshLambertMaterial({color}))};}
  const grupo=new THREE.Group();grupo.name='pescador-remoto';
  const pieza=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);grupo.add(m);return m;};
  const cuerpo=pieza(geometria.caja,materiales.colores[j.asiento],0,27,0,19,22,12);
  pieza(geometria.cabeza,materiales.piel,0,44,0,8,8,8);pieza(geometria.sombrero,materiales.sombrero,0,51,0,12,2,12);pieza(geometria.sombrero,materiales.sombrero,0,54,0,8,6,8);
  const piernas=[-5,5].map(x=>pieza(geometria.caja,materiales.oscuro,x,9,0,7,18,8));
  const brazos=[-12,12].map(x=>pieza(geometria.caja,materiales.piel,x,27,0,5,20,6));
  const cana=pieza(geometria.cana,materiales.sombrero,14,39,-18,1,1,1);cana.rotation.x=-.6;
  const lienzo=document.createElement('canvas');lienzo.width=512;lienzo.height=96;const ctx=lienzo.getContext('2d');ctx.fillStyle='#102936dd';ctx.fillRect(0,0,512,96);ctx.fillStyle='#edfff7';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText(j.nombre.slice(0,32),256,60,490);
  const textura=new THREE.CanvasTexture(lienzo),etiqueta=new THREE.Sprite(new THREE.SpriteMaterial({map:textura,transparent:true,depthTest:true}));etiqueta.scale.set(85,16,1);etiqueta.position.y=75;grupo.add(etiqueta);escena3D.add(grupo);return {grupo,piernas,brazos,cana,cuerpo,etiqueta,anterior:new THREE.Vector3()};
 }
 function actualizar(dt){
  const t=performance.now(),factor=1-Math.exp(-14*Math.min(dt,.1));
  for(const [id,a] of avatares){const objetivo=ultimas.get(id);if(!objetivo)continue;
   a.grupo.visible=fase==='conectado'&&t-objetivo.tiempo<5000;if(!a.grupo.visible)continue;
   a.anterior.copy(a.grupo.position);a.grupo.position.lerp(new THREE.Vector3(objetivo.x,objetivo.y,objetivo.z),factor);
   const destino=-objetivo.a-Math.PI/2,diferencia=Math.atan2(Math.sin(destino-a.grupo.rotation.y),Math.cos(destino-a.grupo.rotation.y));a.grupo.rotation.y+=diferencia*factor;
   const mueve=a.anterior.distanceTo(a.grupo.position)>.03&&!objetivo.p&&!objetivo.pausa;
   a.piernas.forEach((p,i)=>p.rotation.x=mueve?Math.sin(t*.012+i*Math.PI)*.45:0);
   a.brazos.forEach((b,i)=>b.rotation.x=objetivo.p?-.9:mueve?-Math.sin(t*.012+i*Math.PI)*.3:0);
   a.cana.visible=objetivo.p;a.grupo.scale.y=objetivo.c?.75:1;
   const escalaEtiqueta=Math.min(1,camara3D.position.distanceTo(a.grupo.position)/250);a.etiqueta.scale.set(85*escalaEtiqueta,16*escalaEtiqueta,1);
  }
 }
 el('sala-crear').addEventListener('click',()=>conectar('crear'));
 el('sala-formulario').addEventListener('submit',e=>{e.preventDefault();conectar('unir',el('sala-entrada').value)});
 el('sala-copiar').addEventListener('click',async()=>{if(!sala)return;try{await navigator.clipboard.writeText(el('sala-codigo').textContent);mensaje='Código copiado. Compartilo con tus amigos.';}catch(_){mensaje='Copiá el código que aparece arriba para compartirlo.';}ui();});
 el('sala-salir').addEventListener('click',async()=>{if(ocupado)return;ocupado=true;ui();await desconectar();mensaje='Saliste de la sala. Continuás jugando individualmente.';ocupado=false;ui();});
 el('sala-volver').addEventListener('click',()=>{panel.close();if(!cursorLibre)capturarCursor()});
 el('boton-multijugador').addEventListener('click',abrir);
 window.addEventListener('offline',()=>{if(sala){fase='reconectando';limpiar();ui()}});
 window.addEventListener('online',()=>{if(sala)consultar(true)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sala){consultar(true);enviar(true)}});
 // Evitar estados fantasma en back/forward cache. Un cierre brusco queda cubierto por el lease.
 window.addEventListener('pagehide',()=>{desconectar()});
})();
