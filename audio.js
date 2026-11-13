// Audio original sintetizado en Web Audio: sin descargas ni recursos de terceros.
window.AudioJuego=(()=>{
 let contexto=null,salida=null,ambiente=null,musica=null,activos=[],ultimoEfecto=0;
 const estado={iniciado:false,efectos:0,ultimo:'',ambiente:false};
 function preparar(){
  if(contexto)return true;
  if(typeof p5==='undefined'||!p5.soundOut)return false;
  contexto=p5.soundOut.audiocontext;salida=p5.soundOut.input;
  return !!contexto;
 }
 function tono(frecuencia,inicio,duracion,volumen=.05,tipo='sine',destino=salida,final=frecuencia){
  const o=contexto.createOscillator(),g=contexto.createGain();o.type=tipo;o.frequency.setValueAtTime(frecuencia,inicio);o.frequency.exponentialRampToValueAtTime(Math.max(20,final),inicio+duracion);g.gain.setValueAtTime(0,inicio);g.gain.linearRampToValueAtTime(volumen,inicio+.015);g.gain.exponentialRampToValueAtTime(.0001,inicio+duracion);o.connect(g);g.connect(destino);o.start(inicio);o.stop(inicio+duracion+.03);activos.push(o);o.onended=()=>{o.disconnect();g.disconnect();activos=activos.filter(n=>n!==o)};
 }
 function ruido(duracion,inicio,volumen=.05,filtro=1100){
  const buffer=contexto.createBuffer(1,Math.ceil(contexto.sampleRate*duracion),contexto.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);
  const fuente=contexto.createBufferSource(),f=contexto.createBiquadFilter(),g=contexto.createGain();fuente.buffer=buffer;f.type='lowpass';f.frequency.value=filtro;g.gain.setValueAtTime(volumen,inicio);g.gain.exponentialRampToValueAtTime(.0001,inicio+duracion);fuente.connect(f);f.connect(g);g.connect(salida);fuente.start(inicio);activos.push(fuente);fuente.onended=()=>{fuente.disconnect();f.disconnect();g.disconnect();activos=activos.filter(n=>n!==fuente)};
 }
 function efecto(nombre){
  if(!preparar()||contexto.state!=='running'||!document.body.classList.contains('jugando')||document.hidden)return;
  const t=contexto.currentTime;if(['pulso','ui'].includes(nombre)&&t-ultimoEfecto<.06)return;ultimoEfecto=t;estado.efectos++;estado.ultimo=nombre;
  if(nombre==='lanzar'){ruido(.18,t,.045,2500);tono(420,t,.2,.022,'sine',salida,130);}
  else if(nombre==='agua'){ruido(.42,t,.07,1500);tono(180,t,.15,.025,'sine',salida,70);}
  else if(nombre==='picada'){tono(740,t,.12,.055);tono(980,t+.14,.2,.055);}
  else if(nombre==='enganchar'){tono(460,t,.1,.04);tono(690,t+.08,.18,.04);}
  else if(nombre==='captura'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tono(f,t+i*.11,.45,.05));}
  else if(nombre==='fallo'){tono(240,t,.3,.04,'triangle',salida,90);ruido(.15,t,.025,600);}
  else if(nombre==='monedas'||nombre==='compra'){[880,1175,1568].forEach((f,i)=>tono(f,t+i*.055,.17,.035,'triangle'));}
  else if(nombre==='equipar'){tono(520,t,.08,.03,'triangle');tono(780,t+.06,.1,.03,'triangle');}
  else if(nombre==='pulso'){tono(500,t,.055,.018,'triangle');}
  else tono(620,t,.06,.016);
 }
 function acorde(){
  if(!estado.iniciado||contexto?.state!=='running'||document.hidden||!document.body.classList.contains('jugando')||!opcionesGraficas.musica)return;
  const base=[130.81,146.83,164.81,196][Math.floor(Math.random()*4)],t=contexto.currentTime;
  [1,1.5,2].forEach((n,i)=>tono(base*n,t+i*.2,4.5,.012));
  if(Math.random()<.5){tono(1568,t+3,.12,.009,'sine',salida,2093);tono(1760,t+3.18,.1,.007);}
 }
 function iniciar(){
  if(estado.iniciado||!preparar()||!document.body.classList.contains('jugando')||document.hidden)return;
  estado.iniciado=true;
  const duracion=4,buffer=contexto.createBuffer(1,contexto.sampleRate*duracion,contexto.sampleRate),d=buffer.getChannelData(0);let anterior=0;
  for(let i=0;i<d.length;i++){anterior=(anterior+Math.random()*.04-.02)/1.025;d[i]=anterior*2;}
  const fuente=contexto.createBufferSource(),f=contexto.createBiquadFilter(),g=contexto.createGain();fuente.buffer=buffer;fuente.loop=true;f.type='lowpass';f.frequency.value=850;g.gain.value=.12;fuente.connect(f);f.connect(g);g.connect(salida);fuente.start();ambiente={fuente,f,g};estado.ambiente=true;acorde();musica=setInterval(acorde,7000);
 }
 function pausar(){if(musica)clearInterval(musica);musica=null;if(ambiente){ambiente.fuente.stop();ambiente.fuente.disconnect();ambiente.f.disconnect();ambiente.g.disconnect();ambiente=null;}for(const n of [...activos]){try{n.stop()}catch(_){}}activos=[];estado.iniciado=false;estado.ambiente=false;}
 function actualizar(){if(document.hidden||!document.body.classList.contains('jugando'))pausar();else iniciar();}
 function desbloquear(){if(preparar()&&contexto.state==='suspended')contexto.resume().then(actualizar).catch(()=>{});else actualizar();}
 document.addEventListener('pointerdown',desbloquear,{capture:true});document.addEventListener('keydown',desbloquear,{capture:true});document.addEventListener('visibilitychange',actualizar);
 document.addEventListener('click',e=>{if(e.target.closest('button'))efecto('ui')});
 return{estado,efecto,iniciar,pausar,actualizar,desbloquear};
})();
