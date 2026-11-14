const {createClient}=require('@supabase/supabase-js'),assert=require('node:assert/strict');
const url=process.env.SUPABASE_TEST_URL,key=process.env.SUPABASE_TEST_ANON_KEY;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Solo usa la base local efímera.');
(async()=>{
 const clientes=Array.from({length:6},()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})),tokens=clientes.map(()=>crypto.randomUUID()),stamp=Date.now();
 for(const [i,c]of clientes.entries()){const r=await c.auth.signUp({email:`sala${i}_${stamp}@gmail.com`,password:'sala-test-pass-123',options:{data:{usuario:'Pescador '+i}}});assert.equal(r.error,null);}
 const rpc=async(i,a,codigo='')=>{const r=await clientes[i].rpc('bh_sala',{p_accion:a,p_codigo:codigo,p_cliente:tokens[i]});if(r.error)throw Error(r.error.message);return r.data;};
 const anon=createClient(url,key);assert.ok((await anon.rpc('bh_sala',{p_accion:'crear',p_cliente:crypto.randomUUID()})).error);
 const s=await rpc(0,'crear');assert.match(s.codigo,/^[A-F0-9]{12}$/);assert.equal(s.jugadores.length,1);assert.deepEqual((await rpc(0,'crear')).yo,s.yo,'Crear es idempotente');
 const otro=await clientes[0].rpc('bh_sala',{p_accion:'crear',p_cliente:crypto.randomUUID()});assert.match(otro.error.message,/otra pestaña/);
 await assert.rejects(rpc(1,'unir','ZZZZ'),/12 caracteres/);await assert.rejects(rpc(1,'unir','000000000000'),/encontramos/);
 const resultado=await Promise.allSettled([1,2,3,4,5].map(i=>rpc(i,'unir',s.codigo)));
 assert.equal(resultado.filter(r=>r.status==='fulfilled').length,3,'La admisión simultánea respeta cuatro plazas');assert.equal(resultado.filter(r=>r.status==='rejected'&&/llena/.test(r.reason.message)).length,2);
 const lleno=await rpc(0,'estado');assert.equal(lleno.jugadores.length,4);assert.equal(new Set(lleno.jugadores.map(j=>j.asiento)).size,4);
 assert.ok(lleno.jugadores.every(j=>Object.keys(j).sort().join(',')==='asiento,id,nombre'),'Sin correo, UUID de Auth, saldo ni inventario');
 const dentro=resultado.findIndex(r=>r.status==='fulfilled')+1,fuera=resultado.findIndex(r=>r.status==='rejected')+1;
 const independiente=await rpc(fuera,'crear');assert.notEqual(independiente.canal,s.canal);assert.equal(independiente.jugadores.length,1);
 await assert.rejects(rpc(fuera,'unir',s.codigo),/Primero salí/);
 await rpc(fuera,'salir');await rpc(dentro,'salir');const relevo=await rpc(fuera,'unir',s.codigo);assert.equal(relevo.jugadores.length,4);
 const intento=await clientes[fuera].from('salas').select('*');assert.ok(intento.error,'Sin acceso directo a las tablas privadas');
 for(let i=0;i<6;i++)await rpc(i,'salir');await assert.rejects(rpc(0,'estado'),/cerró|venció/);await assert.rejects(rpc(0,'unir',s.codigo),/encontramos/);
 console.log('Salas API: cuentas, admisión simultánea de 4, privacidad, aislamiento, idempotencia, pestañas, salida y nueva plaza OK');
})().catch(e=>{console.error(e);process.exitCode=1});
