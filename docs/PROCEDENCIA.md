# Procedencia y créditos

Integrado en `nicori25/Blue-Haven` por pedido del propietario, a partir de:

- `Sebasgvr/BlueHaven`, rama `backend`, commit `b4105a4`: juego, cuentas, PHP, base de datos, chatbot, minijuegos, calidad y enciclopedia. Incluye la rama `base-de-datos` hasta `8d1297c`.
- Rama `diseños`, commit `59a1478`: `Modelo_arbol.obj`, `Modelo_arbol.mtl` y `LogoBlueHaven.png`. El árbol se coloca en el escenario compartiendo geometría y materiales.
- `main` (`1455b22`) y `develop` (`c4f3eaf`) contienen el prototipo anterior. Se revisaron sus diferencias; se conserva la implementación posterior de `backend` en los archivos que evolucionaron.

No se hizo un merge completo de `diseños` sobre `backend`: su código incluye versiones anteriores de inventario, colisiones y pesca que reemplazarían avances más recientes. Se integraron sus recursos adicionales.

El repositorio fuente no declara una licencia general. Se conserva la atribución del equipo original (Sebasgvr, Raziiel08, nicori25 y nahuxx2077); las bibliotecas y modelos mantienen sus avisos particulares. Antes de redistribuir comercialmente, corresponde acordar los derechos del contenido del equipo y verificar el origen de los demás recursos.

## Modelos con licencia declarada

- “Fishing Rod”, de Inuciian: https://sketchfab.com/3d-models/fishing-rod-ab78aaf5ea154edcabdc118196916ddd — CC BY 4.0.
- “Bamboo Fishing Rod”, de Total_Marginal: https://sketchfab.com/3d-models/bamboo-fishing-rod-43d7c0540bb3468f837b23543882434e — CC BY 4.0.

Se conservan los archivos `license.txt` en las carpetas de los modelos.

## Bibliotecas

- Three.js r128 y sus loaders: MIT, https://github.com/mrdoob/three.js/tree/r128
- p5.js 1.10.0 y p5.sound: avisos originales conservados en `libraries/`.

La tienda original se optimizó con glTF Transform y Sharp, sin cambiar su geometría visible: deduplicación, eliminación de recursos sin uso y texturas WebP de hasta 512 px.

## Migración a Supabase

La versión actual reemplaza la API PHP y MariaDB de esta integración por el SDK oficial `@supabase/supabase-js` (MIT), Supabase Auth y funciones PostgreSQL. El SDK se empaqueta localmente mediante esbuild; su aviso de licencia está en `libraries/SUPABASE-LICENSE.txt`. Los SQL originales de MySQL se conservan en `docs/legacy/mysql/` como referencia histórica.

- three-mesh-bvh 0.5.24: MIT, https://github.com/gkjohnson/three-mesh-bvh/tree/v0.5.24. Compilación UMD distribuida por jsDelivr, minimizada con esbuild; licencia en libraries/three-mesh-bvh.LICENSE.
- Sprites SVG de Carpa, Trucha, Dragón, Esturión y Pez Remo: dibujos originales de esta integración, sin recursos externos. Se conservan los cuatro PNG originales.
