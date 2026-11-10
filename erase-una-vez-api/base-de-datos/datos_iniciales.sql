INSERT INTO rol (nombre, descripcion) VALUES
  ('ADMINISTRADOR', 'Gestiona cartelera, usuarios, cursos y reportes'),
  ('RECEPCION', 'Valida entradas en puerta'),
  ('COMPRADOR', 'Público que compra boletos e inscribe a cursos'),
  ('DOCENTE', 'Dicta cursos y talleres');

-- Ajusta el nombre, la dirección y la capacidad a los datos reales del teatro
INSERT INTO sala (nombre, direccion, capacidad)
VALUES ('Sala principal', 'Dirección del teatro', 100);

-- Asientos de ejemplo: 10 filas (A-J) x 10 números = 100 asientos. Filas A y B: preferenciales
INSERT INTO asiento (id_sala, fila, numero, zona, tipo_asiento)
SELECT s.id_sala, chr(64 + f), n, 'General',
       CASE WHEN f <= 2 THEN 'PREFERENCIAL' ELSE 'GENERAL' END
FROM sala s, generate_series(1, 10) f, generate_series(1, 10) n
WHERE s.nombre = 'Sala principal';