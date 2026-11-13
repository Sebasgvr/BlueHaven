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

En Ajustes (Esc) podés cambiar gráficos, rendimiento, volumen y silencio, y cerrar sesión. El volumen se guarda en este navegador y controla la salida general de audio; esta versión todavía no incluye música ni efectos sonoros. El cursor se captura al entrar mediante el botón de acceso; al recuperar una sesión automáticamente el navegador puede requerir P o un clic. La guía (Q) bloquea el movimiento mientras escribís.

El mapa compacto mide 36×31 celdas. Las colisiones de la tienda usan un índice BVH para evitar recorrer todos sus triángulos en cada consulta. Las nueve especies tienen sprite; al ganar una captura aparece una ficha brillante con sus datos de enciclopedia, calidad, valor y estado de guardado. La ficha permanece hasta elegir Seguir pescando o Esc, sin consumir su tiempo de lectura.
