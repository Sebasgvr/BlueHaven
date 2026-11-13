window.modoInvitado = false;
window.sesionUsuario = null;
window.partidaId = 0;
const pantallaAuth = document.getElementById('pantalla-auth');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const botonesSubmit = document.querySelectorAll('.form-auth button[type=submit]');
const botonLogout = document.getElementById('boton-logout');
let entrando = false;
function mostrarRegistro() {
  formLogin.style.display = 'none'; formRegistro.style.display = 'flex';
  tabLogin.classList.remove('activo'); tabRegistro.classList.add('activo');
}
function mostrarLogin() {
  formRegistro.style.display = 'none'; formLogin.style.display = 'flex';
  tabRegistro.classList.remove('activo'); tabLogin.classList.add('activo');
}
function bloquearBotones(valor) {
  botonesSubmit.forEach(b => b.disabled = valor);
  document.getElementById('boton-invitado').disabled = valor;
}
async function entrarConSesion(sesion, errorEl) {
  if (entrando || document.body.classList.contains('jugando')) return;
  try { FiltrosCuentas.validarEmail(sesion.user.email); }
  catch(err) { await BaseDatos.salir();if(errorEl)errorEl.textContent=err.message;return; }
  entrando = true; bloquearBotones(true);
  window.partidaId++;
  window.modoInvitado = false;
  window.sesionUsuario = { usuario_id: sesion.user.id };
  try { await ocultarAuthYArrancar(errorEl); }
  finally { entrando = false; bloquearBotones(false); }
}
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error'); errorEl.textContent = '';
  bloquearBotones(true);
  try {
    FiltrosCuentas.validarEmail(document.getElementById('login-usuario').value);
    capturarCursor();
    const sesion = await BaseDatos.entrar(document.getElementById('login-usuario').value.trim(), document.getElementById('login-password').value);
    await entrarConSesion(sesion, errorEl);
  } catch (err) { errorEl.textContent = err.message; }
  finally { bloquearBotones(false); }
});
formRegistro.addEventListener('submit', async e => {
  e.preventDefault();
  const errorEl = document.getElementById('reg-error'); errorEl.textContent = '';
  bloquearBotones(true);
  try {
    FiltrosCuentas.validarEmail(document.getElementById('reg-email').value);
    FiltrosCuentas.validarNombre(document.getElementById('reg-usuario').value);
    capturarCursor();
    const datos = await BaseDatos.registrar(document.getElementById('reg-usuario').value.trim(), document.getElementById('reg-email').value.trim(), document.getElementById('reg-password').value);
    if (datos.session) await entrarConSesion(datos.session, errorEl);
    else {
      mostrarLogin();
      document.getElementById('login-usuario').value = document.getElementById('reg-email').value;
      document.getElementById('login-error').textContent = 'Revisá tu email y confirmá la cuenta. Después podés iniciar sesión.';
    }
  } catch (err) { errorEl.textContent = err.message; }
  finally { bloquearBotones(false); }
});
async function ocultarAuthYArrancar(errorEl) {
  try {
    if (!window.juegoPreparado) {
      await new Promise(resolve => window.addEventListener('juego-preparado', resolve, { once: true }));
    }
    await iniciarJuego();
    pantallaAuth.style.display = 'none'; botonLogout.style.display = 'block';
    cursorLibre=false;capturarCursor();
    document.body.classList.add('jugando'); window.AudioJuego?.iniciar(); document.getElementById('barra-juego').hidden = false;
    botonLogout.textContent = window.modoInvitado ? 'Salir de invitado' : 'Cerrar sesión';
  } catch (err) {
    if (errorEl) errorEl.textContent = err.message || 'No se pudo cargar tu partida. Reintentá.';
    bloquearBotones(false);
  }
}
function volverAlAcceso(mensaje = '') {
  window.partidaId++;
  window.AudioJuego?.pausar();
  window.ControlTactil?.soltarTodo();
  document.getElementById('ranking')?.close();
  document.getElementById('libro-movil')?.close();
  if (typeof noLoop === 'function' && window.juegoPreparado) noLoop();
  if (document.pointerLockElement) document.exitPointerLock();
  if (typeof cerrarChat === 'function') cerrarChat();
  document.getElementById('ajustes').close();
  document.getElementById('tarjeta-captura')?.close();
  if(typeof dialogoComercio!=='undefined')dialogoComercio.close();
  document.body.classList.remove('jugando'); document.body.classList.remove('chat-saludado');
  document.getElementById('chat-mensajes').replaceChildren();
  document.getElementById('barra-juego').hidden = true;
  pantallaAuth.style.display = ''; botonLogout.style.display = 'none';
  window.sesionUsuario = null; window.modoInvitado = false;
  if (window.juegoPreparado) {
    sistemaCaptura.cancelar(); retraerAnzuelo(); menuTienda = 'cerrado'; cerrarEnciclopedia();
    reiniciarEstadoEnMemoria(); clear();
  }
  mostrarLogin(); document.getElementById('login-error').textContent = mensaje;
}
botonLogout.addEventListener('click', async () => {
  botonLogout.disabled = true;
  try {
    if (!window.modoInvitado) await BaseDatos.salir();
    volverAlAcceso();
  } catch (err) { estadoGuardado('No se pudo cerrar sesión: ' + err.message); }
  finally { botonLogout.disabled = false; }
});
document.getElementById('boton-invitado').addEventListener('click', async () => {
  if (entrando) return;
  capturarCursor();
  window.partidaId++;
  window.modoInvitado = true; window.sesionUsuario = null;
  await ocultarAuthYArrancar(document.getElementById('login-error'));
});
(async () => {
  try {
    const sesion = await BaseDatos.sesion();
    if (sesion && !window.modoInvitado) await entrarConSesion(sesion, document.getElementById('login-error'));
    BaseDatos.escucharSesion(evento => {
      if (evento === 'SIGNED_OUT' && !window.modoInvitado && document.body.classList.contains('jugando')) {
        volverAlAcceso('Tu sesión se cerró. Iniciá sesión para continuar.');
      }
    });
  } catch (err) {
    if (!window.modoInvitado) document.getElementById('login-error').textContent = err.message;
  }
})();

for(const campo of ['login-usuario','reg-email','reg-usuario']) {
  const entrada=document.getElementById(campo);
  entrada.addEventListener('input',()=>entrada.setCustomValidity(''));
  entrada.addEventListener('blur',()=>{try{if(entrada.value)(campo==='reg-usuario'?FiltrosCuentas.validarNombre: FiltrosCuentas.validarEmail)(entrada.value);entrada.setCustomValidity('');}catch(err){entrada.setCustomValidity(err.message);}});
}

document.getElementById('dominios-permitidos').textContent=FiltrosCuentas.dominios.join(' · ');
