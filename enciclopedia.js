const ENCICLOPEDIA = {
  abierta: false,
  indiceSeleccionado: 0,
  peces: [
    {
      nombre: "Carpa",
      nombreCientifico: "Cyprinus carpio",
      rareza: 1,
      sprite: null,
      habitat: "Aguas tranquilas de lagos y ríos lentos",
      alimentacion: "Omnívoro: plantas, insectos, gusanos",
      tamaño: "30-50 cm",
      peso: "1-3 kg",
      dificultad: "Fácil",
      descripcion:
        "La carpa es un pez resistente y común en aguas dulces. Es ideal para principiantes.",
      ceboRecomendado: "Lombriz o masa",
      datoCurioso: "Puede vivir hasta 20 años en condiciones ideales.",
    },
    {
      nombre: "Trucha Arcoíris",
      nombreCientifico: "Oncorhynchus mykiss",
      rareza: 2,
      sprite: null,
      habitat: "Ríos y arroyos de aguas frías y oxigenadas",
      alimentacion: "Carnívoro: insectos, pequeños peces, crustáceos",
      tamaño: "25-40 cm",
      peso: "0.5-2 kg",
      dificultad: "Media",
      descripcion:
        "Conocida por su coloración iridiscente. Es un pez deportivo muy valorado.",
      ceboRecomendado: "Mosca o cucharilla",
      datoCurioso:
        "Su nombre proviene de la franja rosada que recorre su costado.",
    },
    {
      nombre: "Atún",
      nombreCientifico: "Thunnus thynnus",
      rareza: 2,
      sprite: "Atun.png",
      habitat: "Aguas abiertas del océano",
      alimentacion: "Carnívoro: peces pequeños, calamares, crustáceos",
      tamaño: "50-100 cm",
      peso: "5-20 kg",
      dificultad: "Media",
      descripcion: "Un nadador veloz y poderoso. Requiere equipo resistente.",
      ceboRecomendado: "Señuelo artificial",
      datoCurioso: "Puede nadar a 70 km/h y sumergirse a 1000 metros.",
    },
    {
      nombre: "Calamar",
      nombreCientifico: "Loligo vulgaris",
      rareza: 3,
      sprite: "Calamar.png",
      habitat: "Aguas costeras y mar abierto",
      alimentacion: "Carnívoro: peces pequeños, crustáceos",
      tamaño: "20-40 cm",
      peso: "0.5-2 kg",
      dificultad: "Difícil",
      descripcion:
        "Molusco cefalópodo de cuerpo alargado. Es escurridizo y rápido.",
      ceboRecomendado: "Señuelo luminoso",
      datoCurioso: "Tiene tres corazones y sangre azul.",
    },
    {
      nombre: "Dragón del Lago",
      nombreCientifico: "Draco lacustris",
      rareza: 3,
      sprite: null,
      habitat: "Aguas profundas y oscuras",
      alimentacion: "Desconocida",
      tamaño: "???",
      peso: "???",
      dificultad: "Difícil",
      descripcion: "Una criatura mítica que pocos pescadores han logrado ver.",
      ceboRecomendado: "???",
      datoCurioso: "Se dice que solo aparece en noches de luna llena.",
    },
    {
      nombre: "Esturión Gigante",
      nombreCientifico: "Huso huso",
      rareza: 4,
      sprite: null,
      habitat: "Aguas profundas de grandes ríos y lagos",
      alimentacion: "Carnívoro: peces, moluscos, crustáceos",
      tamaño: "100-200 cm",
      peso: "20-100 kg",
      dificultad: "Muy difícil",
      descripcion:
        "Un pez prehistórico de gran tamaño. Su captura es un desafío legendario.",
      ceboRecomendado: "Pez vivo o trozo de pescado",
      datoCurioso:
        "Existe desde la era de los dinosaurios, hace 200 millones de años.",
    },
    {
      nombre: "Ballena Azul",
      nombreCientifico: "Balaenoptera musculus",
      rareza: 4,
      sprite: "Ballena_azul.png",
      habitat: "Océanos de todo el mundo",
      alimentacion: "Carnívoro: krill y pequeños peces",
      tamaño: "2000-3000 cm",
      peso: "100000-150000 kg",
      dificultad: "Extrema",
      descripcion: "El animal más grande que jamás ha existido en la Tierra.",
      ceboRecomendado: "???",
      datoCurioso: "Su corazón es del tamaño de un auto pequeño.",
    },
    {
      nombre: "Pez Remo",
      nombreCientifico: "Regalecus glesne",
      rareza: 5,
      sprite: null,
      habitat: "Aguas profundas del océano (200-1000m)",
      alimentacion: "Carnívoro: krill, pequeños peces, calamares",
      tamaño: "300-800 cm",
      peso: "20-50 kg",
      dificultad: "Extrema",
      descripcion:
        "El pez óseo más largo del mundo. Vive en las profundidades abisales.",
      ceboRecomendado: "???",
      datoCurioso:
        "Es considerado el origen de las leyendas de serpientes marinas.",
    },
  ],
};

function abrirEnciclopedia() {
  ENCICLOPEDIA.abierta = true;
  ENCICLOPEDIA.indiceSeleccionado = 0;
  if (document.pointerLockElement) document.exitPointerLock();
}

function cerrarEnciclopedia() {
  ENCICLOPEDIA.abierta = false;
}

