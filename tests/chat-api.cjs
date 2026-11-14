const{createClient}=require('@supabase/supabase-js'),assert=require('node:assert/strict');
const url=process.env.SUPABASE_TEST_URL,key=process.env.SUPABASE_TEST_ANON_KEY;if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Solo base local efímera.');
(async()=>{const c=Array.from({length:3},()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})),ids=c.map(()=>crypto.randomUUID()),stamp=Date.now();
for(let i=0;i<3;i++){const r=await c[i].auth.signUp({email:`chat${i}_${stamp}@gmail.com`,password:'chat-test-pass-123',options:{data:{usuario:'Pescador Chat '+i}}});assert.equal(r.error,null);}
const sala=async(i,accion,codigo='')=>{const r=await c[i].rpc('bh_sala',{p_accion:accion,p_codigo:codigo,p_cliente:ids[i]});assert.equal(r.error,null);return r.data};
const chat=(i,texto=null,token=null)=>c[i].rpc('bh_sala_chat',{p_cliente:ids[i],p_texto:texto,p_token:token});
assert.ok((await chat(0)).error);const a=await sala(0,'crear');await sala(1,'unir',a.codigo);await sala(2,'crear');
const anon=createClient(url,key);assert.ok((await anon.rpc('bh_sala_chat',{p_cliente:ids[0]})).error);
const token=crypto.randomUUID(),primero=await chat(0,'Hola al lago',token);assert.equal(primero.error,null);assert.equal(primero.data.length,1);assert.equal(primero.data[0].nombre,'Pescador Chat 0');assert.equal(primero.data[0].es_tuyo,true);
assert.equal((await chat(0,'Hola al lago',token)).data.length,1,'Reintento sin duplicar');assert.ok((await chat(0,'Otro mensaje',crypto.randomUUID())).error,'Límite de frecuencia servidor');
const ajeno=await chat(1);assert.equal(ajeno.data[0].es_tuyo,false);assert.deepEqual(Object.keys(ajeno.data[0]).sort(),['es_tuyo','fecha','id','nombre','texto']);assert.deepEqual((await chat(2)).data,[],'Salas aisladas');
for(const texto of ['', 'x'.repeat(281),'sos un p3lotud0'])assert.ok((await chat(1,texto,crypto.randomUUID())).error);
const html=await chat(1,'<img src=x onerror=alert(1)>',crypto.randomUUID());assert.equal(html.error,null);assert.equal(html.data.length,2,'Se conserva como texto, nunca HTML ejecutable');
assert.ok((await c[1].rpc('bh_sala_chat',{p_cliente:crypto.randomUUID()})).error);
await sala(0,'salir');assert.ok((await chat(0)).error,'Sin membresía no lee aunque conozca el código');
await sala(1,'salir');await sala(2,'salir');console.log('Chat API: identidad, membresía, aislamiento, límites, ofensas, idempotencia y salida OK');
})().catch(e=>{console.error(e);process.exitCode=1});
