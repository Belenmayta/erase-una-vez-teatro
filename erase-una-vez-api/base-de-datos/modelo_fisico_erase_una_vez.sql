-- Modelo físico v3: Sistema web de la Compañía de Teatro Érase una Vez (PostgreSQL / Supabase)
-- 18 tablas. Para una base de datos NUEVA y vacía. Si ya ejecutaste la versión anterior, usa 03_migracion_a_v3.sql

CREATE TABLE rol (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  id_rol INT NOT NULL REFERENCES rol(id_rol),
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  ci VARCHAR(15),
  correo VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  contrasena_hash VARCHAR(255) NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Herencia: administrador, personal_recepcion y docente son tipos de usuario
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

CREATE TABLE obra (
  id_obra SERIAL PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT,
  duracion_min INT CHECK (duracion_min > 0),
  publico_objetivo VARCHAR(40),
  afiche_url VARCHAR(255),
  estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','INACTIVA'))
);

CREATE TABLE sala (
  id_sala SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  direccion VARCHAR(150),
  capacidad INT NOT NULL CHECK (capacidad > 0)
);

CREATE TABLE asiento (
  id_asiento SERIAL PRIMARY KEY,
  id_sala INT NOT NULL REFERENCES sala(id_sala),
  fila VARCHAR(3) NOT NULL,
  numero INT NOT NULL,
  zona VARCHAR(30),
  tipo_asiento VARCHAR(15) NOT NULL DEFAULT 'GENERAL'
    CHECK (tipo_asiento IN ('GENERAL','PLATEA','VIP')),
  UNIQUE (id_sala, fila, numero)
);

CREATE TABLE presentacion (
  id_presentacion SERIAL PRIMARY KEY,
  id_obra INT NOT NULL REFERENCES obra(id_obra),
  id_sala INT NOT NULL REFERENCES sala(id_sala),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  precio NUMERIC(8,2) NOT NULL CHECK (precio >= 0),
  cupo_gratuito INT NOT NULL DEFAULT 0 CHECK (cupo_gratuito >= 0),
  estado VARCHAR(15) NOT NULL DEFAULT 'PROGRAMADA'
    CHECK (estado IN ('PROGRAMADA','EN_CURSO','FINALIZADA','CANCELADA')),
  UNIQUE (id_sala, fecha, hora_inicio)
);

CREATE TABLE venta (
  id_venta SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  id_presentacion INT NOT NULL REFERENCES presentacion(id_presentacion),
  fecha_venta TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_limite_pago TIMESTAMP,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','PAGADA','VENCIDA','ANULADA'))
);

CREATE TABLE boleto (
  id_boleto SERIAL PRIMARY KEY,
  id_venta INT NOT NULL REFERENCES venta(id_venta),
  id_presentacion INT NOT NULL REFERENCES presentacion(id_presentacion),
  id_asiento INT NOT NULL REFERENCES asiento(id_asiento),
  codigo_qr VARCHAR(100) NOT NULL UNIQUE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'PAGADO' CHECK (tipo IN ('PAGADO','GRATUITO')),
  precio NUMERIC(8,2) NOT NULL DEFAULT 0,
  estado VARCHAR(10) NOT NULL DEFAULT 'RESERVADO'
    CHECK (estado IN ('RESERVADO','EMITIDO','USADO','ANULADO'))
);
CREATE UNIQUE INDEX ux_boleto_asiento
  ON boleto (id_presentacion, id_asiento) WHERE estado <> 'ANULADO';

CREATE TABLE pago (
  id_pago SERIAL PRIMARY KEY,
  id_venta INT NOT NULL REFERENCES venta(id_venta),
  referencia_qr VARCHAR(100) NOT NULL UNIQUE,
  monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  estado VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','CONFIRMADO','VENCIDO','RECHAZADO')),
  fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_pago TIMESTAMP
);

CREATE TABLE ingreso (
  id_ingreso SERIAL PRIMARY KEY,
  id_boleto INT NOT NULL UNIQUE REFERENCES boleto(id_boleto),
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE curso (
  id_curso SERIAL PRIMARY KEY,
  id_docente INT REFERENCES docente(id_usuario),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  publico VARCHAR(10) NOT NULL CHECK (publico IN ('NINOS','JOVENES','ADULTOS')),
  cupo_maximo INT NOT NULL CHECK (cupo_maximo > 0),
  mensualidad NUMERIC(8,2) NOT NULL CHECK (mensualidad >= 0),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO'
    CHECK (estado IN ('ACTIVO','INACTIVO','FINALIZADO'))
);

CREATE TABLE horario_curso (
  id_horario SERIAL PRIMARY KEY,
  id_curso INT NOT NULL REFERENCES curso(id_curso),
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL CHECK (hora_fin > hora_inicio)
);

CREATE TABLE estudiante (
  id_estudiante SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuario(id_usuario),
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  ci VARCHAR(15),
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  tutor_nombre VARCHAR(120),
  tutor_telefono VARCHAR(20)
);

CREATE TABLE inscripcion (
  id_inscripcion SERIAL PRIMARY KEY,
  id_estudiante INT NOT NULL REFERENCES estudiante(id_estudiante),
  id_curso INT NOT NULL REFERENCES curso(id_curso),
  fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVA'
    CHECK (estado IN ('ACTIVA','RETIRADA','FINALIZADA')),
  UNIQUE (id_estudiante, id_curso)
);

CREATE TABLE pago_mensualidad (
  id_pago_mensualidad SERIAL PRIMARY KEY,
  id_inscripcion INT NOT NULL REFERENCES inscripcion(id_inscripcion),
  mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio SMALLINT NOT NULL,
  monto NUMERIC(8,2) NOT NULL CHECK (monto >= 0),
  estado VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','PAGADA')),
  fecha_pago DATE,
  id_usuario_registro INT REFERENCES usuario(id_usuario),
  UNIQUE (id_inscripcion, mes, anio)
);

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
