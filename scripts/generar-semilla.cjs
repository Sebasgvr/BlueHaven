const fs = require('node:fs');
const vm = require('node:vm');
const contexto = vm.createContext({});
vm.runInContext(fs.readFileSync('catalogo.js', 'utf8'), contexto);
const peces = vm.runInContext('CATALOGO_ESPECIES', contexto);
const json = JSON.stringify(peces);
const sql = `-- Catálogo Blue Haven. Ejecutar después de la migración de estructura.\ninsert into public.peces(nombre,rareza,velocidad,peso_seleccion,sprite,datos)\nselect p->>'nombre',(p->>'rareza')::int,(p->>'velocidad')::real,(p->>'pesoSeleccion')::real,p->>'sprite',p\nfrom jsonb_array_elements($catalogo$${json}$catalogo$::jsonb) p\non conflict(nombre) do update set rareza=excluded.rareza,velocidad=excluded.velocidad,peso_seleccion=excluded.peso_seleccion,sprite=excluded.sprite,datos=excluded.datos;\n`;
fs.writeFileSync('supabase/seed.sql', sql);

const migracion = fs.readFileSync('supabase/migrations/202611110001_bluehaven.sql', 'utf8');
fs.writeFileSync('supabase/instalar.sql', migracion.replace(/commit;\s*$/, sql + '\ncommit;\n'));

const tienda=fs.readFileSync('supabase/migrations/20261111234025_tienda_equipamiento.sql','utf8');
fs.appendFileSync('supabase/instalar.sql','\n'+tienda);

fs.appendFileSync('supabase/instalar.sql','\n'+fs.readFileSync('supabase/migrations/20261113122304_filtros_cuentas.sql','utf8'));

fs.appendFileSync('supabase/instalar.sql','\n'+fs.readFileSync('supabase/migrations/20261113125249_ranking_jugadores.sql','utf8'));

fs.appendFileSync('supabase/instalar.sql','\n'+fs.readFileSync('supabase/migrations/20261113132727_ranking_politica_privada.sql','utf8'));
