// Único adaptador entre el juego y Supabase. El invitado no usa la red.
(() => {
  const config = window.BLUEHAVEN_CONFIG || {};
  let cliente;
  function obtenerCliente() {
    if (cliente) return cliente;
    if (!config.supabaseUrl || !config.supabaseKey) throw new Error('Falta configurar Supabase. Podés jugar como invitado.');
    cliente = SupabaseSDK.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return cliente;
  }
  function verificar(resultado) {
    if (resultado.error) {
      const codigo = resultado.error.code;
      if (codigo === 'PGRST202' || codigo === '42P01') {
        throw new Error('Falta instalar la base del juego en Supabase. Consultá la guía de configuración.');
      }
      if (codigo === 'invalid_credentials') throw new Error('Email o contraseña incorrectos.');
      if (codigo === 'email_not_confirmed') throw new Error('Confirmá tu email antes de iniciar sesión.');
      if (codigo === 'user_already_exists') throw new Error('Este email ya está registrado.');
      throw new Error(resultado.error.message || 'No se pudo completar la operación.');
    }
    return resultado.data;
  }
  async function rpc(nombre, parametros = {}) {
    return verificar(await obtenerCliente().rpc(nombre, parametros));
  }
  window.BaseDatos = {
    async entrar(email, password) {
      return verificar(await obtenerCliente().auth.signInWithPassword({ email, password })).session;
    },
    async registrar(usuario, email, password) {
      return verificar(await obtenerCliente().auth.signUp({
        email, password, options: { data: { usuario }, emailRedirectTo: location.origin + location.pathname }
      }));
    },
    async sesion() {
      return verificar(await obtenerCliente().auth.getSession()).session;
    },
    async salir() { verificar(await obtenerCliente().auth.signOut()); },
    async estado() { return rpc('bh_estado'); },
    async estadoTienda() { return rpc('bh_tienda_estado'); },
    async operar(ruta, datos) {
      switch (ruta) {
        case 'guardar_captura': return rpc('bh_guardar_captura', {
          p_pez_id: datos.pez_id, p_calidad: datos.calidad, p_riesgo: datos.riesgo, p_token: datos.captura_token
        });
        case 'comprar_producto': return rpc('bh_comprar_producto', { p_producto_id: datos.producto_id, p_token: datos.token });
        case 'equipar_producto': return rpc('bh_equipar_producto', { p_producto_id: datos.producto_id });
        case 'preparar_pesca': return rpc('bh_preparar_pesca');
        case 'vender': return rpc('bh_vender_pez', { p_inventario_id: datos.inventario_id });
        case 'vender_todos': return rpc('bh_vender_todos');
        case 'comprar_cana': return rpc('bh_comprar_cana');
        default: throw new Error('Operación desconocida.');
      }
    },
    async registrarPregunta(pregunta, respuesta) {
      return rpc('bh_registrar_pregunta', { p_pregunta: pregunta, p_respuesta: respuesta });
    },
    escucharSesion(callback) {
      return obtenerCliente().auth.onAuthStateChange(callback).data.subscription;
    }
  };
})();
