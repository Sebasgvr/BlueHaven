const{chromium}=require('playwright'),{createClient}=require('@supabase/supabase-js'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.SUPABASE_TEST_URL,key=process.env.SUPABASE_TEST_ANON_KEY;
if(!url||!key)throw Error('Falta la instancia de pruebas.');const local=['localhost','127.0.0.1'].includes(new URL(url).hostname);
if(!local&&process.env.ALLOW_REMOTE_TESTS!=='1')throw Error('Solo pruebas locales o cuentas efímeras remotas explícitas.');
(async()=>{
 let fixture=process.env.CHAT_FIXTURE?JSON.parse(fs.readFileSync(process.env.CHAT_FIXTURE,'utf8')):null;
 if(!fixture){if(!local)throw Error('No crear cuentas remotas por email');fixture={password:'chat-browser-pass-123',usuarios:[]};for(let i=0;i<2;i++){const email=`chatbrowser${i}_${Date.now()}@gmail.com`,c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const r=await c.auth.signUp({email,password:fixture.password,options:{data:{usuario:'Pescador Chat '+i}}});assert.equal(r.error,null);fixture.usuarios.push({email});}}
 const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const paginas=[],errores=[];
 try{
  for(let i=0;i<2;i++){
   const p=await b.newPage({serviceWorkers:'block',viewport:i?{width:960,height:540}:{width:390,height:844},hasTouch:true,isMobile:!i});p.setDefaultTimeout(60000);p.on('pageerror',e=>errores.push(e.message));
   await p.route('**/config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BLUEHAVEN_CONFIG='+JSON.stringify({supabaseUrl:url,supabaseKey:key})}));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8080');await p.waitForFunction(()=>window.juegoPreparado);
   if(process.env.CHAT_FAKE_REALTIME==='1')await p.evaluate(()=>{window.chatAvisosPrueba={};BaseDatos.canalSala=async()=>({state:'joined',on(tipo,filtro,callback){if(tipo==='broadcast')window.chatAvisosPrueba[filtro.event]=callback;return this},subscribe(cb){queueMicrotask(()=>cb('SUBSCRIBED'));return this},async track(){},presenceState(){return{}},async send(){return'ok'}});BaseDatos.cerrarCanalSala=async()=>{}});
   await p.fill('#login-usuario',fixture.usuarios[i].email);await p.fill('#login-password',fixture.password);await p.locator('#form-login button[type=submit]').tap();await p.waitForFunction(()=>document.body.classList.contains('jugando'));await p.locator('#tactil-comenzar').tap();await p.waitForFunction(()=>!bienvenidaActiva());paginas.push(p);
  }
  const[a,c]=paginas;assert.equal(await a.locator('#boton-chat-sala').isVisible(),false);
  await a.locator('#boton-multijugador').tap();await a.locator('#sala-crear').tap();await a.waitForFunction(()=>Multijugador.estado.fase==='conectado');const codigo=await a.evaluate(()=>Multijugador.estado.sala.codigo);await a.locator('#sala-volver').tap();
  await c.locator('#boton-multijugador').tap();await c.fill('#sala-entrada',codigo);await c.locator('#sala-unir').tap();await c.waitForFunction(()=>Multijugador.estado.fase==='conectado');await c.locator('#sala-volver').tap();
  await a.locator('#boton-chat-sala').tap();await c.locator('#boton-chat-sala').tap();
  const antes=await a.evaluate(()=>[jugador.posicion.x,jugador.posicion.y]);await a.keyboard.press('w');assert.deepEqual(await a.evaluate(()=>[jugador.posicion.x,jugador.posicion.y]),antes);assert.equal(await a.evaluate(()=>interfazBloqueada()),true);
  await a.fill('#chat-sala-texto','Hola desde el lago');await a.locator('#chat-sala-enviar').tap();if(process.env.CHAT_FAKE_REALTIME==='1')await c.evaluate(()=>chatAvisosPrueba.chat_aviso({payload:{nombre:'Falso',texto:'Mensaje falsificado'}}));await c.waitForFunction(()=>document.getElementById('chat-sala-mensajes').textContent.includes('Hola desde el lago'));
  assert.match(await a.locator('#chat-sala-mensajes').innerText(),/\(vos\)/);assert.doesNotMatch(await c.locator('#chat-sala-mensajes').innerText(),/\(vos\)|Mensaje falsificado/);
  await c.fill('#chat-sala-texto','sos un p3lotud0');await c.locator('#chat-sala-enviar').tap();assert.match(await c.locator('#chat-sala-estado').innerText(),/no permitidas/);assert.equal(await a.locator('#chat-sala-mensajes li').count(),1);
  await c.fill('#chat-sala-texto','<img src=x onerror=alert(1)>');await c.locator('#chat-sala-enviar').tap();await a.waitForFunction(()=>document.getElementById('chat-sala-mensajes').textContent.includes('<img'));assert.equal(await a.locator('#chat-sala-mensajes img').count(),0);
  await a.locator('#chat-sala-cerrar').tap();await c.waitForTimeout(1100);await c.fill('#chat-sala-texto','Te espero junto a la tienda');await c.locator('#chat-sala-enviar').tap();await a.waitForFunction(()=>/\(1\)/.test(document.getElementById('boton-chat-sala').textContent));
  await a.keyboard.press('t');await a.waitForFunction(()=>document.getElementById('chat-sala').open);assert.equal(await a.locator('#boton-chat-sala').innerText(),'💬 Chat');assert.equal(await a.locator('#chat-sala-texto').inputValue(),'');
  fs.mkdirSync('test-results',{recursive:true});await a.screenshot({path:'test-results/chat-sala-movil.png'});await a.setViewportSize({width:390,height:420});await a.waitForFunction(()=>document.getElementById('chat-sala').getBoundingClientRect().bottom<=innerHeight);await a.setViewportSize({width:390,height:844});
  await a.locator('#chat-sala-cerrar').tap();await a.locator('#boton-multijugador').tap();await a.locator('#sala-salir').tap();assert.equal(await a.locator('#boton-chat-sala').isVisible(),false);assert.equal(await a.locator('#chat-sala-mensajes li').count(),0);
  await a.locator('#sala-crear').tap();await a.waitForFunction(()=>Multijugador.estado.fase==='conectado');await a.locator('#sala-volver').tap();await a.locator('#boton-chat-sala').tap();assert.equal(await a.locator('#chat-sala-mensajes li').count(),0);assert.deepEqual(errores,[]);
  console.log('Chat navegador: dos cuentas, mensajes, nombres, movimiento bloqueado, ofensas, HTML literal, no leídos, T, móvil y limpieza entre salas OK'+(process.env.CHAT_FAKE_REALTIME==='1'?' (RPC real, transporte simulado)':' (Realtime real)'));
 }finally{for(const p of paginas){try{await p.evaluate(async()=>{await Multijugador.desconectar();await BaseDatos.salir()})}catch(_){}}await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
