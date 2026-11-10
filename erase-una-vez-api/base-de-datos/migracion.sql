-- Migración de la base de datos v2 (15 tablas) a v3 (18 tablas)
-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor. Si algo falla, no se cambia nada (todo va en una transacción).

BEGIN;

-- 1. Tabla función -> presentacion
ALTER TABLE funcion RENAME TO presentacion;
ALTER TABLE presentacion RENAME COLUMN id_funcion TO id_presentacion;
ALTER TABLE venta RENAME COLUMN id_funcion TO id_presentacion;
ALTER TABLE boleto RENAME COLUMN id_funcion TO id_presentacion;
ALTER SEQUENCE IF EXISTS funcion_id_funcion_seq RENAME TO presentacion_id_presentacion_seq;
DROP VIEW IF EXISTS vista_reporte_funcion;

-- 2. Tipo de asiento
ALTER TABLE asiento ADD COLUMN tipo_asiento VARCHAR(15) NOT NULL DEFAULT 'GENERAL'
  CHECK (tipo_asiento IN ('GENERAL','PREFERENCIAL','VIP'));
UPDATE asiento SET tipo_asiento = 'PREFERENCIAL' WHERE fila IN ('A','B');

-- 3. Tabla mensualidad -> pago_mensualidad
ALTER TABLE mensualidad RENAME TO pago_mensualidad;
ALTER TABLE pago_mensualidad RENAME COLUMN id_mensualidad TO id_pago_mensualidad;
ALTER SEQUENCE IF EXISTS mensualidad_id_mensualidad_seq RENAME TO pago_mensualidad_id_pago_mensualidad_seq;

-- 4. Herencia de usuario
CREATE TABLE administrador (
  id_usuario INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  cargo VARCHAR(60)
);
CREATE TABLE personal_recepcion (
  id_usuario INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  turno VARCHAR(20)
);
CREATE TABLE docente (
  id_usuario INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  especialidad VARCHAR(80)
);

-- Rol de docente (si existía "Instructor", se renombra)
UPDATE rol SET nombre = 'DOCENTE', descripcion = 'Dicta cursos y talleres' WHERE nombre = 'Instructor';
INSERT INTO rol (nombre, descripcion)
SELECT 'DOCENTE', 'Dicta cursos y talleres'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'DOCENTE');

-- Los usuarios que ya existían pasan a su tabla hija según su rol
INSERT INTO administrador (id_usuario)
SELECT u.id_usuario FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
WHERE r.nombre = 'ADMINISTRADOR' ON CONFLICT DO NOTHING;
INSERT INTO personal_recepcion (id_usuario)
SELECT u.id_usuario FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
WHERE r.nombre = 'RECEPCION' ON CONFLICT DO NOTHING;
INSERT INTO docente (id_usuario)
SELECT u.id_usuario FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
WHERE r.nombre = 'DOCENTE' ON CONFLICT DO NOTHING;

-- 5. Curso: el instructor pasa a ser docente
INSERT INTO docente (id_usuario)
SELECT DISTINCT id_instructor FROM curso WHERE id_instructor IS NOT NULL ON CONFLICT DO NOTHING;
ALTER TABLE curso DROP CONSTRAINT IF EXISTS curso_id_instructor_fkey;
ALTER TABLE curso RENAME COLUMN id_instructor TO id_docente;
ALTER TABLE curso ADD CONSTRAINT curso_id_docente_fkey FOREIGN KEY (id_docente) REFERENCES docente(id_usuario);

-- 6. Vista de reportes con el nuevo nombre
CREATE VIEW vista_reporte_presentacion AS
SELECT f.id_presentacion, o.titulo, f.fecha,
  COUNT(b.id_boleto) FILTER (WHERE b.tipo = 'PAGADO'
    AND b.estado IN ('EMITIDO','USADO')) AS boletos_vendidos,
  COUNT(b.id_boleto) FILTER (WHERE b.tipo = 'GRATUITO'
    AND b.estado IN ('EMITIDO','USADO')) AS entradas_gratuitas,
  COALESCE(SUM(b.precio) FILTER (WHERE b.tipo = 'PAGADO'
    AND b.estado IN ('EMITIDO','USADO')), 0) AS ingresos,
  COUNT(i.id_ingreso) AS asistentes
FROM presentacion f
JOIN obra o ON o.id_obra = f.id_obra
LEFT JOIN boleto b ON b.id_presentacion = f.id_presentacion
LEFT JOIN ingreso i ON i.id_boleto = b.id_boleto
GROUP BY f.id_presentacion, o.titulo, f.fecha;

COMMIT;
