# 🎣 Blue Haven

Juego de pesca 3D educativo para navegador. Explorá el lago, capturá nueve especies, superá cinco familias de minijuegos, vendé tus capturas y mejorá tu caña.

Esta versión integra el trabajo de [Sebasgvr/BlueHaven](https://github.com/Sebasgvr/BlueHaven), principalmente `backend`, con los recursos adicionales de `diseños`. Conserva el juego original y mejora rendimiento, guardado y funcionamiento local. Ver [procedencia y créditos](docs/PROCEDENCIA.md).

## Jugar como invitado

No requiere PHP ni base de datos. Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Abrí **http://localhost:8000** y elegí **Jugar sin cuenta**. La partida de invitado se guarda en este navegador. Se puede pescar, vender, comprar/equipar la caña, consultar la enciclopedia y usar la guía local. Las cuentas requieren la instalación completa de abajo. No abras `index.html` directamente con `file://`.

## Jugar con cuentas de Supabase

El juego usa **Supabase Auth + PostgreSQL**, conectado al proyecto `kzjdaobtjzrpqwtjcjfx`. Ya no necesita PHP ni MariaDB.

El propietario debe ejecutar una vez [`supabase/instalar.sql`](supabase/instalar.sql) en el SQL Editor de Supabase. La [guía de configuración](supabase/README.md) explica la instalación, la confirmación de email y las direcciones de redirección.

Después, el mismo servidor estático del modo invitado permite crear cuentas e iniciar sesión con **email y contraseña**. El dinero, la caña, las capturas, la enciclopedia y la mochila se guardan en Supabase. La clave de `config.js` es pública; los permisos se aplican en la base de datos.

Opcionalmente se puede servir el juego con Docker:

```sh
docker compose up --build -d
```

Abrí `http://localhost:8080`. Este contenedor solo sirve archivos; los datos están en tu proyecto de Supabase.

## Controles

| Acción | Control |
|---|---|
| Moverte | W, A, S, D |
| Mirar | Mouse, después de hacer clic en la escena |
| Saltar / enganchar / pulso | Espacio |
| Agacharte | Control |
| Lanzar / recoger / arriesgar | F |
| Entrar a la tienda: comprar y vender | E |
| Mochila y equipamiento | I |
| Enciclopedia | L |
| Guía de pesca | Q o botón inferior derecho |
| Ajustes / cerrar el panel abierto | Escape |
| Liberar o capturar el cursor | P |
| Ranking | Cartel junto a la tienda: tocar/clic o R al acercarse |
| Ritmo | A/S/D o Z/X/C |

Acercate a la tienda y presioná E para entrar, incluso sin peces. Elegí Comprar o Vender; el panel permite seguir explorando el interior o salir. Con I podés cambiar tu equipo desde cualquier lugar.

| Equipo | Precio | Efecto |
|---|---|---|
| Caña de bambú | $150 | Reduce 15 % la dificultad |
| Caña de metal | $500 | Reduce 25 % la dificultad |
| Lombrices, paquete de 5 | $35 | Reduce 30 % la espera |
| Mariscos, paquete de 5 | $75 | Aumenta el peso de las especies raras en el sorteo |
| Anzuelo de precisión | $90 | Agrega 0,15 segundos para enganchar |
| Anzuelo reforzado | $200 | Reduce 10 % la dificultad |

Las cañas y los anzuelos son permanentes. Se consume un cebo por lanzamiento al agua; al agotarse volvés al equipo sin cebo. Los efectos de la caña y el anzuelo se combinan. Las compras y el equipo de las cuentas se guardan en Supabase. La bienvenida explica los minijuegos. El juego está pensado para escritorio con teclado y mouse.

## Mejoras incluidas

- Terreno con `InstancedMesh`: 23 grupos en lugar de una malla por cada celda.
- Tienda reducida de **45.561.576 a aproximadamente 1.000.000 bytes**, con texturas WebP de hasta 512 px. Se conserva la geometría del edificio.
- Bibliotecas Three.js locales; el arranque ya no depende de un CDN. Fuentes del sistema.
- Calidad gráfica baja/media/alta, contador opcional de rendimiento y pausa al ocultar la pestaña.
- Movimiento ajustado al tiempo transcurrido; chat y ajustes bloquean los controles.
- Catálogo compartido para pesca, enciclopedia y guía de invitado; Pez Globo agregado a la base.
- Progreso de invitado separado de cada cuenta. El inventario vacío del servidor reemplaza correctamente el local.
- Precio, calidad y riesgo guardados por ejemplar. Las ventas y la compra de caña se realizan en transacciones del servidor.
- Capturas con identificador único, límite de mochila en servidor y registro de especies aun cuando se libera el pez por mochila llena.
- Los errores de conexión se muestran sin transformar una operación fallida en dinero local.
- Árbol de la rama `diseños` incorporado al escenario y logo integrado.

## Desarrollo y pruebas

Node.js 20+ solo es necesario para las herramientas de desarrollo:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:supabase
```

La prueba de navegador usa `http://127.0.0.1:8080`; se puede cambiar con `TEST_URL`. Para comprobar la base ejecutá `npm run test:supabase`: levanta un stack local de pruebas con Auth, PostgreSQL y PostgREST. `test:api` requiere `SUPABASE_TEST_URL` y `SUPABASE_TEST_ANON_KEY` de ese stack y crea cuentas de prueba; no utiliza el proyecto alojado. Para usar Chromium ya instalado: `CHROMIUM_PATH=/ruta/a/chromium npm run test:browser`.

`npm run optimize:shop -- entrada.glb salida.glb` reproduce la optimización de modelos. El archivo integrado ya está optimizado; usá como entrada el original al repetir el proceso.

## Alcance actual

Es un juego de un jugador. El servidor valida especies, precios, propiedad del inventario y saldo, pero el resultado del minijuego y la tirada de calidad todavía se originan en el cliente; no es un sistema antitrampas para rankings competitivos. Las cuentas requieren conexión para guardar capturas y efectuar compras/ventas. El invitado funciona de forma independiente y no se importa automáticamente a una cuenta.

Las nueve especies combinan contenido real y fantasía del prototipo. Las especies marinas se pueden capturar en el lago; los biomas y la selección de equipamiento por hábitat quedan para otra etapa.

## Integración actual de Supabase

`base-datos.js` concentra el acceso a Auth y las funciones RPC. Las políticas RLS aíslan las cuentas; las funciones de PostgreSQL calculan precios y ejecutan ventas/compras en transacciones. El catálogo del usuario se descarga de Supabase y también alimenta la enciclopedia y la guía. El modo invitado sigue usando su partida local independiente. Ver [instalación](supabase/README.md) y [validación](docs/VALIDACION.md).

## Publicación en GitHub Pages

GitHub Pages está configurado para publicar la rama `main`, carpeta raíz, en:

https://nicori25.github.io/Blue-Haven/

El archivo `.nojekyll` permite servir directamente los archivos estáticos del repositorio. Cada cambio en `main` vuelve a publicar; las ramas alternativas no reemplazan el sitio principal.

En Supabase → Authentication → URL Configuration, la dirección de producción debe ser `https://nicori25.github.io/Blue-Haven/` y la lista de redirecciones debe incluir `https://nicori25.github.io/Blue-Haven/**`, conservando las URLs de desarrollo que necesites. El cliente ya usa el origen y la ruta actuales al solicitar la confirmación del email.

En Ajustes (Esc) podés cambiar gráficos, rendimiento, volumen y silencio, y cerrar sesión. El volumen se guarda en este navegador y controla la salida general de audio; incluye ambiente del lago, melodías suaves y efectos originales sintetizados. El cursor se captura al entrar mediante el botón de acceso; al recuperar una sesión automáticamente el navegador puede requerir P o un clic. La guía (Q) bloquea el movimiento mientras escribís.

El mapa compacto mide 36×31 celdas. Las colisiones de la tienda usan un índice BVH para evitar recorrer todos sus triángulos en cada consulta. Las nueve especies tienen sprite; al ganar una captura aparece una ficha brillante con sus datos de enciclopedia, calidad, valor y estado de guardado. La ficha permanece hasta elegir Seguir pescando o Esc, sin consumir su tiempo de lectura.

El diseño forestal de `Sebasgvr/BlueHaven/backend` está adaptado al mapa actual: árboles de borde, bosque interior y segunda fila oscura, suelo y fondo exterior con niebla. Se dibujan las tres capas por instancias. Los troncos bloquean el paso, el lago solo permite caminar sobre el puente y el acceso a la tienda queda libre.

Los formularios de acceso y registro aceptan únicamente los dominios de proveedores indicados en “Correos permitidos y reglas”. La lista incluye Gmail, Googlemail, Hotmail, Outlook, Live, MSN, Yahoo, iCloud, Proton, AOL, GMX, Mail y Zoho, con sus variantes regionales declaradas. Se comparan dominios completos. El nombre de jugador y la parte del correo anterior a @ se revisan contra una lista de palabras ofensivas, con normalización de acentos, mayúsculas, números y separadores comunes; las contraseñas conservan sus reglas de seguridad. La confirmación de correo sigue verificando la dirección.

Supabase valida también los registros nuevos y los cambios de email/nombre, incluso si se omiten los formularios. El juego aplica el filtro al iniciar sesión y recuperar una sesión guardada; las cuentas existentes conservan sus datos y los dominios fuera de lista se rechazan desde el juego. La lista no es un detector semántico de todas las ofensas posibles. Ver `filtros-cuentas.js` y la migración de filtros para modificar la política de forma coherente.

## Audio, ranking y celular

El audio arranca con una interacción del jugador y se pausa al ocultar la página o salir de la partida. Incluye ambiente del lago y melodías suaves, lanzamiento, agua, picada, enganche, pulsos de minijuego, captura, fallo, compras, monedas y equipamiento. Ajustes permite cambiar volumen, silenciar todo o desactivar la música conservando los efectos. El sonido se genera localmente con Web Audio y comparte la salida general de p5.sound; no descarga grabaciones.

El cartel flotante junto a la tienda muestra los primeros puestos por dinero y capturas. Al acercarte, tocá/hacé clic en el cartel o pulsá R para abrir la tabla completa. El Ranking muestra el top 20 por dinero actual o capturas acumuladas. Comprar reduce el saldo clasificado; vender lo aumenta. Las capturas cuentan aunque el pez se venda o se libere por mochila llena. La tabla se actualiza al abrir o pulsar Actualizar y destaca tu puesto, incluso fuera del top 20. Solo participan las cuentas; el invitado puede consultar la tabla. Se publica el nombre de jugador y las puntuaciones, sin correos, UUID, contraseñas ni inventarios.

Los botones táctiles se activan automáticamente en pantallas táctiles y también pueden activarse desde Ajustes. Joystick analógico con velocidad gradual para moverse, Saltar, arrastre a la derecha para mirar, Lanzar/Recoger y menús de mochila, tienda, guía, especies y ranking. Se puede jugar en vertical u horizontal; la calidad inicial del celular es Baja si no había ajustes guardados. No se usa captura del cursor en modo táctil.

| Minijuego | Control táctil |
|---|---|
| Anillo | Pulsar cuando el anillo llegue a la zona |
| Brújula | Analógico a los lados y mantener o soltar Frenar |
| Ritmo | A/S/D, mantener notas largas y tocar dos pistas simultáneas |
| Esquiva | Analógico en cualquier dirección |
| Multietapa | Cambia los controles según la fase; Acción para el evento de reacción |

Los minijuegos mantienen un espacio de dibujo consistente al girar el teléfono. La enciclopedia táctil usa un selector y conserva las fichas bloqueadas hasta descubrirlas. Los controles se sueltan al abrir un panel, perder foco o cancelar un toque.

Las barras de desplazamiento están ocultas en todas las pantallas; el contenido largo sigue desplazándose con el dedo, la rueda o el teclado. El analógico vuelve al centro al soltar, cancelar el gesto, girar el teléfono o abrir un panel.

## Multijugador: salas privadas

Con una cuenta iniciada, pulsá **Multijugador → Crear sala privada** y compartí el código de 12 caracteres. Tus amigos abren **Multijugador**, pegan el código y eligen **Unirme**. Cada sala admite hasta **4 cuentas**; el invitado sigue siendo individual. Volver al juego cierra el panel y mantiene la sala. **Salir de la sala** vuelve al modo individual sin cerrar sesión.

Se ven los nombres, colores, posiciones, orientación, salto, agachado y animaciones de caminar/pescar. La pesca, los minijuegos, equipo, inventario, dinero y guardado siguen siendo individuales. Esta versión es cooperativa social: no incluye intercambios, peces compartidos ni competencias.

Las posiciones viajan por canales privados de Supabase Realtime (hasta 8 envíos por segundo al moverse, 1 al estar quieto), con interpolación visual. Solo se consultan membresías cada 12 segundos y ante cambios de presencia; no se guardan posiciones en PostgreSQL. La admisión se valida en el servidor y serializa el acceso a las cuatro plazas. Los mensajes de posición son cosméticos y no se usan para conceder dinero o capturas; una sala entre amigos no es un servidor competitivo con validación de movimiento.

La conexión se reintenta automáticamente. La sala vence a las 24 horas; una ausencia sin salida explícita libera la plaza a los 75 segundos. Si vence tu conexión, podés volver a unirte con el código. Cerrar sesión sale de la sala y conserva el progreso. Para mantener una sesión por cuenta, usá cuentas distintas en cada dispositivo.

Instalaciones nuevas: `supabase/instalar.sql` incluye las tablas privadas, la RPC `bh_sala` y las políticas de Realtime. Instalaciones existentes: aplicar en orden `supabase/migrations/20261113234229_salas_multijugador.sql` y `supabase/migrations/20261113235843_salas_orden_bloqueos.sql`. No requiere claves secretas en el navegador. Realtime comprueba las membresías al autorizar el canal; sus permisos se almacenan en caché durante la conexión, por lo que la sala es para personas que ya recibieron su código de invitación.

Pruebas: `npm run test:supabase` verifica admisión concurrente, cupo, aislamiento y salida sobre PostgreSQL/Auth reales locales. `node tests/multijugador-browser.cjs` verifica el transporte real en una instancia con Realtime usando `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY` y `MULTIPLAYER_FIXTURE` (JSON privado con `password` y `usuarios: [{email}]`, mínimo cinco cuentas efímeras precreadas). Rechaza conexiones remotas sin `ALLOW_REMOTE_TESTS=1`. Nunca usar cuentas personales ni subir ese archivo al repositorio.

## Instalar en el celular

Abrí https://nicori25.github.io/Blue-Haven/ y pulsá **Instalar en el celular** en el acceso o **Ajustes → Instalar / actualizar juego** dentro del juego.

- **Android:** si el navegador ofrece instalación, pulsá **Instalar Blue Haven** y confirmá. También podés usar el menú de Chrome → Instalar aplicación / Agregar a pantalla de inicio.
- **iPhone/iPad:** abrilo en Safari → Compartir → Agregar a pantalla de inicio → Agregar. Dejá activado «Abrir como app» si aparece.
- Si lo abriste dentro de una app de mensajes o redes, primero abrilo en el navegador del celular.

Es una PWA: usa el juego principal, se instala desde la web y se abre en una ventana independiente con su propio ícono. No requiere publicar en una tienda ni instalar un APK. El progreso de cuentas sigue guardándose en Supabase. Safari puede usar almacenamiento independiente para la app instalada; el invitado se guarda en cada instalación/navegador y no se transfiere entre dispositivos.

En la primera visita se guardan los archivos públicos del juego (aproximadamente 7 MB). Esperá el mensaje **Archivos guardados** antes de salir de internet. Después se puede abrir y jugar como invitado sin conexión, incluidos modelos, sprites, audio y progreso local. Login/registro, guardado de cuentas, ranking y multijugador requieren internet. El navegador puede eliminar los archivos y el progreso local si se borra su almacenamiento o falta espacio; las partidas de cuentas permanecen en Supabase.

Las actualizaciones se preparan en segundo plano. Un punto en Ajustes y el botón **Actualización disponible** llevan a la opción **Actualizar y reiniciar**; el juego no se recarga solo en medio de una pesca. Se conserva la versión anterior en caché para otras pestañas. Nunca se cachean respuestas de Auth, datos personales, RPC ni WebSockets.

Al modificar archivos del juego, ejecutar `npm run build:pwa` y subir también `pwa-assets.js`. La lista y la versión de caché se generan desde el contenido y CI verifica que estén actualizadas. El service worker usa rutas relativas y su alcance es solo el directorio de Blue Haven, compatible con GitHub Pages y otros proyectos del mismo dominio. HTTPS es obligatorio salvo en localhost. `npm run test:pwa` prueba instalación, recursos, invitado offline, actualizaciones y alcance en `/Blue-Haven/` con Chromium.


## Chat entre jugadores

Al entrar a una sala aparece **💬 Chat** en la barra del juego. También podés abrirlo con **T**; escribí y pulsá **Enviar** o Enter. **Esc** o Volver al lago cierran el panel. Mientras escribís se bloquean el movimiento y las acciones del juego; en celular el panel se adapta al espacio del teclado. El botón muestra los mensajes sin leer.

Solo los miembros conectados de esa sala pueden enviar y leer sus últimos **50 mensajes**. El nombre lo asigna el servidor desde la cuenta; los mensajes no admiten HTML activo y se filtran palabras ofensivas tanto en el cliente como en Supabase. Límite: 280 caracteres y un envío por segundo. Los reintentos recientes no duplican el mensaje. Al salir se limpian el historial y el borrador de ese dispositivo; los mensajes de la sala se eliminan cuando se elimina la sala. No hay chat global ni acceso como invitado, y requiere internet.

La RPC autenticada verifica membresía y entrega el contenido. Realtime envía solo avisos privados sin texto; el navegador vuelve a consultar los mensajes verificados, por lo que falsificar un aviso no permite suplantar autores. Hay consulta de respaldo al reconectar y al tener abierto el chat. La caché de la app no guarda respuestas del chat. La instalación completa incluye `20261114021514_chat_salas.sql`.

Pruebas locales: `tests/chat-api.cjs`, `tests/chat-retencion.sql` y `tests/chat-browser.cjs` (dos cuentas, API real y transporte de avisos simulado con `CHAT_FAKE_REALTIME=1` sobre el stack mínimo). El script del navegador admite una instancia real de Realtime con cuentas efímeras precreadas mediante `CHAT_FIXTURE`; nunca usar cuentas personales ni subir credenciales al repositorio.
