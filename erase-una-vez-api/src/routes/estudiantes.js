const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');
const {
  validarNombreApellido,
  validarCIBolivia,
  validarTelefonoBolivia,
  verificarExistenciaCorreo,
} = require('../utils/validaciones');

const router = express.Router();

router.use(verificarToken);

function esAdminODocente(rol) {
  return rol === 'ADMINISTRADOR' || rol === 'DOCENTE';
}

function validarFechaNacimiento(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) {
    return 'La fecha de nacimiento no tiene un formato válido.';
  }
  const hoy = new Date();
  if (fecha > hoy) {
    return 'La fecha de nacimiento no puede ser una fecha futura.';
  }
  const edad = (hoy - fecha) / (365.25 * 24 * 3600 * 1000);
  if (edad < 3 || edad > 95) {
    return 'La edad del participante debe estar entre 3 y 95 años.';
  }
  return null;
}

// 1. Listar estudiantes
router.get('/', async (req, res, next) => {
  try {
    let sql = `
      SELECT e.id_estudiante, e.id_usuario, e.nombres, e.apellidos, e.ci, e.fecha_nacimiento,
             e.telefono, e.tutor_nombre, e.tutor_telefono,
             COALESCE(NULLIF(e.correo, ''), u.correo) AS correo,
             u.correo AS usuario_correo,
             COUNT(i.id_inscripcion) FILTER (WHERE i.estado = 'ACTIVA') AS inscripciones_activas,
             COUNT(i.id_inscripcion) FILTER (WHERE i.culmino_taller = TRUE) AS talleres_culminados,
             COUNT(i.id_inscripcion) FILTER (WHERE i.certificado_otorgado = TRUE) AS certificados_obtenidos
        FROM estudiante e
        LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
        LEFT JOIN inscripcion i ON i.id_estudiante = e.id_estudiante`;

    const params = [];
    if (!esAdminODocente(req.usuario.rol)) {
      params.push(req.usuario.id);
      sql += ` WHERE e.id_usuario = $1`;
    }

    sql += ` GROUP BY e.id_estudiante, u.id_usuario, u.correo
             ORDER BY e.apellidos, e.nombres`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// 2. Detalle de estudiante
router.get('/:id', async (req, res, next) => {
  try {
    const { rows: eRows } = await db.query(
      `SELECT e.*, COALESCE(NULLIF(e.correo, ''), u.correo) AS correo,
              u.correo AS usuario_correo, u.nombres AS usuario_nombres, u.apellidos AS usuario_apellidos
         FROM estudiante e
         LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
        WHERE e.id_estudiante = $1`,
      [req.params.id]
    );

    if (!eRows[0]) return res.status(404).json({ error: 'Estudiante no encontrado' });
    const est = eRows[0];

    if (!esAdminODocente(req.usuario.rol) && est.id_usuario !== req.usuario.id) {
      return res.status(403).json({ error: 'No tiene permiso para ver este estudiante' });
    }

    const { rows: cursos } = await db.query(
      `SELECT i.*,
              c.id_curso, c.nombre AS curso_nombre, c.mensualidad, c.publico, c.estado AS estado_curso
         FROM inscripcion i
         JOIN curso c ON c.id_curso = i.id_curso
        WHERE i.id_estudiante = $1
        ORDER BY i.fecha_inscripcion DESC`,
      [est.id_estudiante]
    );

    res.json({ ...est, cursos_inscritos: cursos });
  } catch (e) {
    next(e);
  }
});

// 3. Registrar estudiante con parámetros estrictos y verificación de correo MX
router.post('/', async (req, res, next) => {
  const {
    nombres,
    apellidos,
    ci,
    fecha_nacimiento,
    telefono,
    correo,
    tutor_nombre,
    tutor_telefono,
    id_usuario,
  } = req.body;

  const errNom = validarNombreApellido(nombres, 'Nombres del estudiante');
  if (errNom) return res.status(400).json({ error: errNom });

  const errApe = validarNombreApellido(apellidos, 'Apellidos del estudiante');
  if (errApe) return res.status(400).json({ error: errApe });

  const errCi = validarCIBolivia(ci, false);
  if (errCi) return res.status(400).json({ error: errCi });

  const errFecha = validarFechaNacimiento(fecha_nacimiento);
  if (errFecha) return res.status(400).json({ error: errFecha });

  const errTel = validarTelefonoBolivia(telefono, false, 'Teléfono del estudiante');
  if (errTel) return res.status(400).json({ error: errTel });

  if (tutor_nombre && String(tutor_nombre).trim()) {
    const errTutNom = validarNombreApellido(tutor_nombre, 'Nombre del tutor');
    if (errTutNom) return res.status(400).json({ error: errTutNom });
  }

  const errTutTel = validarTelefonoBolivia(tutor_telefono, false, 'Teléfono del tutor');
  if (errTutTel) return res.status(400).json({ error: errTutTel });

  if (correo && String(correo).trim()) {
    const verifCorreo = await verificarExistenciaCorreo(correo);
    if (!verifCorreo.valido) {
      return res.status(400).json({ error: verifCorreo.error });
    }
  }

  try {
    const usuarioAsociado =
      esAdminODocente(req.usuario.rol) && id_usuario ? id_usuario : req.usuario.id;

    const { rows } = await db.query(
      `INSERT INTO estudiante (id_usuario, nombres, apellidos, ci, fecha_nacimiento, telefono, correo, tutor_nombre, tutor_telefono)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        usuarioAsociado,
        nombres.trim(),
        apellidos.trim(),
        ci ? ci.trim() : null,
        fecha_nacimiento || null,
        telefono ? telefono.trim() : null,
        correo ? correo.trim().toLowerCase() : null,
        tutor_nombre ? tutor_nombre.trim() : null,
        tutor_telefono ? tutor_telefono.trim() : null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// 4. Modificar estudiante (Administrador o Docente)
router.put('/:id', requerirRol('ADMINISTRADOR', 'DOCENTE'), async (req, res, next) => {
  const { nombres, apellidos, ci, fecha_nacimiento, telefono, correo, tutor_nombre, tutor_telefono } =
    req.body;

  const errNom = validarNombreApellido(nombres, 'Nombres del estudiante');
  if (errNom) return res.status(400).json({ error: errNom });

  const errApe = validarNombreApellido(apellidos, 'Apellidos del estudiante');
  if (errApe) return res.status(400).json({ error: errApe });

  const errCi = validarCIBolivia(ci, false);
  if (errCi) return res.status(400).json({ error: errCi });

  const errFecha = validarFechaNacimiento(fecha_nacimiento);
  if (errFecha) return res.status(400).json({ error: errFecha });

  if (correo && String(correo).trim()) {
    const verifCorreo = await verificarExistenciaCorreo(correo);
    if (!verifCorreo.valido) {
      return res.status(400).json({ error: verifCorreo.error });
    }
  }

  try {
    const { rows: actual } = await db.query('SELECT * FROM estudiante WHERE id_estudiante = $1', [
      req.params.id,
    ]);
    if (!actual[0]) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const { rows } = await db.query(
      `UPDATE estudiante
          SET nombres = $1, apellidos = $2, ci = $3, fecha_nacimiento = $4,
              telefono = $5, correo = $6, tutor_nombre = $7, tutor_telefono = $8
        WHERE id_estudiante = $9
        RETURNING *`,
      [
        nombres.trim(),
        apellidos.trim(),
        ci || null,
        fecha_nacimiento || null,
        telefono || null,
        correo ? correo.trim().toLowerCase() : null,
        tutor_nombre || null,
        tutor_telefono || null,
        req.params.id,
      ]
    );

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// 5. Eliminar permanentemente un estudiante y sus inscripciones (Administrador)
router.delete('/:id', requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const idEst = Number(req.params.id);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM pago_mensualidad
        WHERE id_inscripcion IN (SELECT id_inscripcion FROM inscripcion WHERE id_estudiante = $1)`,
      [idEst]
    );
    await client.query('DELETE FROM inscripcion WHERE id_estudiante = $1', [idEst]);
    const { rows } = await client.query(
      'DELETE FROM estudiante WHERE id_estudiante = $1 RETURNING *',
      [idEst]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    await client.query('COMMIT');
    res.json({
      ok: true,
      mensaje: `Estudiante ${rows[0].nombres} ${rows[0].apellidos} eliminado permanentemente.`,
      estudiante: rows[0],
    });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
