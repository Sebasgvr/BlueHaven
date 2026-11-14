// Prueba manual de transporte real. Usa exclusivamente cuentas efímeras precreadas.
const {chromium}=require('playwright'),{createClient}=require('@supabase/supabase-js'),fs=require('node:fs'),assert=require('node:assert/strict');
if(!process.env.MULTIPLAYER_FIXTURE)throw Error('Definí MULTIPLAYER_FIXTURE con las cuentas efímeras de prueba.');
const fixture=JSON.parse(fs.readFileSync(process.env.MULTIPLAYER_FIXTURE,'utf8'));
const url=process.env.SUPABASE_TEST_URL,key=process.env.SUPABASE_TEST_ANON_KEY;
if(!url||(!['localhost','127.0.0.1'].includes(new URL(url).hostname)&&process.env.ALLOW_REMOTE_TESTS!=='1'))throw Error('Usá una instancia de pruebas o habilitá explícitamente las cuentas efímeras remotas.');
(async()=>{const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'localhost,127.0.0.1'}}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const externos=[],paginas=[],errores=[];try{
 for(let i=0;i<2;i++){
  const ctx=await browser.newContext({serviceWorkers:'block',viewport:i?{width:960,height:540}:{width:390,height:844},hasTouch:true,isMobile:!i});
  const p=await ctx.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errores.push(e.message));
  await p.route('**/config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BLUEHAVEN_CONFIG='+JSON.stringify({supabaseUrl:url,supabaseKey:key})}));
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8080');await p.waitForFunction(()=>window.juegoPreparado);
  await p.fill('#login-usuario',fixture.usuarios[i].email);await p.fill('#login-password',fixture.password);await p.locator('#form-login button[type=submit]').tap();
  await p.waitForFunction(()=>document.body.classList.contains('jugando')).catch(async e=>{console.log('Acceso:',await p.locator('#login-error').innerText());throw e});console.log('Sesión '+i+' iniciada');await p.locator('#tactil-comenzar').tap();await p.waitForFunction(()=>!bienvenidaActiva());paginas.push(p);
 }
 const [a,b]=paginas;
 await a.locator('#boton-multijugador').tap();await a.locator('#sala-crear').tap();await a.waitForFunction(()=>Multijugador.estado.fase==='conectado');console.log('Sala creada');const sala=await a.evaluate(()=>JSON.parse(JSON.stringify(Multijugador.estado.sala)));
 const denegado=await b.evaluate(async info=>{const c=await BaseDatos.canalSala(info.canal,crypto.randomUUID());return new Promise(resolve=>{const timer=setTimeout(()=>{BaseDatos.cerrarCanalSala(c);resolve('TIMEOUT')},25000);c.subscribe(status=>{if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(status)){clearTimeout(timer);BaseDatos.cerrarCanalSala(c);resolve(status)}})})},sala);assert.equal(denegado,'CHANNEL_ERROR','Una cuenta sin membresía no puede suscribirse al canal privado');
 await b.locator('#boton-multijugador').tap();await b.fill('#sala-entrada',sala.codigo);await b.locator('#sala-unir').tap();await b.waitForFunction(()=>Multijugador.estado.fase==='conectado');
 console.log('Dos canales conectados');for(const p of paginas){await p.waitForFunction(()=>Multijugador.estado.sala.jugadores.length===2&&Multijugador.estado.jugadoresVisibles===1);await p.locator('#sala-volver').tap();}
 // Posición, giro, pesca y animación recibidos a través del WebSocket auténtico.
 await b.evaluate(()=>{jugador.posicion.set(1280,1760);jugador.angulo=Math.PI;});
 await a.evaluate(()=>{jugador.posicion.set(1184,1760);jugador.angulo=-Math.PI/2;});
 await b.waitForFunction(()=>{const remoto=escena3D.getObjectByName('pescador-remoto');return remoto&&Math.abs(remoto.position.x-1184)<2&&Math.abs(remoto.position.z-1760)<2});
 await a.evaluate(()=>{jugador.posicion.x=1210;jugador.angulo=.5;estadoLanzamiento='en_agua';});
 await b.waitForFunction(()=>{const r=escena3D.getObjectByName('pescador-remoto');return r&&Math.abs(r.position.x-1210)<2&&Math.abs(r.rotation.y-(-.5-Math.PI/2))<.1&&r.children.some(c=>c.geometry?.type==='CylinderGeometry'&&c.geometry.parameters.height===48&&c.visible)});
 await a.evaluate(()=>{cancelarPesca();});
 const dineroB=await b.evaluate(()=>dinero),mochilaB=await b.evaluate(()=>inventario.length);
 await a.evaluate(async()=>{await agregarPez({...CATALOGO_ESPECIES[0],calidadId:'comun',multiplicadorCalidad:1,capturaRiesgo:false});await venderTodos()});
 assert.equal(await b.evaluate(()=>dinero),dineroB);assert.equal(await b.evaluate(()=>inventario.length),mochilaB);
 // Dos plazas más y una quinta cuenta rechazada, sin pedir emails a usuarios reales.
 for(let i=2;i<5;i++){
  const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const login=await c.auth.signInWithPassword({email:fixture.usuarios[i].email,password:fixture.password});assert.equal(login.error,null);const token=crypto.randomUUID();externos.push({c,token});
  const r=await c.rpc('bh_sala',{p_accion:'unir',p_codigo:sala.codigo,p_cliente:token});if(i<4)assert.equal(r.error,null);else assert.match(r.error.message,/llena/);
 }
 // El panel no mueve al jugador y se ajusta al teléfono; copiar/cerrar no sale de la sala.
 await a.locator('#boton-multijugador').tap();await a.waitForFunction(()=>Multijugador.estado.sala.jugadores.length===4);assert.equal(await a.locator('#sala-jugadores li').count(),4);
 fs.mkdirSync(process.env.SCREENSHOT_DIR||'test-results',{recursive:true});await a.screenshot({path:(process.env.SCREENSHOT_DIR||'test-results')+'/sala-movil.png'});
 await b.screenshot({path:(process.env.SCREENSHOT_DIR||'test-results')+'/sala-avatar.png'});
 await a.locator('#sala-salir').tap();await a.waitForFunction(()=>Multijugador.estado.sala===null);await b.waitForFunction(()=>Multijugador.estado.jugadoresVisibles===0);assert.equal(await a.evaluate(()=>document.body.classList.contains('jugando')),true);
 // Volver a entrar y reabrir el transporte después de una caída real de red.
 await a.fill('#sala-entrada',sala.codigo);await a.locator('#sala-unir').tap();await a.waitForFunction(()=>Multijugador.estado.fase==='conectado');await a.locator('#sala-volver').tap();
 await a.context().setOffline(true);await a.waitForFunction(()=>Multijugador.estado.fase==='reconectando');await a.context().setOffline(false);await a.waitForFunction(()=>Multijugador.estado.fase==='conectado');await b.waitForFunction(()=>Multijugador.estado.jugadoresVisibles===1);
 await a.evaluate(()=>Multijugador.desconectar());await b.evaluate(()=>Multijugador.desconectar());assert.deepEqual(errores,[]);
 console.log('Multijugador real: 2 navegadores, WebSocket privado, avatares, movimiento, giro, pesca, economía independiente, 4 plazas, quinta rechazada, salida, reentrada y reconexión OK');
 }finally{for(const p of paginas){try{await p.evaluate(async()=>{await Multijugador.desconectar();await BaseDatos.salir()})}catch(_){}}for(const {c,token}of externos){await c.rpc('bh_sala',{p_accion:'salir',p_cliente:token});await c.auth.signOut();}await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
