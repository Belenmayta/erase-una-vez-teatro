-- Insertar los dos talleres de Formación Artística
-- Taller 1: Niños
WITH nuevo AS (
  INSERT INTO curso (nombre, descripcion, publico, cupo_maximo, mensualidad, fecha_inicio, estado)
  VALUES (
    'Taller de Formación Artística — Niños',
    'Clases de formación artística y teatral para niños y niñas. Se trabaja expresión corporal, juego dramático, imaginación y trabajo en equipo. Ideal para edades de 6 a 12 años.',
    'NINOS',
    20,
    180,
    CURRENT_DATE,
    'ACTIVO'
  )
  RETURNING id_curso
)
INSERT INTO horario_curso (id_curso, dia_semana, hora_inicio, hora_fin)
SELECT id_curso, dia, '18:30', '19:30'
FROM nuevo, (VALUES (1), (3)) AS dias(dia);

-- Taller 2: Jóvenes y Mayores
WITH nuevo AS (
  INSERT INTO curso (nombre, descripcion, publico, cupo_maximo, mensualidad, fecha_inicio, estado)
  VALUES (
    'Taller de Formación Artística — Jóvenes y Mayores',
    'Clases de formación artística y teatral para jóvenes y adultos. Se trabaja expresión escénica, desinhibición, trabajo en equipo y autoconocimiento a través del teatro. Para mayores de 13 años.',
    'JOVENES',
    20,
    180,
    CURRENT_DATE,
    'ACTIVO'
  )
  RETURNING id_curso
)
INSERT INTO horario_curso (id_curso, dia_semana, hora_inicio, hora_fin)
SELECT id_curso, dia, '19:30', '21:00'
FROM nuevo, (VALUES (1), (3)) AS dias(dia);
