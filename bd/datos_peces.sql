-- ============================================================
-- BlueHaven — Datos completos de las 8 especies cargadas
-- Actualiza habitat, anzuelo, línea, cebo, tamaño, peso y
-- descripción de los peces que ya existen en la tabla `peces`.
-- Se ejecuta con UPDATE por id, así que solo tocamos estos campos.
-- ============================================================

-- 1. Carpa (Común)
UPDATE peces SET
  habitat = 'Lagos, lagunas y ríos de corriente lenta con fondo fangoso',
  anzuelo_recomendado = 'Anzuelo del n.º 6 al n.º 10',
  linea_recomendada = 'Monofilamento de 0.30 a 0.35 mm',
  cebo_recomendado = 'Maíz dulce, pan, lombriz y masas tipo boilie',
  `tamaño_cm` = 70,
  peso_kg = 4,
  descripcion = 'Pez resistente y de costumbres tranquilas. Se alimenta en el fondo y pica con suavidad. Ideal para aprender a pescar con paciencia.'
WHERE id = 1;

-- 2. Trucha Arcoíris (Poco común)
UPDATE peces SET
  habitat = 'Ríos y arroyos de agua fría y bien oxigenada, lagos de montaña',
  anzuelo_recomendado = 'Anzuelo del n.º 8 al n.º 12',
  linea_recomendada = 'Monofilamento de 0.20 a 0.25 mm',
  cebo_recomendado = 'Lombriz, larvas, spinners y moscas artificiales',
  `tamaño_cm` = 55,
  peso_kg = 2,
  descripcion = 'Depredadora ágil que se reconoce por su banda rojiza. Pica con fuerza y pelea dando saltos. Necesita presentaciones finas y naturales.'
WHERE id = 2;

-- 3. Atún (Poco común)
UPDATE peces SET
  habitat = 'Aguas oceánicas abiertas, mar adentro cerca de corrientes cálidas',
  anzuelo_recomendado = 'Anzuelos grandes del 7/0 al 10/0',
  linea_recomendada = 'Trenzada de 50 a 80 lb',
  cebo_recomendado = 'Sardina, caballa, calamar y señuelos grandes de superficie',
  `tamaño_cm` = 210,
  peso_kg = 200,
  descripcion = 'Uno de los peces más veloces y potentes del océano. Recorre grandes distancias siguiendo su alimento. Pescar uno es una batalla de resistencia.'
WHERE id = 3;

-- 4. Calamar (Raro)
UPDATE peces SET
  habitat = 'Aguas costeras y mar abierto; de día a mayor profundidad, de noche cerca de la superficie',
  anzuelo_recomendado = 'Potera o jig luminoso (no usa anzuelo común)',
  linea_recomendada = 'Monofilamento de 0.35 a 0.40 mm',
  cebo_recomendado = 'Poteras luminosas, señuelos brillantes y sardina',
  `tamaño_cm` = 50,
  peso_kg = 1.5,
  descripcion = 'Cefalópodo inteligente que captura presas con sus tentáculos. Se siente atraído por la luz, por eso se pesca de noche con poteras luminosas.'
WHERE id = 4;

-- 5. Dragón del Lago (Raro)
UPDATE peces SET
  habitat = 'La zona más profunda y misteriosa del lago central',
  anzuelo_recomendado = 'Anzuelo reforzado del 4/0 al 6/0',
  linea_recomendada = 'Trenzada de 40 a 60 lb',
  cebo_recomendado = 'Pez entero, señuelos grandes y carnadas de fondo',
  `tamaño_cm` = 300,
  peso_kg = 80,
  descripcion = 'Criatura legendaria que solo aparece en las leyendas de los pescadores. Conocé las profundidades y usá un equipo fuerte para encontrarlo.'
WHERE id = 5;

-- 6. Esturión Gigante (Épico)
UPDATE peces SET
  habitat = 'Fondos profundos de ríos grandes y lagos de aguas frías',
  anzuelo_recomendado = 'Anzuelo del 2/0 al 5/0, muy resistente',
  linea_recomendada = 'Trenzada de 60 a 100 lb',
  cebo_recomendado = 'Lombrices grandes, trozos de pescado y salmón',
  `tamaño_cm` = 300,
  peso_kg = 150,
  descripcion = 'Un verdadero fósil viviente: existe hace más de 200 millones de años. Crece muy despacio y vive décadas. Pescar uno es un premio a la paciencia.'
WHERE id = 6;

-- 7. Ballena Azul (Épico)
UPDATE peces SET
  habitat = 'Océano abierto, aguas frías y templadas de todo el planeta',
  anzuelo_recomendado = 'No se pesca con caña: especie protegida',
  linea_recomendada = 'No se pesca con caña: especie protegida',
  cebo_recomendado = 'No se pesca con caña: especie protegida',
  `tamaño_cm` = 3000,
  peso_kg = 150000,
  descripcion = 'El animal más grande que existe en la Tierra. Se alimenta por filtración de pequeños crustáceos llamados kril. Avistarla en BlueHaven es único.'
WHERE id = 7;

-- 8. Pez Remo (Legendario)
UPDATE peces SET
  habitat = 'Aguas oceánicas profundas, entre 200 y 1000 metros',
  anzuelo_recomendado = 'Anzuelo forjado del 6/0 al 8/0 con plomada de profundidad',
  linea_recomendada = 'Trenzada gruesa de 80 a 120 lb',
  cebo_recomendado = 'Pescados enteros y carnadas luminosas de profundidad',
  `tamaño_cm` = 800,
  peso_kg = 150,
  descripcion = 'Casi nunca se ve cerca de la superficie: es un pez abisal. Su cuerpo plateado en forma de cinta inspiró las leyendas de las "serpientes de mar".'
WHERE id = 8;