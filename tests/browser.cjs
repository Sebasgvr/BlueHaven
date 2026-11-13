const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8080');await page.waitForFunction(()=>window.juegoPreparado);
await page.click('#boton-invitado');await page.waitForFunction(()=>document.body.classList.contains('jugando'));await page.evaluate(()=>{BIENVENIDA.activa=false;BIENVENIDA._saliendo=false});
await page.waitForFunction(()=>!!TIENDA.objetoMundo);await page.waitForTimeout(500);
const stats=await page.evaluate(()=>({calls:renderizador3D.info.render.calls,terrain:escena3D.children.filter(o=>o.name.startsWith('terreno-')).length}));assert.ok(stats.terrain<40);assert.ok(stats.calls<150);console.log('Render:',stats);
const dir=process.env.SCREENSHOT_DIR||'test-results';fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:dir+'/juego.png'});
await page.keyboard.press('p');await page.click('#boton-chat');await page.locator('#chat-input').fill('¿Dónde vive el Atún?');await page.locator('#chat-form').evaluate(f=>f.requestSubmit());assert.match(await page.locator('#chat-mensajes').innerText(),/océano/);
assert.equal(await page.evaluate(()=>{const old=keyIsDown;window.keyIsDown=k=>k===87;const x=jugador.posicion.x;jugador.actualizar();window.keyIsDown=old;return jugador.posicion.x===x}),true);await page.click('#chat-cerrar');
await page.click('#boton-ajustes');assert.equal(await page.locator('#ajustes').evaluate(d=>d.open),true);await page.selectOption('#calidad-grafica','baja');await page.locator('#cerrar-ajustes').click();
await page.evaluate(()=>abrirEnciclopedia());await page.screenshot({path:dir+'/enciclopedia.png'});await page.evaluate(()=>cerrarEnciclopedia());
const result=await page.evaluate(async()=>{inventario=[];dinero=0;await agregarPez({nombre:'Atún',rareza:2,calidadId:'legendario',multiplicadorCalidad:5.5,capturaRiesgo:true});await venderTodos();await comprarCañaTienda();return{dinero,tieneCañaBambu}});assert.deepEqual(result,{dinero:774,tieneCañaBambu:true});
// Construcción, actualización y dibujo de las cinco familias de minijuegos.
for(const rareza of [1,2,3,4,5]){await page.evaluate(r=>{const pez=CATALOGO_ESPECIES.find(p=>p.rareza===r);sistemaCaptura.iniciar(pez);sistemaCaptura.elegirRiesgo(true);sistemaCaptura.pez.mecanicasActivas=calcularMecanicas({...sistemaCaptura.pez,calidadId:'legendario'},true);sistemaCaptura._crearMinijuego();sistemaCaptura.minijuego.actualizar(1/60);sistemaCaptura.minijuego.dibujar();sistemaCaptura.cancelar()},rareza)}
await page.reload();await page.waitForFunction(()=>window.juegoPreparado);await page.click('#boton-invitado');await page.waitForFunction(()=>document.body.classList.contains('jugando'));assert.equal(await page.evaluate(()=>dinero),774);assert.equal(await page.evaluate(()=>tieneCañaBambu),true);assert.deepEqual(errors,[]);
console.log('Navegador: arranque, chat, controles, ajustes, enciclopedia, cinco minijuegos y persistencia OK');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