function navegarEnciclopedia(direccion) {
  const total = ENCICLOPEDIA.peces.length;
  ENCICLOPEDIA.indiceSeleccionado =
    (ENCICLOPEDIA.indiceSeleccionado + direccion + total) % total;
}

function dibujarEnciclopedia() {
  if (!ENCICLOPEDIA.abierta) return;

  push();

  // Fondo oscuro semitransparente
  fill(10, 12, 16, 230);
  rect(0, 0, width, height);

  // Dimensiones del libro
  const margen = 40;
  const anchoLibro = Math.min(700, width - 80);
  const altoLibro = Math.min(500, height - 80);
  const xLibro = (width - anchoLibro) / 2;
  const yLibro = (height - altoLibro) / 2;

  // Marco del libro
  fill(139, 90, 43); // marrón cuero
  noStroke();
  rect(xLibro - 8, yLibro - 8, anchoLibro + 16, altoLibro + 16, 12);
  fill(245, 230, 200); // papel
  rect(xLibro, yLibro, anchoLibro, altoLibro, 8);

  // Línea central del libro
  const xCentro = xLibro + anchoLibro * 0.42;
  stroke(180, 160, 130);
  strokeWeight(2);
  line(xCentro, yLibro + 20, xCentro, yLibro + altoLibro - 20);

  // Título
  fill(80, 50, 20);
  textAlign(CENTER, TOP);
  textSize(22);
  text("ENCICLOPEDIA DE ESPECIES", xLibro + anchoLibro / 2, yLibro + 12);

  // === LADO IZQUIERDO: Lista de peces ===
  const listaX = xLibro + 20;
  const listaY = yLibro + 50;
  const listaAncho = xCentro - xLibro - 40;
  const itemAlto = 40;

  for (let i = 0; i < ENCICLOPEDIA.peces.length; i++) {
    const pez = ENCICLOPEDIA.peces[i];
    const y = listaY + i * itemAlto;
    const seleccionado = i === ENCICLOPEDIA.indiceSeleccionado;

    // Fondo del item seleccionado
    if (seleccionado) {
      fill(200, 170, 120);
      rect(listaX, y, listaAncho, itemAlto - 4, 6);
    }

    // Sprite del pez
    if (pez.sprite && spritesPeces[pez.sprite]) {
      image(spritesPeces[pez.sprite], listaX + 4, y + 2, 32, 32);
    } else {
      // Placeholder para peces sin sprite
      fill(150, 150, 150);
      rect(listaX + 4, y + 2, 32, 32, 4);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(14);
      text("?", listaX + 20, y + 18);
    }

    // Nombre del pez
    fill(seleccionado ? 60 : 80, 40, 20);
    textAlign(LEFT, CENTER);
    textSize(14);
    text(pez.nombre, listaX + 44, y + (itemAlto - 4) / 2);

    // Rareza (estrellas)
    fill(255, 200, 50);
    textSize(10);
    let estrellas = "";
    for (let e = 0; e < pez.rareza; e++) estrellas += "*";
    text(estrellas, listaX + listaAncho - 30, y + (itemAlto - 4) / 2);
  }

  // === LADO DERECHO: Detalles del pez ===
  const detX = xCentro + 20;
  const detY = yLibro + 50;
  const detAncho = xLibro + anchoLibro - detX - 20;
  const pez = ENCICLOPEDIA.peces[ENCICLOPEDIA.indiceSeleccionado];

  // Nombre del pez
  fill(80, 50, 20);
  textAlign(LEFT, TOP);
  textSize(20);
  text(pez.nombre, detX, detY);

  // Nombre científico (cursiva simulada)
  fill(120, 90, 60);
  textSize(12);
  text(pez.nombreCientifico, detX, detY + 26);

  // Sprite grande
  if (pez.sprite && spritesPeces[pez.sprite]) {
    image(spritesPeces[pez.sprite], detX, detY + 45, 64, 64);
  } else {
    fill(200, 200, 200);
    rect(detX, detY + 45, 64, 64, 8);
    fill(150);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("?", detX + 32, detY + 77);
  }

  // Información
  let infoY = detY + 120;
  const lineaAlto = 18;

  fill(60, 40, 20);
  textSize(11);
  textAlign(LEFT, TOP);

  const info = [
    ["Hábitat", pez.habitat],
    ["Alimentación", pez.alimentacion],
    ["Tamaño", pez.tamaño],
    ["Peso", pez.peso],
    ["Dificultad", pez.dificultad],
    ["Cebo recomendado", pez.ceboRecomendado],
  ];

  for (const [label, valor] of info) {
    fill(100, 70, 40);
    text(label + ":", detX, infoY);
    fill(60, 40, 20);
    text(valor, detX + 110, infoY);
    infoY += lineaAlto;
  }

  // Descripción
  infoY += 10;
  fill(100, 70, 40);
  text("Descripción:", detX, infoY);
  infoY += 16;
  fill(60, 40, 20);
  text(pez.descripcion, detX, infoY, detAncho, 60);

  // Dato curioso
  infoY += 50;
  fill(100, 70, 40);
  text("Dato curioso:", detX, infoY);
  infoY += 16;
  fill(60, 40, 20);
  text(pez.datoCurioso, detX, infoY, detAncho, 40);

  // Instrucciones
  fill(150, 130, 100);
  textAlign(CENTER, BOTTOM);
  textSize(11);
  text(
    "[W/S] Navegar  -  [E/ESC] Cerrar",
    xLibro + anchoLibro / 2,
    yLibro + altoLibro - 10,
  );

  pop();
}
