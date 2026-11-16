const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

function esAdminODocente(rol) {
  return rol === 'ADMINISTRADOR' || rol === 'DOCENTE';
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

// 3. Registrar estudiante (para inscripción a taller o desde administración)
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

  if (!nombres || !apellidos) {
    return res.status(400).json({ error: 'Complete al menos los nombres y apellidos del estudiante' });
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
        ci || null,
        fecha_nacimiento || null,
        telefono || null,
        correo ? correo.trim() : null,
        tutor_nombre || null,
        tutor_telefono || null,
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

  if (!nombres || !apellidos) {
    return res.status(400).json({ error: 'Complete nombres y apellidos' });
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
        correo ? correo.trim() : null,
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

module.exports = router;
