// Interfaz de tienda compartida por cuentas e invitados.
const comercio = { pagina:'inicio', categoria:'cana', modo:'tienda', mensaje:'', error:false };
const dialogoComercio=document.createElement('dialog');
dialogoComercio.id='comercio';dialogoComercio.setAttribute('aria-labelledby','comercio-titulo');
dialogoComercio.innerHTML=`<header class="comercio-cabecera"><div><small id="comercio-subtitulo">BLUE HAVEN · EQUIPAMIENTO</small><h2 id="comercio-titulo">La tienda del muelle</h2></div><div class="comercio-saldo" id="comercio-saldo"></div></header><nav id="comercio-navegacion" aria-label="Secciones de la tienda"></nav><div id="comercio-contenido"></div><p id="comercio-mensaje" role="status" aria-live="polite"></p><footer><button type="button" id="comercio-explorar">Seguir explorando</button><button type="button" id="comercio-salir">Salir de la tienda</button></footer>`;
document.body.appendChild(dialogoComercio);
function botonComercio(texto,accion,clase='') {
  const b=document.createElement('button');b.type='button';b.textContent=texto;b.className=clase;
  b.addEventListener('click',accion);return b;
}
function mensajeComercio(texto,error=false) { comercio.mensaje=texto;comercio.error=error;renderizarComercio(); }
function abrirComercio(modo='tienda') {
  if (typeof preparandoLance!=='undefined'&&preparandoLance)return;
  if(document.pointerLockElement)document.exitPointerLock();
  comercio.modo=modo;comercio.pagina=modo==='tienda'?'inicio':'comprar';comercio.mensaje='';
  menuTienda='comercio';renderizarComercio();dialogoComercio.showModal();
}
function cerrarComercio() { dialogoComercio.close();menuTienda='cerrado'; }
dialogoComercio.addEventListener('close',()=>{menuTienda='cerrado'});
document.getElementById('comercio-explorar').addEventListener('click',cerrarComercio);
document.getElementById('comercio-salir').addEventListener('click',()=>{cerrarComercio();salirDeLaTienda()});
function cambiarPaginaComercio(pagina){comercio.pagina=pagina;comercio.mensaje='';renderizarComercio();}
function renderizarComercio() {
  if(typeof dinero==='undefined')return;
  const contenido=document.getElementById('comercio-contenido'),nav=document.getElementById('comercio-navegacion');
  contenido.replaceChildren();nav.replaceChildren();
  document.getElementById('comercio-titulo').textContent=comercio.modo==='tienda'?'La tienda del muelle':'Tu equipo de pesca';
  document.getElementById('comercio-saldo').textContent='$'+dinero;
  document.getElementById('comercio-salir').hidden=comercio.modo!=='tienda';
  document.getElementById('comercio-explorar').textContent=comercio.modo==='tienda'?'Seguir explorando':'Cerrar mochila';
  const status=document.getElementById('comercio-mensaje');status.textContent=comercio.mensaje;status.classList.toggle('error',comercio.error);
  const ocupado=operacionEquipo||operacionInventario;
  const opciones=comercio.modo==='tienda'?[['inicio','Inicio'],['comprar','Comprar'],['vender','Vender']]:[['comprar','Equipo'],['mochila','Peces']];
  for(const [id,texto] of opciones){const b=botonComercio(texto,()=>cambiarPaginaComercio(id));b.setAttribute('aria-current',String(comercio.pagina===id));nav.append(b)}
  if(comercio.pagina==='inicio'){
    const texto=document.createElement('p');texto.className='comercio-bienvenida';texto.textContent='¡Bienvenido! Elegí comprar equipo o vender tus capturas. Podés entrar aunque tu mochila esté vacía.';contenido.append(texto);
    const acciones=document.createElement('div');acciones.className='comercio-opciones';
    acciones.append(botonComercio('Comprar equipo',()=>cambiarPaginaComercio('comprar'),'comercio-accion'),botonComercio('Vender peces',()=>cambiarPaginaComercio('vender'),'comercio-accion'));contenido.append(acciones);
    const ayuda=document.createElement('p');ayuda.textContent='Las cañas y los anzuelos son permanentes. Cada cebo comprado alcanza para cinco lanzamientos al agua.';contenido.append(ayuda);return;
  }
  if(comercio.pagina==='comprar'){
    const tabs=document.createElement('div');tabs.className='comercio-categorias';
    for(const [id,nombre] of [['cana','Cañas'],['cebo','Cebos'],['anzuelo','Anzuelos']]){const b=botonComercio(nombre,()=>{comercio.categoria=id;renderizarComercio()});b.setAttribute('aria-pressed',String(comercio.categoria===id));tabs.append(b)}contenido.append(tabs);
    const lista=document.createElement('div');lista.className='comercio-productos';
    for(const p of PRODUCTOS_TIENDA.filter(p=>p.categoria===comercio.categoria)){
      const card=document.createElement('article');card.className='comercio-producto';card.dataset.producto=p.id;
      const info=document.createElement('div'),nombre=document.createElement('h3'),desc=document.createElement('p'),stock=document.createElement('small');
      nombre.textContent=p.nombre;desc.textContent=p.descripcion;stock.textContent=(equipoPesca[p.categoria]===p.id?'Equipado · ':'')+(p.consumible?cantidadObjeto(p.id)+' unidades disponibles':cantidadObjeto(p.id)?'En tu equipo':'Sin comprar');info.append(nombre,desc,stock);
      const acciones=document.createElement('div');acciones.className='comercio-producto-acciones';
      if(comercio.modo==='tienda'&&p.precio>0){const b=botonComercio('Comprar '+(p.consumible?'×'+p.unidades+' ':'')+'$'+p.precio,()=>comprarProducto(p.id));b.dataset.accion='comprar';b.disabled=ocupado||dinero<p.precio||(!p.consumible&&cantidadObjeto(p.id)>0);acciones.append(b)}
      const equipar=botonComercio(equipoPesca[p.categoria]===p.id?'Equipado':'Equipar',()=>equiparProducto(p.id));equipar.dataset.accion='equipar';equipar.disabled=ocupado||!cantidadObjeto(p.id)||equipoPesca[p.categoria]===p.id;acciones.append(equipar);card.append(info,acciones);lista.append(card);
    }
    contenido.append(lista);return;
  }
  if(!inventario.length){const vacio=document.createElement('p');vacio.className='comercio-vacio';vacio.textContent='Tu mochila está vacía. Podés ir a Comprar para preparar tu próxima salida de pesca.';contenido.append(vacio);return;}
  for(const [i,pez] of inventario.entries()){
    const fila=document.createElement('article');fila.className='comercio-producto';
    const info=document.createElement('div'),nombre=document.createElement('h3'),detalle=document.createElement('p');nombre.textContent=pez.nombre;detalle.textContent=calidadDe(pez).nombre+' · $'+precioDe(pez);const retrato=document.createElement('img');retrato.className='comercio-pez';retrato.src='textures/peces/'+SPRITES_ESPECIES[pez.nombre];retrato.alt=pez.nombre;info.prepend(retrato);info.append(nombre,detalle);fila.append(info);
    if(comercio.pagina==='vender'){const b=botonComercio('Vender $'+precioDe(pez),async()=>{await venderPez(i);renderizarComercio()});b.disabled=ocupado;fila.append(b)}contenido.append(fila);
  }
  if(comercio.pagina==='vender'){const b=botonComercio('Vender todo · $'+valorTotalInventario(),async()=>{await venderTodos();renderizarComercio()});b.disabled=ocupado;b.className='comercio-vender-todo';contenido.append(b)}
}
