const dialogoRanking=document.createElement('dialog');dialogoRanking.id='ranking';dialogoRanking.setAttribute('aria-labelledby','ranking-titulo');
dialogoRanking.innerHTML=`<header><small>BLUE HAVEN · CLASIFICACIÓN</small><h2 id="ranking-titulo">Los mejores del lago</h2><p>Dinero actual y capturas acumuladas de las cuentas.</p></header><nav aria-label="Orden del ranking"><button data-ranking="dinero" type="button">Más dinero</button><button data-ranking="capturas" type="button">Más capturas</button></nav><p id="ranking-estado" role="status" aria-live="polite"></p><div class="ranking-tabla"><table><thead><tr><th scope="col">Puesto</th><th scope="col">Jugador</th><th scope="col">Dinero</th><th scope="col">Capturas</th></tr></thead><tbody id="ranking-filas"></tbody></table></div><p id="ranking-propio"></p><footer><button type="button" id="ranking-actualizar">Actualizar</button><button type="button" id="ranking-cerrar">Volver al juego</button></footer>`;
document.body.appendChild(dialogoRanking);
let criterioRanking='dinero',peticionRanking=0;
async function cargarRanking(){
 const secuencia=++peticionRanking,partida=window.partidaId;
 document.getElementById('ranking-estado').textContent='Consultando clasificación…';document.getElementById('ranking-actualizar').disabled=true;
 dialogoRanking.querySelectorAll('[data-ranking]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ranking===criterioRanking)));
 try{
  const datos=await BaseDatos.ranking(criterioRanking);
  if(secuencia!==peticionRanking||partida!==window.partidaId||!dialogoRanking.open)return;
  const filas=document.getElementById('ranking-filas');filas.replaceChildren();
  const numero=n=>Number(n).toLocaleString('es-AR');
  for(const jugador of datos.jugadores){const fila=document.createElement('tr');if(jugador.es_tuyo)fila.classList.add('ranking-tu-fila');for(const valor of [jugador.puesto<=3?['🥇','🥈','🥉'][jugador.puesto-1]:numero(jugador.puesto),jugador.nombre+(jugador.es_tuyo?' (vos)':''),'$'+numero(jugador.dinero),numero(jugador.capturas)]){const td=document.createElement('td');td.textContent=valor;fila.append(td)}filas.append(fila);}
  document.getElementById('ranking-estado').textContent=datos.jugadores.length?'Top 20 · '+numero(datos.total_jugadores)+' jugadores':'Todavía no hay jugadores con cuenta. ¡Sé el primero!';
  const tu=datos.tu_puesto;document.getElementById('ranking-propio').textContent=tu?'Tu puesto: #'+numero(tu.puesto)+' · $'+numero(tu.dinero)+' · '+numero(tu.capturas)+' capturas':window.modoInvitado?'Jugá con una cuenta para participar. La partida de invitado queda en este dispositivo.':'';
 }catch(err){if(secuencia===peticionRanking){document.getElementById('ranking-filas').replaceChildren();document.getElementById('ranking-propio').textContent='';document.getElementById('ranking-estado').textContent='No se pudo cargar el ranking. '+err.message;}}
 finally{if(secuencia===peticionRanking)document.getElementById('ranking-actualizar').disabled=false;}
}
function abrirRanking(){if(interfazBloqueada()||bienvenidaActiva()||!cartelRankingDisponible())return;sistemaCaptura.soltarBoton();dialogoRanking.showModal();if(document.pointerLockElement)document.exitPointerLock();cargarRanking();}
dialogoRanking.querySelectorAll('[data-ranking]').forEach(b=>b.addEventListener('click',()=>{criterioRanking=b.dataset.ranking;cargarRanking()}));
document.getElementById('ranking-actualizar').addEventListener('click',cargarRanking);
document.getElementById('ranking-cerrar').addEventListener('click',()=>{dialogoRanking.close();if(!cursorLibre)capturarCursor()});
dialogoRanking.addEventListener('close',()=>{peticionRanking++});
document.addEventListener('keydown',e=>{if((e.key.toLowerCase()==='r'||(e.target===cartelRanking&&['Enter',' '].includes(e.key)))&&!e.repeat&&!e.target.closest('input,textarea,select,[contenteditable="true"]')){if(cartelRankingDisponible()){e.preventDefault();abrirRanking();}}});

// Cartel anclado al mundo: se proyecta junto a la fachada y no ocupa la barra del HUD.
const cartelRanking=document.createElement('div');cartelRanking.id='cartel-ranking';cartelRanking.hidden=true;cartelRanking.tabIndex=0;cartelRanking.setAttribute('role','button');cartelRanking.setAttribute('aria-label','Cartel del ranking junto a la tienda. Ver clasificación completa');
cartelRanking.innerHTML=`<div class="cartel-ranking-cuerpo"><small>BLUE HAVEN · EL LAGO</small><h2>Los mejores pescadores</h2><div class="cartel-ranking-columnas"><section><h3>Más dinero</h3><ol id="cartel-ranking-dinero"></ol></section><section><h3>Más capturas</h3><ol id="cartel-ranking-capturas"></ol></section></div><p id="cartel-ranking-estado" role="status">Consultando el lago…</p><footer id="cartel-ranking-ayuda">Acercate para ver el Top 20</footer></div>`;
document.body.appendChild(cartelRanking);
let consultaCartel=false,ultimaConsultaCartel=0,ultimaOclusionCartel=0,cartelTapado=false;
const puntoCartel=new THREE.Vector3(),proyeccionCartel=new THREE.Vector3(),direccionCartel=new THREE.Vector3(),rayoCartel=new THREE.Raycaster();
function posicionCartelRanking(){
 const caja=TIENDA.cajaColision;
 return puntoCartel.set(caja?caja.max.x+TAMAÑO_CELDA*.85:TIENDA.posicion.x+TAMAÑO_CELDA*3,82+TIENDA_AJUSTE_ALTURA,caja?caja.max.z+TAMAÑO_CELDA*.85:TIENDA.posicion.y+TAMAÑO_CELDA*2);
}
function distanciaCartelRanking(){const p=posicionCartelRanking();return Math.hypot(jugador.posicion.x-p.x,jugador.posicion.y-p.z);}
function cartelRankingDisponible(){return !cartelRanking.hidden&&distanciaCartelRanking()<TAMAÑO_CELDA*3.5;}
async function cargarCartelRanking(){
 if(consultaCartel||Date.now()-ultimaConsultaCartel<60000)return;
 consultaCartel=true;ultimaConsultaCartel=Date.now();const partida=window.partidaId;
 try{
  const datos=await Promise.all(['dinero','capturas'].map(criterio=>BaseDatos.ranking(criterio)));
  if(partida!==window.partidaId)return;
  for(const [i,criterio]of ['dinero','capturas'].entries()){
   const lista=document.getElementById('cartel-ranking-'+criterio);lista.replaceChildren();
   for(const j of datos[i].jugadores.slice(0,3)){const li=document.createElement('li'),nombre=document.createElement('span'),valor=document.createElement('strong');nombre.textContent=j.nombre;valor.textContent=(criterio==='dinero'?'$':'')+Number(j[criterio]).toLocaleString('es-AR');li.append(nombre,valor);lista.append(li);}
  }
  document.getElementById('cartel-ranking-estado').textContent=datos[0].jugadores.length?'Top 3 · Abrí el cartel para ver todos los puestos':'¡El lago espera a sus primeros campeones!';
 }catch(_){if(partida===window.partidaId)document.getElementById('cartel-ranking-estado').textContent='El ranking necesita conexión. Abrí el cartel para consultar.';}
 finally{consultaCartel=false;}
}
function actualizarCartelRanking(){
 cartelRanking.hidden=true;
 if(!TIENDA.objetoMundo||!document.body.classList.contains('jugando')||interfazBloqueada()||bienvenidaActiva()||ENCICLOPEDIA.abierta||sistemaCaptura.estado!=='inactivo'||estadoLanzamiento!=='reposo')return;
 const posicion=posicionCartelRanking(),distancia=distanciaCartelRanking();if(distancia>TAMAÑO_CELDA*7)return;
 proyeccionCartel.copy(posicion).project(camara3D);
 if(proyeccionCartel.z< -1||proyeccionCartel.z>1||Math.abs(proyeccionCartel.x)>1.15||Math.abs(proyeccionCartel.y)>1.15)return;
 // El BVH ya existente de la tienda evita atravesar sus paredes, sin recorrer el bosque.
 if(performance.now()-ultimaOclusionCartel>200){
  ultimaOclusionCartel=performance.now();direccionCartel.copy(posicion).sub(camara3D.position);const largo=direccionCartel.length();rayoCartel.set(camara3D.position,direccionCartel.normalize());rayoCartel.far=Math.max(0,largo-1);cartelTapado=rayoCartel.intersectObjects(TIENDA.mallasParedes,false).length>0;
 }
 if(cartelTapado)return;
 cartelRanking.hidden=false;
 const escala=Math.min(1,(window.innerWidth-24)/360,window.innerHeight/(2*Math.tan(camara3D.fov*Math.PI/360))*140/(camara3D.position.distanceTo(posicion)*360));
 cartelRanking.style.left=((proyeccionCartel.x+1)*window.innerWidth/2)+'px';cartelRanking.style.top=((-proyeccionCartel.y+1)*window.innerHeight/2)+'px';cartelRanking.style.transform=`translate(-50%,-50%) scale(${escala})`;
 const cerca=distancia<TAMAÑO_CELDA*3.5;cartelRanking.setAttribute('aria-disabled',String(!cerca));document.getElementById('cartel-ranking-ayuda').textContent=cerca?(window.ControlTactil?.activo?'Tocá el cartel · Ver Top 20':'[R] o clic · Ver Top 20'):'Acercate para ver el Top 20';
 cargarCartelRanking();
}
document.addEventListener('pointerdown',e=>{
 if(!cartelRankingDisponible()||interfazBloqueada()||e.target.closest('button,input,select,textarea,dialog,#tactil-analogico'))return;
 const caja=cartelRanking.getBoundingClientRect(),x=document.pointerLockElement?innerWidth/2:e.clientX,y=document.pointerLockElement?innerHeight/2:e.clientY;
 if(x<caja.left||x>caja.right||y<caja.top||y>caja.bottom)return;
 e.preventDefault();e.stopImmediatePropagation();window.ControlTactil?.soltarTodo();abrirRanking();
},true);
