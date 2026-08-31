const tamanoCelda = 64;

const mapa = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
];

let jugador;

let texturaPared;
let texturaCielo;

function preload() {

    texturaPared = loadImage("texturas/pared.png");
    texturaCielo = loadImage("texturas/cielo.png");
}

function setup() {

    createCanvas(windowWidth, windowHeight);

    noSmooth();

    jugador = new Player(320, 320);
}

function draw() {

    jugador.actualizar();

    renderizarEscena();
}

function renderizarEscena() {

    dibujarCielo();
    dibujarSuelo();

    const cantidadRayos = width;

    for (let x = 0; x < cantidadRayos; x++) {

        const porcentaje = x / cantidadRayos;

        const anguloRayo =
            jugador.angulo -
            jugador.fov / 2 +
            porcentaje * jugador.fov;

        const resultado = lanzarRayo(anguloRayo);

        if (resultado !== null) {

            const distanciaCorregida =
                resultado.distancia *
                cos(anguloRayo - jugador.angulo);

            const alturaPared =
                (tamanoCelda / distanciaCorregida) *
                height;

            const centroPantalla = height / 2;

            const arriba =
                centroPantalla -
                alturaPared / 2;

            const abajo =
                centroPantalla +
                alturaPared / 2;

            dibujarPared(
                x,
                arriba,
                abajo,
                resultado.texturaX
            );
        }
    }
}

function dibujarPared(x, arriba, abajo, texturaX) {

    const posicionX =
        floor(texturaX * texturaPared.width);

    copy(
        texturaPared,
        posicionX,
        0,
        1,
        texturaPared.height,
        x,
        arriba,
        1,
        abajo - arriba
    );
}

function dibujarCielo() {

    image(
        texturaCielo,
        0,
        0,
        width,
        height / 2
    );
}

function dibujarSuelo() {

    noStroke();

    fill(70, 120, 90);

    rect(
        0,
        height / 2,
        width,
        height / 2
    );
}

function windowResized() {

    resizeCanvas(
        windowWidth,
        windowHeight
    );
}