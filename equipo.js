// Catálogo de mejoras. Las cuentas reciben este catálogo y sus precios desde Supabase.
const PRODUCTOS_TIENDA = [
  {id:'basica',categoria:'cana',nombre:'Caña básica',precio:0,unidades:1,consumible:false,descripcion:'Tu equipo inicial. Sin bonificaciones.',efectos:{}},
  {id:'bambu',categoria:'cana',nombre:'Caña de Bambú',precio:150,unidades:1,consumible:false,descripcion:'Minijuegos un 15% más fáciles.',efectos:{dificultad:.85}},
  {id:'metal',categoria:'cana',nombre:'Caña de Metal',precio:500,unidades:1,consumible:false,descripcion:'Minijuegos un 25% más fáciles.',efectos:{dificultad:.75}},
  {id:'sin_cebo',categoria:'cebo',nombre:'Sin cebo',precio:0,unidades:1,consumible:false,descripcion:'Pesca sin gastar consumibles.',efectos:{}},
  {id:'lombriz',categoria:'cebo',nombre:'Lombrices',precio:35,unidades:5,consumible:true,descripcion:'5 lanzamientos. La picada llega un 30% antes.',efectos:{espera:.7}},
  {id:'marisco',categoria:'cebo',nombre:'Mariscos',precio:75,unidades:5,consumible:true,descripcion:'5 lanzamientos. Aumenta el peso de especies raras un 25% por nivel de rareza.',efectos:{atraccion:.25}},
  {id:'simple',categoria:'anzuelo',nombre:'Anzuelo simple',precio:0,unidades:1,consumible:false,descripcion:'Tu anzuelo inicial.',efectos:{}},
  {id:'precision',categoria:'anzuelo',nombre:'Anzuelo de precisión',precio:90,unidades:1,consumible:false,descripcion:'Tenés 0,15 segundos más para enganchar.',efectos:{enganche:.15}},
  {id:'reforzado',categoria:'anzuelo',nombre:'Anzuelo reforzado',precio:200,unidades:1,consumible:false,descripcion:'Reduce un 10% la dificultad del minijuego.',efectos:{dificultad:.9}},
];
function equipoInicial() { return {cana:'basica',cebo:'sin_cebo',anzuelo:'simple'}; }
let equipoPesca = equipoInicial();
let objetosPesca = {basica:1,sin_cebo:1,simple:1};
let efectosLance = {dificultad:1,espera:1,enganche:0,atraccion:0};
let operacionEquipo = false;
function productoDe(id) { return PRODUCTOS_TIENDA.find(p=>p.id===id); }
function cantidadObjeto(id) { return Math.max(0,Number(objetosPesca[id])||0); }
function sincronizarEquipoVisual() {
  tieneCañaBambu = cantidadObjeto('bambu')>0;
  cañaEquipada = equipoPesca.cana;
  if (typeof equiparCaña==='function') equiparCaña(cañaEquipada);
}
function reiniciarEquipo() {
  equipoPesca=equipoInicial();objetosPesca={basica:1,sin_cebo:1,simple:1};
  efectosLance={dificultad:1,espera:1,enganche:0,atraccion:0};
}
function aplicarEstadoEquipo(estado) {
  if (!estado || !estado.equipo || !estado.objetos) throw new Error('No se pudo cargar el equipo.');
  if (Array.isArray(estado.productos)) PRODUCTOS_TIENDA.splice(0,PRODUCTOS_TIENDA.length,...estado.productos);
  equipoPesca={...equipoInicial(),...estado.equipo};
  objetosPesca={basica:1,sin_cebo:1,simple:1,...estado.objetos};
  dinero=Number(estado.dinero);
  sincronizarEquipoVisual();
  guardarProgresoLocal();
}
async function cargarEquipoRemoto() { aplicarEstadoEquipo(await BaseDatos.estadoTienda()); }
async function comprarProducto(id) {
  if (operacionEquipo || operacionInventario) return;
  const p=productoDe(id);if(!p)return;
  operacionEquipo=true;
  try {
    if (window.modoInvitado) {
      if (!p.consumible && cantidadObjeto(id)>0) throw new Error('Ya tenés este artículo.');
      if (dinero<p.precio) throw new Error('No tenés suficiente dinero.');
      dinero-=p.precio;objetosPesca[id]=cantidadObjeto(id)+p.unidades;
      sincronizarEquipoVisual();guardarProgresoLocal();
    } else aplicarEstadoEquipo(await apiJuego('comprar_producto',{producto_id:id,token:crypto.randomUUID()}));
    mostrarMensaje('Compraste '+p.nombre+'.');mensajeComercio('Compraste '+p.nombre+'. Equipalo para usar su efecto.');
  } catch(e) { mensajeComercio(e.message,true); }
  finally { operacionEquipo=false;renderizarComercio(); }
}
async function equiparProducto(id) {
  if (operacionEquipo || operacionInventario) return;
  const p=productoDe(id);if(!p)return;
  operacionEquipo=true;
  try {
    if (window.modoInvitado) {
      if (!cantidadObjeto(id)) throw new Error('Primero comprá este artículo.');
      equipoPesca[p.categoria]=id;sincronizarEquipoVisual();guardarProgresoLocal();
    } else aplicarEstadoEquipo(await apiJuego('equipar_producto',{producto_id:id}));
    mensajeComercio('Equipaste '+p.nombre+'.');
  } catch(e) { mensajeComercio(e.message,true); }
  finally { operacionEquipo=false;renderizarComercio(); }
}
function efectosDeEquipo(equipo=equipoPesca) {
  const efecto={dificultad:1,espera:1,enganche:0,atraccion:0};
  for(const id of Object.values(equipo)){
    const e=productoDe(id)?.efectos||{};
    efecto.dificultad*=e.dificultad||1;efecto.espera*=e.espera||1;
    efecto.enganche+=e.enganche||0;efecto.atraccion+=e.atraccion||0;
  }
  return efecto;
}
async function prepararEquipoLance() {
  if (!window.modoInvitado) {
    const r=await apiJuego('preparar_pesca');aplicarEstadoEquipo(r.estado);return r.efectos;
  }
  if(!cantidadObjeto(equipoPesca.cebo))equipoPesca.cebo='sin_cebo';
  const efectos=efectosDeEquipo(),cebo=productoDe(equipoPesca.cebo);
  if(cebo.consumible){objetosPesca[cebo.id]--;if(!cantidadObjeto(cebo.id))equipoPesca.cebo='sin_cebo';}
  guardarProgresoLocal();return efectos;
}
