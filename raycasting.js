function lanzarRayo(angulo) {

    const direccionX = cos(angulo);
    const direccionY = sin(angulo);

    let celdaX = floor(jugador.posicion.x / tamanoCelda);
    let celdaY = floor(jugador.posicion.y / tamanoCelda);

    const pasoX = direccionX < 0 ? -1 : 1;
    const pasoY = direccionY < 0 ? -1 : 1;

    const distanciaX = direccionX === 0
        ? Infinity
        : abs(1 / direccionX);

    const distanciaY = direccionY === 0
        ? Infinity
        : abs(1 / direccionY);

    let siguienteX;
    let siguienteY;

    if (direccionX < 0) {

        siguienteX =
            (jugador.posicion.x / tamanoCelda - celdaX)
            * distanciaX;

    } else {

        siguienteX =
            (celdaX + 1 - jugador.posicion.x / tamanoCelda)
            * distanciaX;
    }

    if (direccionY < 0) {

        siguienteY =
            (jugador.posicion.y / tamanoCelda - celdaY)
            * distanciaY;

    } else {

        siguienteY =
            (celdaY + 1 - jugador.posicion.y / tamanoCelda)
            * distanciaY;
    }

    let distancia = 0;
    let lado = 0;

    while (distancia < 100) {

        if (siguienteX < siguienteY) {

            distancia = siguienteX;
            siguienteX += distanciaX;
            celdaX += pasoX;

            lado = 0;

        } else {

            distancia = siguienteY;
            siguienteY += distanciaY;
            celdaY += pasoY;

            lado = 1;
        }

        if (
            celdaX < 0 ||
            celdaY < 0 ||
            celdaY >= mapa.length ||
            celdaX >= mapa[celdaY].length
        ) {
            return null;
        }

        if (mapa[celdaY][celdaX] === 1) {

            const distanciaReal =
                distancia * tamanoCelda;

            let punto;

            if (lado === 0) {

                punto =
                    jugador.posicion.y +
                    distanciaReal * direccionY;

            } else {

                punto =
                    jugador.posicion.x +
                    distanciaReal * direccionX;
            }

            let texturaX =
                (punto % tamanoCelda) / tamanoCelda;

            if (texturaX < 0) {
                texturaX += 1;
            }

            return {
                distancia: distanciaReal,
                texturaX: texturaX,
                lado: lado
            };
        }
    }

    return null;
}