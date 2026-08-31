class Jugador {
  constructor(x, y) {
    this.posicion = createVector(x, y);
    this.angulo = 0;
    this.velocidad = 2.5;
    this.velocidadGiro = 0.045;
    this.fov = radians(66);
    this.margenColision = 10;
  }

  mover(cantidad) {
    const dir = p5.Vector.fromAngle(this.angulo).mult(
      cantidad * this.velocidad,
    );

    const nuevoX = createVector(this.posicion.x + dir.x, this.posicion.y);
    const nuevoY = createVector(this.posicion.x, this.posicion.y + dir.y);

    if (!this._hayColision(nuevoX)) this.posicion.x = nuevoX.x;
    if (!this._hayColision(nuevoY)) this.posicion.y = nuevoY.y;
  }

  _hayColision(pos) {
    const m = this.margenColision;

    const puntosX = [pos.x - m, pos.x + m];
    const puntosY = [pos.y - m, pos.y + m];

    for (let px of puntosX) {
      for (let py of puntosY) {
        const cx = floor(px / TAMAÑO_CELDA);
        const cy = floor(py / TAMAÑO_CELDA);
        if (esPared(cx, cy)) return true;
      }
    }
    return false;
  }

  girar(cantidad) {
    this.angulo += cantidad * this.velocidadGiro;
  }

  actualizar() {
    if (keyIsDown(87)) this.mover(1);
    if (keyIsDown(83)) this.mover(-1);
    if (keyIsDown(65)) this.girar(-1);
    if (keyIsDown(68)) this.girar(1);
  }

  dibujar() {
    fill(255, 0, 0);
    noStroke();
    circle(this.posicion.x, this.posicion.y, 12);

    const dir = p5.Vector.fromAngle(this.angulo);
    stroke(255, 255, 0);
    line(
      this.posicion.x,
      this.posicion.y,
      this.posicion.x + dir.x * 30,
      this.posicion.y + dir.y * 30,
    );
  }
}
