const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_ANON_KEY;
if (!url || !key) throw new Error('Definí SUPABASE_TEST_URL y SUPABASE_TEST_ANON_KEY de una instancia de pruebas.');
if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname) && process.env.ALLOW_REMOTE_TESTS !== '1') throw new Error('Este test crea cuentas. Usá el stack local de pruebas.');
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
async function rpc(c, name, args) {
  const { data, error } = await c.rpc(name, args);
  if (error) throw new Error(name + ': ' + error.message);
  return data;
}
(async () => {
  const a = client(), b = client(), anon = client();
  const stamp = Date.now();
  const sign = async (c, name) => {
    const { data, error } = await c.auth.signUp({ email: `${name}_${stamp}@gmail.com`, password: 'test-pass-123', options: { data: { usuario: name } } });
    assert.equal(error, null); assert.ok(data.session, 'El stack de pruebas debe autoconfirmar emails.');
    return data.user.id;
  };
  for(const [email,usuario] of [[`bloqueado_${stamp}@example.com`,'Pescador'],[`bloqueado_${stamp}@gmail.com.evil.test`,'Pescador'],[`nombre_${stamp}@gmail.com`,'P3LOTUD0'],[`puto${stamp}@gmail.com`,'Pescador']]) {
    const rechazado=await client().auth.signUp({email,password:'test-pass-123',options:{data:{usuario}}});assert.ok(rechazado.error,'Debe rechazar el registro directo: '+email);assert.equal(rechazado.data.user,null);
  }
  const idA = await sign(a, 'pescadorA'); await sign(b, 'pescadorB');
  await sign(client(),'Maricarmen');
  assert.ok((await a.auth.updateUser({data:{usuario:'p.u.t.o'}})).error,'No debe permitir eludir el filtro cambiando metadata');
  assert.equal((await a.auth.getUser()).data.user.user_metadata.usuario,'pescadorA');
  let estado = await rpc(a, 'bh_estado'); assert.equal(estado.perfil.usuario_id, idA); assert.equal(estado.catalogo.length, 9);
  const atun = estado.catalogo.find(p => p.nombre === 'Atún'), globo = estado.catalogo.find(p => p.nombre === 'Pez Globo');
  const captura = { p_pez_id: atun.id, p_calidad: 'legendario', p_riesgo: true, p_token: crypto.randomUUID() };
  const pez = await rpc(a, 'bh_guardar_captura', captura); assert.equal(pez.precio, 924); assert.ok(pez.inventario_id);
  assert.equal((await rpc(a, 'bh_guardar_captura', captura)).inventario_id, pez.inventario_id);
  estado = await rpc(a, 'bh_estado'); assert.equal(estado.inventario.length, 1); assert.equal(estado.inventario[0].calidadId, 'legendario');
  // RLS y permisos: otro jugador no ve los peces ni puede modificar el saldo.
  const ajeno = await b.from('inventario_peces').select('*').eq('usuario_id', idA); assert.deepEqual(ajeno.data, []);
  assert.ok((await a.from('perfiles').update({ dinero: 999999 }).eq('usuario_id', idA)).error);
  assert.ok((await a.from('inventario_peces').insert({ usuario_id: idA, pez_id: atun.id, calidad_id: 'comun', precio: 1 })).error);
  assert.ok((await b.rpc('bh_vender_pez', { p_inventario_id: pez.inventario_id })).error);
  assert.ok((await anon.rpc('bh_estado')).error);
  assert.ok((await anon.from('perfiles').select('*')).error);
  const ventas = await Promise.all([a.rpc('bh_vender_pez', { p_inventario_id: pez.inventario_id }), a.rpc('bh_vender_pez', { p_inventario_id: pez.inventario_id })]);
  assert.equal(ventas.filter(v => !v.error).length, 1);
  assert.equal((await rpc(a, 'bh_comprar_cana')).dinero, 774);
  assert.equal((await rpc(a, 'bh_comprar_cana')).dinero, 774);
  for (let i = 0; i < 11; i++) await rpc(a, 'bh_guardar_captura', { p_pez_id: globo.id, p_calidad: 'comun', p_riesgo: false, p_token: crypto.randomUUID() });
  estado = await rpc(a, 'bh_estado'); assert.equal(estado.inventario.length, 10); assert.equal(estado.catalogo.find(p => p.nombre === 'Pez Globo').cantidad_capturada, 11);
  const venta = await rpc(a, 'bh_vender_todos'); assert.equal(venta.total, 1200); assert.equal(venta.dinero, 1974);
  assert.equal((await rpc(a, 'bh_vender_todos')).total, 0);
  assert.ok((await a.rpc('bh_guardar_captura', { ...captura, p_calidad: 'fake', p_token: crypto.randomUUID() })).error);
  await rpc(a, 'bh_registrar_pregunta', { p_pregunta: '¿Dónde vive el Atún?', p_respuesta: 'Océano' });
  const preguntas = await a.from('preguntas_chatbot').select('*'); assert.equal(preguntas.data.length, 1);
  assert.deepEqual((await b.from('preguntas_chatbot').select('*')).data, []);
  let tienda=await rpc(a,'bh_tienda_estado');assert.equal(tienda.productos.length,9);assert.equal(tienda.objetos.bambu,1);
  assert.ok((await b.rpc('bh_comprar_producto',{p_producto_id:'metal',p_token:crypto.randomUUID()})).error);
  assert.ok((await a.rpc('bh_equipar_producto',{p_producto_id:'metal'})).error);
  const compra={p_producto_id:'metal',p_token:crypto.randomUUID()};
  tienda=await rpc(a,'bh_comprar_producto',compra);assert.equal(tienda.dinero,1474);
  assert.equal((await rpc(a,'bh_comprar_producto',compra)).dinero,1474);
  assert.ok((await a.rpc('bh_comprar_producto',{...compra,p_token:crypto.randomUUID()})).error);
  await rpc(a,'bh_equipar_producto',{p_producto_id:'metal'});
  await rpc(a,'bh_comprar_producto',{p_producto_id:'precision',p_token:crypto.randomUUID()});
  await rpc(a,'bh_equipar_producto',{p_producto_id:'precision'});
  const pack={p_producto_id:'lombriz',p_token:crypto.randomUUID()};
  const duplicadas=await Promise.all([rpc(a,'bh_comprar_producto',pack),rpc(a,'bh_comprar_producto',pack)]);
  assert.equal(duplicadas[1].objetos.lombriz,5);assert.equal(duplicadas[1].dinero,1349);
  await rpc(a,'bh_equipar_producto',{p_producto_id:'lombriz'});
  for(let i=0;i<5;i++){const lance=await rpc(a,'bh_preparar_pesca');assert.equal(lance.efectos.espera,.7);assert.equal(lance.efectos.dificultad,.75);assert.equal(lance.efectos.enganche,.15);assert.equal(lance.estado.objetos.lombriz,4-i)}
  const sinCebo=await rpc(a,'bh_preparar_pesca');assert.equal(sinCebo.efectos.espera,1);assert.equal(sinCebo.estado.equipo.cebo,'sin_cebo');
  assert.ok((await a.from('equipo_usuario').update({cantidad:999}).eq('usuario_id',idA)).error);
  assert.deepEqual((await b.from('equipo_usuario').select('*').eq('usuario_id',idA)).data,[]);
  assert.ok((await anon.rpc('bh_tienda_estado')).error);
  const antesRanking=await rpc(a,'bh_estado');
  const totalCapturas=antesRanking.catalogo.reduce((s,p)=>s+(Number(p.cantidad_capturada)||0),0);
  const ranking=await rpc(a,'bh_ranking',{p_criterio:'dinero'});
  assert.equal(ranking.tu_puesto.dinero,antesRanking.perfil.dinero);assert.equal(ranking.tu_puesto.capturas,totalCapturas);assert.equal(ranking.tu_puesto.es_tuyo,true);assert.ok(ranking.jugadores.length<=20);
  const nuevaCaptura={p_pez_id:globo.id,p_calidad:'comun',p_riesgo:false,p_token:crypto.randomUUID()};
  const itemRank=await rpc(a,'bh_guardar_captura',nuevaCaptura);await rpc(a,'bh_guardar_captura',nuevaCaptura);
  assert.equal((await rpc(a,'bh_ranking',{p_criterio:'capturas'})).tu_puesto.capturas,totalCapturas+1);
  const ventaRank=await rpc(a,'bh_vender_pez',{p_inventario_id:itemRank.inventario_id});
  assert.equal((await rpc(a,'bh_ranking')).tu_puesto.dinero,ventaRank.dinero);
  await rpc(a,'bh_comprar_producto',{p_producto_id:'marisco',p_token:crypto.randomUUID()});
  assert.equal((await rpc(a,'bh_ranking')).tu_puesto.dinero,ventaRank.dinero-75);
  for(const criterio of ['dinero','capturas']){const publico=await rpc(anon,'bh_ranking',{p_criterio:criterio});assert.equal(publico.tu_puesto,null);for(const fila of publico.jugadores){assert.deepEqual(Object.keys(fila).sort(),['capturas','dinero','es_tuyo','nombre','puesto']);assert.equal(fila.es_tuyo,false);}for(let i=1;i<publico.jugadores.length;i++)assert.ok(publico.jugadores[i-1][criterio]>=publico.jugadores[i][criterio]);}
  assert.ok((await anon.rpc('bh_ranking',{p_criterio:'dinero;drop table perfiles'})).error);
  assert.ok((await a.schema('bluehaven_privado').from('ranking_pesca').update({dinero:999999}).eq('usuario_id',idA)).error);
  await a.auth.signOut(); assert.ok((await a.rpc('bh_estado')).error);
  console.log('Supabase Auth + PostgreSQL + PostgREST: cuentas, RLS, concurrencia, capturas, economía y guía OK');
})().catch(e => { console.error(e); process.exitCode = 1; });
