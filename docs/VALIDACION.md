# Validación de la integración

Comprobaciones realizadas el 11 de noviembre de 2026 en Chromium con renderizado por software y viewport de 960 × 540:

- Cinco pruebas de lógica: catálogo, precios, aislamiento de cuentas, límite de mochila y conservación del estado ante errores de red.
- Prueba de navegador: carga del mundo y sus modelos, invitado, guía local, bloqueo de movimiento, ajustes gráficos, enciclopedia, construcción/actualización/dibujo de las cinco familias de minijuegos y recuperación de dinero/caña después de recargar.
- API real con PHP 8.3 y MariaDB 11.4: registro, contraseña incorrecta, inicio/cierre de sesión, nueve especies, capturas de calidad legendaria, riesgo, repetición de solicitudes sin duplicados, propiedad del inventario, venta individual, venta total, compra persistente de caña, límite de diez peces y registro de la undécima captura liberada, validación de entradas y chatbot.
- Sintaxis JavaScript y PHP comprobada.

## Rendimiento

El escenario original contiene aproximadamente 1.670 objetos en la raíz de la escena. El escenario integrado contiene alrededor de 40, incluyendo ocho árboles añadidos. El terreno ahora usa 23 grupos instanciados.

En la posición inicial de la nueva versión, el render original generó 569 llamadas de dibujo en una muestra previa a terminar la carga de la tienda. La versión integrada, con la tienda cargada, generó 62. Son mediciones de llamadas de dibujo, no una garantía de FPS ni un benchmark de hardware del usuario.

El modelo `tiendaPesca.glb` pasó de 45.561.576 bytes a menos de 1 MB. Su geometría visible se conserva; las texturas se redujeron a 512 px y se convirtieron a WebP.

El rendimiento real depende de GPU, navegador y resolución. El selector permite bajar la resolución de renderizado y limitar a 30 FPS en equipos modestos.

## Pendiente

No se hizo una partida manual completa hasta capturar todas las especies ni una medición en el equipo del usuario. La API verifica las operaciones de economía y su propietario; los resultados de minijuego y calidad siguen siendo del cliente, como corresponde al alcance actual de prototipo de un jugador.

# Migración a Supabase — validación vigente

La API PHP y MariaDB de la primera integración fueron reemplazadas por Supabase Auth, PostgreSQL, RLS y RPC. Las verificaciones de la sección anterior describen la versión histórica.

Pruebas del nuevo backend ejecutadas sobre servicios reales de Supabase Auth (GoTrue 2.197), PostgreSQL 16 y PostgREST 14.18 en un stack local:

- Registro y sesión mediante el SDK oficial de Supabase.
- Perfil automático para cada usuario de Auth y catálogo de nueve especies.
- Aislamiento entre dos cuentas con RLS; una cuenta no puede leer inventarios ajenos.
- Escritura directa de saldo e inventario bloqueada; anónimos sin acceso al estado.
- Capturas idempotentes, calidad y riesgo; mochila limitada a diez ejemplares y descubrimiento de la captura liberada.
- Dos ventas simultáneas del mismo ejemplar: una sola acredita dinero.
- Venta total, compra de caña persistente, consultas privadas de la guía y cierre de sesión.

En el proyecto alojado se verificaron la URL y la clave pública y la configuración de Auth. La consulta a `bh_estado` informó que la función todavía no existe: la instalación de `supabase/instalar.sql` debe ejecutarla el propietario en el panel. La clave pública no permite crear el esquema; no se utilizaron credenciales administrativas ni se registraron cuentas de prueba en el proyecto alojado.

También pasó la prueba de navegador contra el stack local real: registro desde el formulario, captura/venta/compra, recarga con sesión recuperada y saldo/caña persistentes, cierre de sesión, invitado con progreso separado y nuevo inicio de sesión por email. La prueba de invitado y las cinco pruebas de lógica siguieron aprobadas.

## Tienda y equipamiento

Ocho pruebas de lógica aprobadas. Navegador Chromium: entrada sin peces, interior sin colisiones, comprar/vender, tres categorías, equipamiento, consumo al lanzar, persistencia del invitado y salida. API local real: precios y propiedad, compra idempotente y concurrente, consumo de cinco cebos y retorno al básico, RLS y bloqueo de escrituras directas. Navegador con cuenta local: compra y equipamiento persistentes tras recargar. La migración de tienda conserva perfiles, saldos y compras previas de bambú.

