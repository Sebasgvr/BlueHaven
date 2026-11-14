/* Solo archivos públicos del juego; nunca se cachean Auth, RPC, ranking o salas. */
importScripts('./pwa-assets.js');
const PREFIJO='bluehaven-app-'+encodeURIComponent(new URL(self.registration.scope).pathname)+'-',CACHE=PREFIJO+self.BLUEHAVEN_VERSION;
const urls=self.BLUEHAVEN_ARCHIVOS.map(ruta=>new URL(ruta,self.registration.scope).href);
const permitidas=new Set(urls);
self.addEventListener('install',evento=>{
 evento.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{await cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})));}
  catch(err){await caches.delete(CACHE);throw err;}
 })());
});
self.addEventListener('activate',evento=>{
 evento.waitUntil((async()=>{
  // Conservar la versión anterior para otras pestañas que todavía la estén usando.
  const anteriores=(await caches.keys()).filter(k=>k.startsWith(PREFIJO)&&k!==CACHE);
  await Promise.all(anteriores.slice(0,-1).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',evento=>{if(evento.data?.tipo==='ACTUALIZAR')self.skipWaiting();});
self.addEventListener('fetch',evento=>{
 const peticion=evento.request,url=new URL(peticion.url),raiz=new URL(self.registration.scope);
 if(peticion.method!=='GET'||url.origin!==raiz.origin||!url.pathname.startsWith(raiz.pathname))return;
 const documento=peticion.mode==='navigate'&&(url.pathname===raiz.pathname||url.pathname===raiz.pathname+'index.html');
 url.search='';url.hash='';
 if(!documento&&!permitidas.has(url.href))return;
 evento.respondWith((async()=>{
  const cache=await caches.open(CACHE),guardado=await cache.match(documento?new URL('index.html',raiz).href:url.href);
  return guardado||fetch(peticion);
 })());
});
