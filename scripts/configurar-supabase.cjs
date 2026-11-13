const fs = require('node:fs');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Definí SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY (o SUPABASE_ANON_KEY).');
const destino = new URL(url);
if (destino.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(destino.hostname)) throw new Error('La URL debe usar HTTPS.');
if (!key.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role; } catch (_) {}
  if (role !== 'anon') throw new Error('Usá exclusivamente una clave publishable o anon.');
}
fs.writeFileSync('config.js', '// Configuración pública de Supabase. Nunca usar service_role.\nwindow.BLUEHAVEN_CONFIG = Object.freeze(' + JSON.stringify({supabaseUrl:url,supabaseKey:key},null,2) + ');\n');
console.log('Configuración pública actualizada.');
