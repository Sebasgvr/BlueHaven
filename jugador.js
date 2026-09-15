class Jugador {
  constructor(x, y) {
    this.posicion = createVector(x, y);
    this.angulo = 0;
    this.inclinacion = 0;
    this.velocidad = 2.5;
    this.velocidadGiro = 0.045;
    this.velocidadMirada = 0.025;
    this.fov = radians(66);
    this.margenColision = 10;
    this.alturaSalto = 0;
    this.velocidadSalto = 0;
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

  moverLateral(cantidad) {
    const dir = createVector(-Math.sin(this.angulo), Math.cos(this.angulo));
    dir.mult(cantidad * this.velocidad);

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
        if (esPared(cx, cy) || tiendaColisiona(pos)) return true;
      }
    }
    return false;
  }

  girar(cantidad) {
    this.angulo += cantidad * this.velocidadGiro;
  }

  girarMouse(cantidad) {
    this.angulo += cantidad * 0.0025;
  }

  mirar(cantidad) {
    this.inclinacion = constrain(this.inclinacion + cantidad * this.velocidadMirada, -0.8, 0.8);
  }

  mirarMouse(cantidad) {
    this.inclinacion = constrain(this.inclinacion + cantidad * 0.0025, -0.8, 0.8);
  }

  saltar() {
    if (this.alturaSalto > 0) return;
    this.velocidadSalto = 360;
  }

  actualizar() {
    if (keyIsDown(87)) this.mover(1);
    if (keyIsDown(83)) this.mover(-1);
    if (keyIsDown(65)) this.moverLateral(-1);
    if (keyIsDown(68)) this.moverLateral(1);
    if (keyIsDown(UP_ARROW)) this.mirar(1);
    if (keyIsDown(DOWN_ARROW)) this.mirar(-1);

    const dt = Math.min(deltaTime / 1000, 0.05);
    this.velocidadSalto -= 900 * dt;
    this.alturaSalto = Math.max(0, this.alturaSalto + this.velocidadSalto * dt);
    if (this.alturaSalto === 0) this.velocidadSalto = 0;
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
