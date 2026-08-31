class Player {

    constructor(x, y) {
        this.posicion = createVector(x, y);
        this.angulo = 0;
        this.velocidad = 3;
        this.velocidadGiro = 0.05;
        this.fov = HALF_PI;
    }

    mover(cantidad) {

        const direccion = p5.Vector.fromAngle(this.angulo);

        direccion.mult(cantidad * this.velocidad);

        const nuevaPosicion = p5.Vector.add(
            this.posicion,
            direccion
        );

        if (!this.hayColision(nuevaPosicion)) {
            this.posicion = nuevaPosicion;
        }
    }

    hayColision(posicion) {

        const celdaX = floor(posicion.x / tamanoCelda);
        const celdaY = floor(posicion.y / tamanoCelda);

        if (
            celdaX < 0 ||
            celdaY < 0 ||
            celdaY >= mapa.length ||
            celdaX >= mapa[celdaY].length
        ) {
            return true;
        }

        return mapa[celdaY][celdaX] === 1;
    }

    girar(cantidad) {
        this.angulo += cantidad * this.velocidadGiro;
    }

    actualizar() {

        if (keyIsDown(87)) {
            this.mover(1);
        }

        if (keyIsDown(83)) {
            this.mover(-1);
        }

        if (keyIsDown(65)) {
            this.girar(-1);
        }

        if (keyIsDown(68)) {
            this.girar(1);
        }
    }

    dibujar() {

        fill(255, 0, 0);

        circle(
            this.posicion.x,
            this.posicion.y,
            12
        );

        const direccion = p5.Vector.fromAngle(this.angulo);

        line(
            this.posicion.x,
            this.posicion.y,
            this.posicion.x + direccion.x * 30,
            this.posicion.y + direccion.y * 30
        );
    }
}