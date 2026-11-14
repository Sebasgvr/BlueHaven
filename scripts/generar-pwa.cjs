// Lista cerrada: jamás incluir .env, SQL, credenciales ni archivos de pruebas.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const archivos=fs.readdirSync('.').filter(n=>/\.(html|css|js|webmanifest)$/.test(n)&&!['service-worker.js','pwa-assets.js'].includes(n));
function visitar(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.posix.join(dir,e.name);if(e.isDirectory())visitar(p);else archivos.push(p);}}
for(const dir of ['icons','libraries','models','textures'])visitar(dir);
archivos.sort();const hash=crypto.createHash('sha256');for(const nombre of archivos){hash.update(nombre);hash.update(fs.readFileSync(nombre));}hash.update(fs.readFileSync('service-worker.js'));
const version=hash.digest('hex').slice(0,16);
fs.writeFileSync('pwa-assets.js','// Generado con npm run build:pwa. Solo recursos públicos del juego.\nself.BLUEHAVEN_VERSION='+JSON.stringify(version)+';\nself.BLUEHAVEN_ARCHIVOS='+JSON.stringify(archivos.map(n=>'./'+n),null,2)+';\n');
console.log('PWA: '+archivos.length+' archivos · '+version);
