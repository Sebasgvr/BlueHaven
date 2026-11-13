-- Ejecutar una vez después de bluehaven_db.sql en instalaciones existentes.
ALTER TABLE usuarios ADD COLUMN tiene_bambu TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE inventario_peces
  ADD COLUMN calidad_id VARCHAR(20) NOT NULL DEFAULT 'comun',
  ADD COLUMN captura_riesgo TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN precio INT NOT NULL DEFAULT 0;
UPDATE inventario_peces ip JOIN peces p ON p.id=ip.pez_id
SET ip.precio=CASE p.rareza WHEN 1 THEN 50 WHEN 2 THEN 120 WHEN 3 THEN 300 WHEN 4 THEN 800 WHEN 5 THEN 2000 ELSE 10 END;
CREATE TABLE eventos_captura (
  usuario_id INT NOT NULL,
  token VARCHAR(64) NOT NULL,
  inventario_id INT DEFAULT NULL,
  precio INT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id,token),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO peces (nombre,rareza,velocidad,sprite,habitat,anzuelo_recomendado,linea_recomendada,cebo_recomendado,`tamaño_cm`,peso_kg,descripcion)
VALUES ('Pez Globo',2,2,'Pez_Globo.png','Aguas costeras tropicales y arrecifes','Anzuelo pequeño','Monofilamento fino','Camarón o molusco',25,1,'Se infla como defensa. Algunas especies contienen tetrodotoxina.')
ON DUPLICATE KEY UPDATE sprite=VALUES(sprite);
