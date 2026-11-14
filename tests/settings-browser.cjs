const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1000,height:800}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8080');await page.waitForFunction(()=>window.juegoPreparado);await page.click('#boton-invitado');await page.waitForFunction(()=>document.body.classList.contains('jugando'));
await page.waitForFunction(()=>!!document.pointerLockElement);await page.evaluate(()=>{BIENVENIDA.activa=false;BIENVENIDA._saliendo=false});
await page.keyboard.press('p');await page.waitForFunction(()=>!document.pointerLockElement);assert.equal(await page.locator('#ajustes').evaluate(d=>d.open),false);
await page.keyboard.press('p');await page.waitForFunction(()=>!!document.pointerLockElement);
await page.keyboard.press('Escape');await page.waitForFunction(()=>document.getElementById('ajustes').open);assert.equal(await page.locator('#ajustes #boton-logout').count(),1);
await page.locator('#volumen-general').evaluate(e=>{e.value='35';e.dispatchEvent(new Event('input',{bubbles:true}))});await page.check('#silenciar-audio');
assert.equal(await page.evaluate(()=>opcionesGraficas.volumen),.35);assert.equal(await page.evaluate(()=>p5.soundOut.output.gain.value),0);
await page.uncheck('#silenciar-audio');assert.ok(Math.abs(await page.evaluate(()=>p5.soundOut.output.gain.value)-.35)<.001);
await page.click('#cerrar-ajustes');await page.waitForFunction(()=>!!document.pointerLockElement);
await page.keyboard.down('w');await page.keyboard.press('q');await page.waitForFunction(()=>window.chatAbierto);const pos=await page.evaluate(()=>jugador.posicion.array());await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>jugador.posicion.array()),pos);await page.keyboard.up('w');
await page.locator('#chat-input').fill('wasd p');await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>jugador.posicion.array()),pos);
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.chatAbierto),false);assert.equal(await page.locator('#ajustes').evaluate(d=>d.open),false);
await page.keyboard.press('Escape');await page.click('#boton-logout');await page.waitForFunction(()=>!document.body.classList.contains('jugando'));
await page.reload();await page.waitForFunction(()=>window.juegoPreparado);assert.equal(await page.evaluate(()=>opcionesGraficas.volumen),.35);assert.equal(await page.locator('#volumen-general').inputValue(),'35');assert.deepEqual(errors,[]);
console.log('Ajustes: cursor inicial, P, Esc, volumen real, silencio, persistencia, chat sin movimiento y salida OK');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
