class MinijuegoPesca {
  constructor(pez) {
    this.pez = pez;
    this.escala = (pez && pez.escalaDificultad) || 1;
    this.tiempo = 0;
    this.botonPresionado = false;
    this.resultado = null; // capturado o linea_rota o pez_escapado
    this.mecanicas = (pez && pez.mecanicasActivas) || [];
  }

  tieneMecanica(id) {
    return this.mecanicas.indexOf(id) !== -1;
  }

  presionarBoton() {
    this.botonPresionado = true;
  }

  soltarBoton() {
    this.botonPresionado = false;
  }

  soltarTecla(entrada) {}

  actualizar(dt) {}

  dibujar() {}

  aceptaTeclas() {
    return false;
  }

  _terminar(tipo) {
    this.resultado = tipo;
  }
}

function dibujarBarrasPesca(progreso, tension) {
  const barAlto = height * 0.4;
  const barY = height * 0.28;

  const progX = width * 0.04;
  fill(16, 17, 20);
  rect(progX, barY, 24, barAlto, 5);
  const progH = barAlto * (progreso / 100);
  fill(55, 140, 255);
  rect(progX + 2, barY + barAlto - progH, 20, progH, 4);
  fill(180, 215, 255);
  textAlign(CENTER, CENTER);
  textSize(11);
  text(`${floor(progreso)}%`, progX + 12, barY - 14);
  text("PESCA", progX + 12, barY + barAlto + 14);

  const tensX = width * 0.09;
  fill(16, 17, 20);
  rect(tensX, barY, 24, barAlto, 5);
  const tensH = barAlto * (tension / 100);
  let cTens;
  if (tension < 40) cTens = color(50, 200, 50);
  else if (tension < 70) cTens = color(255, 200, 40);
  else cTens = color(255, 50, 50);
  fill(cTens);
  rect(tensX + 2, barY + barAlto - tensH, 20, tensH, 4);
  fill(cTens);
  textAlign(CENTER, CENTER);
  textSize(11);
  text(`${floor(tension)}%`, tensX + 12, barY - 14);
  text("TENSIÓN", tensX + 12, barY + barAlto + 14);
}

const ANGULO_VERDE = 18;
const ANGULO_LIMITE = 80;

function dibujarSpritePez(pez) {
  if (!pez) return;

  const x = width - 62;
  const y = height * 0.02;
  const tam = 52;
  const calidad = calidadDe(pez);
  const imagen = pez.sprite && spritesPeces && spritesPeces[pez.sprite];

  noFill();
  stroke(
    calidad.color[0],
    calidad.color[1],
    calidad.color[2],
    calidad.id === "comun" ? 110 : 235,
  );
  strokeWeight(calidad.nivel >= 4 ? 4 : 2.5);
  rect(x - 3, y - 3, tam + 6, tam + 6, 9);
  noStroke();

  if (imagen) image(imagen, x, y, tam, tam);

  dibujarEtiquetaCalidad(calidad, width - 10, y + tam + 12, 9, "derecha");
}
