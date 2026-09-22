const pantallaAuth = document.getElementById("pantalla-auth");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const tabLogin = document.getElementById("tab-login");
const tabRegistro = document.getElementById("tab-registro");
const botonesSubmit = document.querySelectorAll(".form-auth button[type=submit]");
const botonLogout = document.getElementById("boton-logout");

function mostrarRegistro() {
  formLogin.style.display = "none";
  formRegistro.style.display = "flex";
  tabLogin.classList.remove("activo");
  tabRegistro.classList.add("activo");
}

function mostrarLogin() {
  formRegistro.style.display = "none";
  formLogin.style.display = "flex";
  tabRegistro.classList.remove("activo");
  tabLogin.classList.add("activo");
}

function bloquearBotones(bloquear) {
  botonesSubmit.forEach((b) => (b.disabled = bloquear));
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("login-usuario").value;
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  bloquearBotones(true);

  try {
    const res = await fetch("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Error al iniciar sesión";
      bloquearBotones(false);
      return;
    }

    if (typeof dinero !== "undefined") dinero = data.dinero || 0;
    await ocultarAuthYArrancar(errorEl);
  } catch (err) {
    errorEl.textContent = "No se pudo conectar al servidor";
    bloquearBotones(false);
  }
});

formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("reg-usuario").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const errorEl = document.getElementById("reg-error");
  errorEl.textContent = "";
  bloquearBotones(true);

  try {
    const res = await fetch("api/registro.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Error al registrarse";
      bloquearBotones(false);
      return;
    }

    // Registro ok -> logueamos directo con el mismo usuario/contraseña
    const resLogin = await fetch("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    const dataLogin = await resLogin.json();

    if (!resLogin.ok) {
      // Se registró bien pero el auto-login falló: lo mandamos a loguearse a mano
      mostrarLogin();
      document.getElementById("login-error").textContent =
        "Cuenta creada. Iniciá sesión para continuar.";
      bloquearBotones(false);
      return;
    }

    if (typeof dinero !== "undefined") dinero = dataLogin.dinero || 0;
    await ocultarAuthYArrancar(errorEl);
  } catch (err) {
    errorEl.textContent = "No se pudo conectar al servidor";
    bloquearBotones(false);
  }
});

// Chequea si ya había una sesión activa (por ejemplo, al recargar la página)
async function revisarSesionActiva() {
  try {
    const res = await fetch("api/sesion.php");
    const data = await res.json();
    if (data.autenticado) {
      if (typeof dinero !== "undefined") dinero = data.dinero || 0;
      await ocultarAuthYArrancar(document.getElementById("login-error"));
    }
  } catch (err) {
    // sin conexión, se queda en la pantalla de login
  }
}

// Solo esconde la pantalla de auth si el juego arrancó bien.
// Si algo falla (sesión no confirmada todavía, error de red, etc.)
// se queda en la pantalla de login mostrando el error, en vez de
// dejar un canvas vacío.
async function ocultarAuthYArrancar(errorEl) {
  try {
    if (typeof iniciarJuego === "function") {
      await iniciarJuego();
    }
    pantallaAuth.style.display = "none";
    botonLogout.style.display = "block";
  } catch (err) {
    console.error("No se pudo iniciar el juego:", err);
    if (errorEl) {
      errorEl.textContent = "No se pudo cargar el juego. Probá de nuevo.";
    }
    bloquearBotones(false);
  }
}

botonLogout.addEventListener("click", async () => {
  try {
    await fetch("api/logout.php", { method: "POST" });
  } catch (err) {
    // si falla la petición, igual recargamos: la sesión expira sola
  }
  location.reload();
});

revisarSesionActiva();
