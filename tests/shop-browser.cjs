const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const p=await b.newPage({serviceWorkers:'block',viewport:{width:960,height:640}});p.setDefaultTimeout(60000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.TEST_URL||'http://127.0.0.1:8080');await p.waitForFunction(()=>window.juegoPreparado);await p.click('#boton-invitado');await p.waitForFunction(()=>document.body.classList.contains('jugando'));await p.waitForFunction(()=>!!TIENDA.objetoMundo);
await p.evaluate(()=>{BIENVENIDA.activa=false;BIENVENIDA._saliendo=false;jugador.posicion.set(TAMAÑO_CELDA*32,TAMAÑO_CELDA*19);dinero=900;inventario=[]});
const exterior=await p.evaluate(()=>jugador.posicion.array());
console.log('entry',await p.evaluate(()=>({near:cercaDeTienda(),interior:puntoInteriorTienda()?.array()})));
await p.keyboard.press('e');await p.waitForFunction(()=>document.getElementById('comercio').open);assert.notDeepEqual(await p.evaluate(()=>jugador.posicion.array()),exterior);assert.equal(await p.evaluate(()=>tiendaColisiona(jugador.posicion)),false);
const dir=process.env.SCREENSHOT_DIR||'test-results';fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:dir+'/tienda-inicio.png'});
await p.getByRole('button',{name:'Vender peces',exact:true}).click();assert.match(await p.locator('#comercio-contenido').innerText(),/vacía/);
await p.getByRole('button',{name:'Comprar',exact:true}).click();await p.locator('[data-producto="metal"] [data-accion="comprar"]').click();await p.waitForFunction(()=>dinero===400);await p.locator('[data-producto="metal"] [data-accion="equipar"]').click();await p.waitForFunction(()=>equipoPesca.cana==='metal');
await p.getByRole('button',{name:'Cebos',exact:true}).click();await p.locator('[data-producto="lombriz"] [data-accion="comprar"]').click();await p.locator('[data-producto="lombriz"] [data-accion="equipar"]').click();
await p.getByRole('button',{name:'Anzuelos',exact:true}).click();await p.locator('[data-producto="precision"] [data-accion="comprar"]').click();await p.locator('[data-producto="precision"] [data-accion="equipar"]').click();
assert.equal(await p.evaluate(()=>dinero),275);await p.screenshot({path:dir+'/tienda-anzuelos.png'});
await p.getByRole('button',{name:'Seguir explorando'}).click();assert.equal(await p.evaluate(()=>document.getElementById('comercio').open),false);assert.deepEqual(await p.evaluate(()=>jugador.posicion.array()),exterior);assert.equal(await p.evaluate(()=>TIENDA.regreso),null);
await p.evaluate(()=>{jugador.posicion.set(TAMAÑO_CELDA*18.5,TAMAÑO_CELDA*27.5);jugador.angulo=-Math.PI/2;jugador.inclinacion=0});await p.keyboard.press('f');await p.waitForFunction(()=>estadoLanzamiento==='lanzando');
assert.equal(await p.evaluate(()=>objetosPesca.lombriz),4);assert.equal(await p.evaluate(()=>efectosLance.dificultad),.75);assert.equal(await p.evaluate(()=>efectosLance.enganche),.15);
await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.keyboard.press('i');await p.waitForFunction(()=>document.getElementById('comercio').open);assert.equal(await p.locator('[data-accion="comprar"]').count(),0);await p.keyboard.press('Escape');
await p.reload();await p.waitForFunction(()=>window.juegoPreparado);await p.click('#boton-invitado');await p.waitForFunction(()=>document.body.classList.contains('jugando'));assert.equal(await p.evaluate(()=>equipoPesca.cana),'metal');assert.equal(await p.evaluate(()=>objetosPesca.lombriz),4);assert.equal(await p.evaluate(()=>dinero),275);
await p.evaluate(()=>{BIENVENIDA.activa=false;BIENVENIDA._saliendo=false;jugador.posicion.set(TAMAÑO_CELDA*32,TAMAÑO_CELDA*19)});await p.keyboard.press('e');await p.waitForFunction(()=>document.getElementById('comercio').open);await p.getByRole('button',{name:'Salir de la tienda',exact:true}).click();assert.equal(await p.evaluate(()=>TIENDA.regreso),null);
// Reproduce salir -> reabrir -> seguir explorando sin dejar un regreso antiguo.
const origen=await p.evaluate(()=>({pos:jugador.posicion.array(),angulo:jugador.angulo,inclinacion:jugador.inclinacion}));
for(const cierre of ['explorar','salir','Escape','nativo']){
 await p.keyboard.press('e');await p.waitForFunction(()=>document.getElementById('comercio').open);
 if(cierre==='Escape')await p.keyboard.press('Escape');
 else if(cierre==='nativo')await p.evaluate(()=>dialogoComercio.close());
 else await p.locator('#comercio-'+cierre).click();
 await p.waitForFunction(()=>!document.getElementById('comercio').open&&TIENDA.regreso===null);
 assert.deepEqual(await p.evaluate(()=>({pos:jugador.posicion.array(),angulo:jugador.angulo,inclinacion:jugador.inclinacion})),origen,cierre);
}
// Un close antiguo no puede cerrar ni devolver una tienda recién abierta.
await p.evaluate(()=>{abrirMenuTienda();cerrarComercio();abrirMenuTienda()});
await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>dialogoComercio.open&&menuTienda==='comercio'&&!!TIENDA.regreso),true);
await p.locator('#comercio-explorar').click();assert.deepEqual(await p.evaluate(()=>jugador.posicion.array()),origen.pos);
await p.keyboard.press('i');await p.waitForFunction(()=>document.getElementById('comercio').open);await p.locator('#comercio-explorar').click();assert.deepEqual(await p.evaluate(()=>jugador.posicion.array()),origen.pos,'Cerrar mochila no mueve al jugador');
// La guía bloquea antes de mostrar el texto del usuario o intentar guardarlo.
await p.evaluate(()=>{window.__preguntasGuardadas=0;BaseDatos.registrarPregunta=async()=>{window.__preguntasGuardadas++};window.modoInvitado=false;preguntar('sos un p.u.t.o')});
assert.equal(await p.evaluate(()=>window.__preguntasGuardadas),0);
assert.equal(await p.locator('body').innerText().then(t=>t.includes('sos un p.u.t.o')),false);
assert.deepEqual(errors,[]);console.log('Tienda: entrada sin peces, comprar/vender, tres categorías, efectos, consumo, equipo, recarga y salida OK');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