La migración de tienda se aplicó también al proyecto alojado. El asesor de Supabase reconoce como intencionales las RPC SECURITY DEFINER: comprueban auth.uid(), fijan search_path y solo permiten operaciones autorizadas. Continúan avisos anteriores sobre [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e [índices de claves foráneas](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys); las tablas nuevas tienen RLS e índices. Referencia del [aviso sobre RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Ajustes y cursor

Prueba de navegador dedicada: captura inicial al entrar como invitado, liberar y capturar con P, abrir con Esc, botón de sesión dentro de Ajustes, volumen sobre el nodo de salida real de p5.sound, silencio y persistencia al recargar. Con W mantenida y Q se verifica posición inmóvil, también al escribir. Se conservan las pruebas de tienda, minijuegos y cierre de sesión con Supabase local.

## Mapa compacto, tienda y fichas de captura

Mapa reducido de 48×39 a 36×31 (40,4 % menos celdas), conservando posiciones de agua, aparición y tienda. Se excluyen árboles fuera de los nuevos límites. BVH 0.5.24 compatible con Three r128 sobre mallas estáticas, primer impacto para rayos y consulta de caña reutilizada por fotograma.

Perfil local de Chromium/SwiftShader, mismo punto interior: promedio de 20 consultas de colisión de 16,785 a 1,185 ms; 50 consultas de piso de 0,476 a 0,058 ms. Estos tiempos miden consultas, no FPS en el equipo del jugador. El arranque general pasó de 62 a 54 llamadas de dibujo en la prueba existente.

Prueba dedicada: 40 posiciones con piso y paredes equivalentes entre BVH y raycast original; nueve imágenes cargadas; nueve victorias disparan fichas con todos los campos y un único ingreso por captura; pausa de movimiento; décima captura y liberación por mochila llena; cierre devuelve la línea a reposo. Revisión visual de la ficha del Dragón. Se prueba también guardado de una captura desde la ficha con cuenta de Supabase local y recarga. Los sprites faltantes se resuelven por nombre para catálogos ya instalados, sin modificar cuentas ni requerir migración remota.

## Diseño forestal de backend

Prueba Chromium: 90 árboles interiores y tres capas de mallas instanciadas; borde sólido, colisión de troncos y lago, aparición despejada y al menos un punto transitable del puente sobre agua. Entrada/salida de la tienda y ausencia de errores JavaScript. La vista medida registró 56 llamadas de dibujo con el bosque cargado (523.104 triángulos); esto no garantiza FPS en otros equipos. Revisión visual del lago y de la tienda. Continuaron aprobados los ocho casos de lógica y el navegador general con los cinco minijuegos, controles, economía y guardado.

## Filtros de email y lenguaje

Doce pruebas de lógica aprobadas: dominios exactos, formato, normalización de ofensas y evasiones comunes, nombres legítimos, llamadas bloqueadas antes del SDK, contraseñas intactas y listas JS/SQL iguales. API real local: rechazo directo de dominios ajenos y suplantados, nombre y correo ofensivos, metadata ofensiva; registro de Maricarmen y operaciones anteriores aprobadas. Navegador: formularios inválidos sin solicitudes de Auth, registro válido, login, recuperación de sesión, economía, captura y persistencia.

Migración aplicada y verificada en Supabase alojado con funciones puras, sin crear usuarios de prueba ni enviar emails. El asesor de seguridad no añadió avisos respecto del estado anterior; permanecen los nueve avisos de [RPC privilegiadas intencionales](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y el de [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Audio, clasificación y controles táctiles

API real local: ranking por ambos criterios, saldo tras ventas y compras, capturas acumuladas incluyendo ejemplares vendidos/liberados, repetición idempotente sin duplicar, puesto propio, consulta anónima, claves públicas limitadas y rechazo de escritura directa/criterio inválido. Navegador con cuenta: el ranking muestra $649 y dos capturas aunque solo quede una en la mochila.

Chromium con pantalla táctil emulada y eventos multitáctiles nativos: dos dedos para movimiento y mirada, lanzamiento y cancelación, pulso de anillo, freno mantenido/soltado, dos pistas de ritmo sostenidas, esquiva y reacción multietapa. Menús, enciclopedia bloqueada, tienda, ranking, rotación 390×844/844×390, dimensiones de dibujo restauradas, contexto de audio activo, silencio sobre la salida real y limpieza al salir. Se corrigió el clic de compatibilidad que podía caer en Cancelar al cambiar de posición un botón. Revisión de capturas de pantalla vertical/horizontal y ranking. No se hizo una prueba sobre un teléfono físico ni una escucha manual; los sonidos se verificaron mediante el contexto y la mezcla del navegador.

En Supabase alojado se comprobó el backfill sin diferencias entre saldo/capturas del ranking y las fuentes, y que no hay permisos de lectura directa de la proyección ni ejecución de la función privada de equipo ajeno. La respuesta contiene solo nombre, puesto, dinero, capturas y marca de usuario propio.

La política privada de denegación explícita eliminó el aviso nuevo de RLS sin políticas; el asesor de seguridad vuelve al mismo conjunto de avisos anteriores ([referencia de RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Se verificó también la RPC alojada con la clave pública, sin sesión, en ambos órdenes y con solo los cinco campos previstos.

## Analógico y barras discretas

Doce pruebas de lógica y la suite móvil de Chromium aprobadas. Se verificaron movimiento y mirada con dos dedos, velocidad parcial, límite circular de intensidad, cancelación y reutilización del analógico después de toques fuera del control; no se captura el cursor ni se abre Ajustes. Los cinco minijuegos, notas sostenidas simultáneas, menús y rotación siguen aprobados. En registro a 390×480 el contenido largo conserva desplazamiento con barras ocultas. Validación con pantalla táctil emulada; pendiente comprobación en un teléfono físico.
