const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 // Servir en subdirectorio, como GitHub Pages, y simular una versión nueva sin editar el repo.
 const raiz=path.resolve(__dirname,'..');let nueva=false,apis=0;
 const mime={'.svg':'image/svg+xml','.json':'application/json','.gltf':'model/gltf+json','.js':'text/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.gif':'image/gif'};
 const servidor=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith('/Blue-Haven/')){res.writeHead(200,{'Content-Type':'text/html'});res.end('<h1>Otro sitio</h1>');return;}
  if(u.pathname==='/Blue-Haven/api-prueba'){apis++;res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({privado:apis}));return;}
  const nombre=decodeURIComponent(u.pathname.slice('/Blue-Haven/'.length))||'index.html',archivo=path.resolve(raiz,nombre);
  if(!archivo.startsWith(raiz+path.sep)){res.writeHead(403);res.end();return;}
  let data=await fs.promises.readFile(archivo);if(nueva&&nombre==='pwa-assets.js')data=Buffer.from(data.toString().replace(/BLUEHAVEN_VERSION="[a-f0-9]+"/,'BLUEHAVEN_VERSION="prueba-actualizacion"'));
  res.writeHead(200,{'Content-Type':mime[path.extname(archivo)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
 }catch(_){res.writeHead(404);res.end();}});
 await new Promise(r=>servidor.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+servidor.address().port+'/Blue-Haven/';
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'});
  const p=await ctx.newPage();p.setDefaultTimeout(60000);const errores=[];p.on('pageerror',e=>errores.push(e.message));await p.goto(url);
  await p.waitForFunction(()=>window.juegoPreparado).catch(async e=>{console.log('PREPARAR',errores,await p.title());throw e});console.log('Juego preparado');await p.waitForFunction(()=>!!navigator.serviceWorker.controller).catch(async e=>{console.log('SW',errores,await p.evaluate(async()=>({estado:document.getElementById('instalar-archivos').textContent,registros:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,instalando:r.installing?.state,activo:r.active?.state}))})));throw e});console.log('Archivos preparados');
  const cache=await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready,c=await caches.open((await caches.keys()).find(k=>k.startsWith('bluehaven-app-')));return {scope:r.scope,urls:(await c.keys()).map(r=>r.url)}});
  assert.equal(cache.scope,url);assert.ok(cache.urls.length>70);assert.ok(cache.urls.every(u=>u.startsWith(url)));assert.ok(cache.urls.some(u=>u.endsWith('models/fishing_house/tiendaPesca.glb')));assert.ok(!cache.urls.some(u=>/\/supabase\/|\.sql|api-prueba|\.env/.test(u)));
  const manifest=await p.evaluate(async()=>await (await fetch('manifest.webmanifest')).json());assert.equal(manifest.display,'standalone');assert.equal(new URL(manifest.scope,url).href,url);assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
  const cdp=await ctx.newCDPSession(p),app=await cdp.send('Page.getAppManifest');assert.deepEqual(app.errors,[]);
  await p.locator('#instalar-acceso').tap();assert.match(await p.locator('#instalar-archivos').innerText(),/Archivos guardados/);
  await p.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.avisoInstalacion=true};e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e)});
  await p.locator('#instalar-confirmar').tap();assert.equal(await p.evaluate(()=>window.avisoInstalacion),true);assert.match(await p.locator('#instalar-estado').innerText(),/aceptada/);
  await p.locator('#instalar-cerrar').tap();
  // Nunca almacenar respuestas dinámicas del mismo origen.
  const dinamico=await p.evaluate(async()=>[await(await fetch('api-prueba')).json(),await(await fetch('api-prueba')).json()]);assert.notEqual(dinamico[0].privado,dinamico[1].privado);
  await ctx.setOffline(true);await p.goto(new URL(manifest.start_url,url).href);await p.waitForFunction(()=>window.juegoPreparado);await p.locator('#boton-invitado').tap();await p.waitForFunction(()=>document.body.classList.contains('jugando'));await p.locator('#tactil-comenzar').tap();await p.waitForFunction(()=>!bienvenidaActiva());
  console.log('Invitado offline');await p.evaluate(()=>{inventario.push({...CATALOGO_ESPECIES[0],calidadId:'comun',precio:50});dinero=123;guardarProgresoLocal()});
  await p.reload();await p.waitForFunction(()=>window.juegoPreparado);await p.locator('#boton-invitado').tap();await p.waitForFunction(()=>document.body.classList.contains('jugando'));assert.equal(await p.evaluate(()=>dinero),123);assert.equal(await p.evaluate(()=>inventario.length),1);
  await p.waitForFunction(()=>!!TIENDA.objetoMundo);assert.equal(await p.evaluate(()=>CATALOGO_ESPECIES.every(e=>!!spritesPeces[e.sprite])),true);
  // La actualización espera: no reinicia la pesca ni descarta la partida de invitado.
  await ctx.setOffline(false);await p.evaluate(()=>caches.open('bluehaven-app-%2Fotro-sitio%2F-prueba'));nueva=true;await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await p.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
  assert.equal(await p.evaluate(()=>document.body.classList.contains('jugando')),true);
  await p.evaluate(()=>{BIENVENIDA.activa=false;BIENVENIDA._saliendo=false});await p.locator('#boton-ajustes').tap();await p.locator('#instalar-ajustes').tap();await p.waitForFunction(()=>!document.getElementById('instalar-actualizar').hidden);
  await p.locator('#instalar-actualizar').tap();await p.waitForFunction(()=>!!window.juegoPreparado&&!document.body.classList.contains('jugando'));await p.waitForFunction(async()=>{const c=await caches.keys();return c.some(k=>k.endsWith('-prueba-actualizacion'))});
  await p.locator('#boton-invitado').tap();await p.waitForFunction(()=>document.body.classList.contains('jugando'));assert.equal(await p.evaluate(()=>dinero),123);assert.equal(await p.evaluate(()=>inventario.length),1);assert.deepEqual(errores,[]);
  console.log('Actualización y progreso OK');
  assert.equal(await p.evaluate(async()=>(await caches.keys()).includes('bluehaven-app-%2Fotro-sitio%2F-prueba')),true);
  // iPhone: ayuda correcta, sin prometer un aviso de instalación que Safari no ofrece.
  const ios=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});const iphone=await ios.newPage();await iphone.goto(url);iphone.setDefaultTimeout(60000);await iphone.waitForFunction(()=>window.juegoPreparado);console.log('iPhone',await iphone.title(),await iphone.locator('#instalar-acceso').count());await iphone.locator('#instalar-acceso').tap().catch(async e=>{console.log('IPHONE',await iphone.locator('#pantalla-auth').evaluate(e=>({style:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON()})));await iphone.screenshot({path:'test-results/instalar-iphone-error.png'});throw e});assert.match(await iphone.locator('#instalar-instrucciones').innerText(),/Safari.*Compartir.*pantalla de inicio/);
  fs.mkdirSync('test-results',{recursive:true});await iphone.waitForTimeout(300);await iphone.screenshot({path:'test-results/instalar-iphone.png'});
  const fuera=await ctx.newPage();await fuera.goto(new URL('/otro-sitio',url).href);assert.equal(await fuera.evaluate(()=>!!navigator.serviceWorker.controller),false);
  console.log('PWA: manifiesto, subdirectorio, 82 recursos, instalación/ayuda iPhone, invitado offline con modelos y progreso, API no cacheada, actualización voluntaria y scope aislado OK');
 }finally{await browser.close();await new Promise(r=>servidor.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
