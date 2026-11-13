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
function abrirRanking(){if(interfazBloqueada()||bienvenidaActiva())return;sistemaCaptura.soltarBoton();dialogoRanking.showModal();if(document.pointerLockElement)document.exitPointerLock();cargarRanking();}
dialogoRanking.querySelectorAll('[data-ranking]').forEach(b=>b.addEventListener('click',()=>{criterioRanking=b.dataset.ranking;cargarRanking()}));
document.getElementById('ranking-actualizar').addEventListener('click',cargarRanking);
document.getElementById('ranking-cerrar').addEventListener('click',()=>{dialogoRanking.close();if(!cursorLibre)capturarCursor()});
dialogoRanking.addEventListener('close',()=>{peticionRanking++});
document.getElementById('boton-ranking').addEventListener('click',abrirRanking);
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&!e.repeat&&!e.target.closest('input,textarea,select,[contenteditable="true"]'))abrirRanking();});
