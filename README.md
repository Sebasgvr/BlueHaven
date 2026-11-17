# 🎣 Blue Haven

**Explorá. Pescá. Aprendé.**

Juego 3D educativo de pesca y colección para el navegador. Disponible online en
(https://nicori25.github.io/Blue-Haven/)

## ¿De qué se trata?

Recorrer un lago en 3D, lanzar la caña, pescar, vender las capturas y mejorar el equipo, con nueve especies por descubrir. Cada especie tiene su ficha en la **Enciclopedia**, con nombre científico, hábitat, alimentación y un dato curioso. No es un juego de reflejos puro: hay minijuegos de timing, estrategia de equipo y colección.

## Características

- **Mundo 3D explorable**: lago, tienda del muelle, bosque y puente.
- **Nueve especies** combinando fauna real y fantasía (Carpa, Trucha Arcoíris, Atún, Pez Globo, Calamar, Dragón del Lago, Esturión Gigante, Ballena Azul y Pez Remo).
- **Cinco familias de minijuegos** según la rareza del ejemplar: anillo, brújula, ritmo, esquiva y multietapa.
- **Enciclopedia desbloqueable**: al capturar una especie se registran sus datos en la guía.
- **Tienda y economía**: vendé capturas, comprá cañas, cebos y anzuelos; cada cebo dura cinco lanzamientos.
- **Progreso guardado**: como invitado queda en el navegador; con cuenta se conserva en la nube y participa del **ranking público**.
- **Calidad gráfica ajustable** (baja/media/alta) y juego también en pantallas táctiles.

## Cómo jugar

**Jugar online**

Abrí (https://nicori25.github.io/Blue-Haven/) y elegí **Jugar sin cuenta** para ir directo, o creá una cuenta con email y contraseña.

**Jugar en tu computadora**

Requiere cualquier servidor estático. Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Después abrí **http://localhost:8000** y elegí **Jugar sin cuenta**. Las cuentas (guardado en la nube y ranking) requieren configurar la base de datos; quien mantenga el proyecto encuentra esa guía en [`supabase/README.md`](supabase/README.md).

> No abras `index.html` directamente con doble clic (`file://`): el navegador bloquea la carga de modelos y texturas.

## Controles

| Acción                       | Control                                   |
| ---------------------------- | ----------------------------------------- |
| Moverse                      | W, A, S, D                                |
| Mirar                        | Mouse (tras hacer clic en la escena)      |
| Saltar / enganchar / pulso   | Espacio                                   |
| Agacharse                    | Control                                   |
| Lanzar / recoger / arriesgar | F                                         |
| Entrar a la tienda           | E                                         |
| Mochila y equipo             | I                                         |
| Enciclopedia                 | L                                         |
| Guía de pesca                | Q                                         |
| Ajustes                      | Escape                                    |
| Ranking                      | Cartel junto a la tienda (tocar/clic o R) |
| Ritmo                        | A, S, D o Z, X, C                         |

Acercate a la tienda y presioná **E** para entrar, aunque no lleves peces. Con **I** cambiás el equipo desde cualquier parte del mapa.

## Equipo

| Equipo                   | Precio | Efecto                         |
| ------------------------ | ------ | ------------------------------ |
| Caña de bambú            | $150   | Minijuegos un 15 % más fáciles |
| Caña de metal            | $500   | Minijuegos un 25 % más fáciles |
| Lombrices (paquete de 5) | $35    | La picada llega un 30 % antes  |
| Mariscos (paquete de 5)  | $75    | Mejor sorteo de especies raras |
| Anzuelo de precisión     | $90    | +0,15 s para enganchar         |
| Anzuelo reforzado        | $200   | Minijuegos un 10 % más fáciles |

Las cañas y los anzuelos son permanentes; los cebos se consumen con cada lanzamiento.

## Blue Haven para docentes

El juego está pensado como puerta de entrada a temas de ciencias naturales:

- **Especies y clasificación**: nombre común y científico, rareza, estado de descubrimiento.
- **Hábitats y alimentación**: cada ficha muestra dónde vive y qué come cada especie.
- **Ciclos y cadenas tróficas**: peces de agua dulce y marinos conviviendo en un mismo ecosistema (con licencia para hablar del tema sin que el realismo biológico frene la diversión).
- **Hábitos de lectura**: la guía de pesca y la enciclopedia premian consultar antes de lanzarse a pescar.

El juego funciona sin cuenta ni conexión durante la partida, lo que lo hace práctico para aulas con poco equipamiento: se instala una vez y se puede jugar como invitado; las cuentas solo suman guardado en la nube y ranking.

## Créditos

Basado en el trabajo de [Sebasgvr/BlueHaven](https://github.com/Sebasgvr/BlueHaven), con aportes de `diseños`. Modelos 3D: ver licencias en `models/`. Fuente **Press Start 2P** de CodeMan38 (SIL Open Font License). Audio y arte propios del proyecto.
