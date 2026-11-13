# Activar Supabase para Blue Haven

El cliente está configurado para `https://kzjdaobtjzrpqwtjcjfx.supabase.co` con la clave pública proporcionada por el propietario. No se utilizan claves secretas ni `service_role` en el navegador.

## 1. Instalar la estructura y las especies

1. Abrí el [SQL Editor del proyecto](https://supabase.com/dashboard/project/kzjdaobtjzrpqwtjcjfx/sql/new).
2. Copiá **todo** el contenido de [`instalar.sql`](instalar.sql), pegalo en una consulta nueva y presioná **Run**.
3. La consulta crea tablas, permisos, políticas RLS, funciones de economía y las nueve especies. Se ejecuta una sola vez y no elimina tablas previas. Si hay una tabla con el mismo nombre, la transacción falla completa para evitar sobrescribirla.

`instalar.sql` combina la migración de `migrations/` y `seed.sql` en una transacción. Para un proyecto nuevo también se puede usar Supabase CLI con la migración y después la semilla. No ejecutar ambos métodos sobre la misma base.

La clave pública permite usar la aplicación, pero no ejecutar esta instalación. Se necesita entrar como propietario al panel o configurar Supabase CLI con credenciales de administración fuera del navegador.

## 2. Configurar las cuentas

En **Authentication → URL Configuration**:

- **Site URL**: la dirección donde vayas a publicar el juego.
- **Redirect URLs**: las direcciones permitidas para volver después de confirmar el email. Durante el desarrollo, agregá `http://localhost:8000/**` o el origen que realmente uses.

El proyecto tiene habilitada la confirmación de email. Al crear una cuenta, el juego muestra que hay que confirmar el correo antes de iniciar sesión. Si ya existe una sesión válida, la recupera al volver.

No hace falta deshabilitar la confirmación para usar el juego. El stack local de tests la omite exclusivamente para las cuentas de prueba.

## 3. Ejecutar el juego

```sh
python3 -m http.server 8000
```

Abrí `http://localhost:8000`. Las cuentas usan **email y contraseña**; el nombre de jugador se guarda en el perfil. También podés entrar como invitado.

## Estructura

| Tabla | Contenido |
|---|---|
| `perfiles` | Usuario de Auth, nombre, dinero y caña comprada |
| `peces` | Catálogo, probabilidades y contenido educativo |
| `capturas_usuario` | Descubrimientos y mejor ejemplar de cada especie |
| `inventario_peces` | Ejemplares de la mochila, calidad y precio |
| `eventos_captura` | Identificadores para no repetir una captura |
| `preguntas_chatbot` | Consultas y respuestas de la guía |

Los jugadores solo tienen lectura sobre sus propias filas mediante RLS. No pueden escribir saldos o inventarios directamente. Las operaciones se realizan con `bh_guardar_captura`, `bh_vender_pez`, `bh_vender_todos` y `bh_comprar_cana`, que verifican el usuario autenticado y serializan operaciones sobre su perfil. Las contraseñas pertenecen a Supabase Auth; ninguna tabla pública las guarda.

La calidad y el resultado del minijuego siguen originándose en el cliente. Esto conserva el alcance de juego de un jugador; no equivale a un sistema antitrampas para competición.

## Cambiar a otro proyecto

Usá exclusivamente una clave pública `publishable` o `anon`:

```sh
SUPABASE_URL=https://tu-proyecto.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave \
npm run configure:supabase
```

Esto genera `config.js`, un archivo público. No ingreses allí una contraseña de PostgreSQL, un token de administración o una clave `service_role`.

## Datos de la versión MySQL anterior

Los SQL anteriores están conservados en `docs/legacy/mysql/`. No se importan en PostgreSQL: tenían otro esquema y autenticación propia. Esta instalación crea la base del juego en Supabase; no transfiere automáticamente cuentas ni partidas existentes de MariaDB. Conservá un respaldo de esa base si necesitás migrar datos reales después.

## Filtros de cuentas

La migración `20261113122304_filtros_cuentas.sql` ya está aplicada al proyecto alojado. Para una instalación nueva, está incluida en `instalar.sql`. No elimina usuarios ni cambia sus contraseñas o partidas. Valida nuevas cuentas, emails y cambios de nombre con funciones privadas y triggers; no requiere activar hooks manualmente. La validación de acceso y restauración de sesión está también en el cliente. Los tokens existentes no se revocan mediante esta migración.

Los registros rechazados directamente por la API pueden devolver un error genérico de Auth por el rechazo del trigger. Los formularios y el adaptador presentan la explicación específica antes de enviar la solicitud. Los ensayos automáticos con emails gmail se ejecutan solo contra Supabase local, con confirmación automática y sin envío de correos a terceros.

## Ranking

Las migraciones `20261113125249_ranking_jugadores.sql` y `20261113132727_ranking_politica_privada.sql` ya están aplicadas al proyecto alojado y se incluyen en `instalar.sql`. Conservan y cargan los saldos y contadores anteriores. La proyección privada tiene índices por ambos órdenes, RLS, denegación explícita de acceso directo y triggers transaccionales. La función pública invocadora `bh_ranking` devuelve únicamente el top 20, el puesto propio y el total; delega la lectura limitada a una función privilegiada privada. No expone datos de Auth ni inventarios y no acepta puntuaciones del cliente. Es una clasificación del prototipo de un jugador; los resultados del minijuego siguen siendo calculados por el cliente, como antes.
