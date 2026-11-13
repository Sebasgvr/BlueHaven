const MECANICAS_POR_RAREZA = {
  1: [
    {
      id: "anillo_doble",
      nombre: "Doble pulso",
      descripcion: "Cada ciclo pide dos pulsos seguidos.",
    },
    {
      id: "anillo_falso",
      nombre: "Anillo falso",
      descripcion: "No pulses el anillo rojo: esperá a que se vaya.",
    },
    {
      id: "anillo_zona",
      nombre: "Zona móvil",
      descripcion:
        "La zona dorada gira; si coincide arriba, el pulso es perfecto.",
    },
  ],
  2: [
    {
      id: "brujula_canal",
      nombre: "Canal móvil",
      descripcion: "La zona verde se desplaza lentamente.",
    },
    {
      id: "brujula_rafaga",
      nombre: "Ráfagas",
      descripcion: "El pez pega tirones fuertes, avisados con un cartel.",
    },
    {
      id: "brujula_nudo",
      nombre: "Nudo",
      descripcion: "Cuando aparezca el nudo, agarralo y soltá para deshacerlo.",
    },
  ],
  3: [
    {
      id: "ritmo_dobles",
      nombre: "Notas dobles",
      descripcion: "Dos notas caen al mismo tiempo en pistas distintas.",
    },
    {
      id: "ritmo_falsas",
      nombre: "Notas falsas",
      descripcion: "Las notas rojas no se tocan.",
    },
    {
      id: "ritmo_largas",
      nombre: "Notas largas",
      descripcion: "Mantené la tecla hasta que la nota se consuma.",
    },
  ],
  4: [
    {
      id: "esquiva_zigzag",
      nombre: "Basura zigzag",
      descripcion: "Algunos obstáculos se mueven de lado mientras caen.",
    },
    {
      id: "esquiva_perseguidor",
      nombre: "Pez perseguidor",
      descripcion: "Un pez te sigue; no te quedes quieto.",
    },
    {
      id: "esquiva_pared",
      nombre: "Pared con hueco",
      descripcion: "Alineate con el hueco para pasar.",
    },
  ],
  5: [
    {
      id: "multi_qte",
      nombre: "Transición QTE",
      descripcion: "Entre fases, acertá la barra verde para recuperar tensión.",
    },
    {
      id: "multi_sprint",
      nombre: "Sprint final",
      descripcion: "La última fase va más rápida.",
    },
    {
      id: "multi_tension",
      nombre: "Tensión compartida",
      descripcion: "La tensión se acumula entre fases; no llega a 100.",
    },
  ],
};

const MECANICA_POR_ID = {};
for (const lista of Object.values(MECANICAS_POR_RAREZA)) {
  for (const mecanica of lista) MECANICA_POR_ID[mecanica.id] = mecanica;
}

function mecanicasDe(rareza) {
  return MECANICAS_POR_RAREZA[rareza] || [];
}

function calcularMecanicas(pez, riesgo) {
  const calidad = calidadDe(pez);
  const cantidad = riesgo
    ? Math.min(3, calidad.nivel)
    : Math.max(0, calidad.nivel - 1);
  return mecanicasDe(pez && pez.rareza)
    .slice(0, cantidad)
    .map((mecanica) => mecanica.id);
}

function nombreMecanica(id) {
  return MECANICA_POR_ID[id] ? MECANICA_POR_ID[id].nombre : id;
}

function nombresMecanicas(ids) {
  return ids.map(nombreMecanica);
}

function dibujarMecanicasActivas(mini, y) {
  if (!mini || !mini.mecanicas || mini.mecanicas.length === 0) return;
  push();
  fill(160, 182, 205);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(
    "Mecánicas: " + nombresMecanicas(mini.mecanicas).join(" · "),
    width / 2,
    y,
    Math.min(width - 80, 760),
  );
  pop();
}
