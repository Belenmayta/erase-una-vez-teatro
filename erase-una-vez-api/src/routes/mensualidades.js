const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

// 1. Listar mensualidades con filtros
router.get('/', async (req, res, next) => {
  try {
    const { id_curso, id_estudiante, id_inscripcion, mes, anio, estado } = req.query;

    let sql = `
      SELECT m.id_pago_mensualidad AS id_mensualidad, m.id_inscripcion, m.mes, m.anio, m.monto, m.estado, m.fecha_pago,
             e.id_estudiante, e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos, e.ci AS estudiante_ci,
             e.tutor_nombre, e.tutor_telefono,
             c.id_curso, c.nombre AS curso_nombre,
             u_tutor.id_usuario AS tutor_id_usuario, u_tutor.correo AS tutor_correo,
             u_reg.nombres AS cobrador_nombres, u_reg.apellidos AS cobrador_apellidos
        FROM pago_mensualidad m
        JOIN inscripcion i ON i.id_inscripcion = m.id_inscripcion
        JOIN estudiante e ON e.id_estudiante = i.id_estudiante
        JOIN curso c ON c.id_curso = i.id_curso
        LEFT JOIN usuario u_tutor ON u_tutor.id_usuario = e.id_usuario
        LEFT JOIN usuario u_reg ON u_reg.id_usuario = m.id_usuario_registro
       WHERE 1=1`;

    const params = [];

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      params.push(req.usuario.id);
      sql += ` AND e.id_usuario = $${params.length}`;
    }

    if (id_curso) {
      params.push(id_curso);
      sql += ` AND c.id_curso = $${params.length}`;
    }

    if (id_estudiante) {
      params.push(id_estudiante);
      sql += ` AND e.id_estudiante = $${params.length}`;
    }

    if (id_inscripcion) {
      params.push(id_inscripcion);
      sql += ` AND m.id_inscripcion = $${params.length}`;
    }

    if (mes) {
      params.push(mes);
      sql += ` AND m.mes = $${params.length}`;
    }

    if (anio) {
      params.push(anio);
      sql += ` AND m.anio = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      sql += ` AND m.estado = $${params.length}`;
    }

    sql += ` ORDER BY m.anio DESC, m.mes DESC, e.apellidos`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// 2. Registrar cobro de una mensualidad (Administrador)
router.post('/:id/cobrar', requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows: mRows } = await db.query(
      `SELECT m.id_pago_mensualidad AS id_mensualidad, m.id_inscripcion, m.mes, m.anio, m.monto, m.estado, m.fecha_pago,
              e.nombres, e.apellidos, c.nombre AS curso
         FROM pago_mensualidad m
         JOIN inscripcion i ON i.id_inscripcion = m.id_inscripcion
         JOIN estudiante e ON e.id_estudiante = i.id_estudiante
         JOIN curso c ON c.id_curso = i.id_curso
        WHERE m.id_pago_mensualidad = $1`,
      [req.params.id]
    );

    if (!mRows[0]) return res.status(404).json({ error: 'Mensualidad no encontrada' });
    const mensualidad = mRows[0];

    if (mensualidad.estado === 'PAGADA') {
      return res.status(400).json({ error: 'Esta mensualidad ya fue registrada como PAGADA' });
    }

    const { rows: actualizado } = await db.query(
      `UPDATE pago_mensualidad
          SET estado = 'PAGADA',
              fecha_pago = CURRENT_DATE,
              id_usuario_registro = $1
        WHERE id_pago_mensualidad = $2
        RETURNING id_pago_mensualidad AS id_mensualidad, id_inscripcion, mes, anio, monto, estado, fecha_pago, id_usuario_registro`,
      [req.usuario.id, req.params.id]
    );

    res.json({
      ok: true,
      mensaje: `Cobro de mensualidad registrado con éxito para ${mensualidad.nombres} ${mensualidad.apellidos}`,
      mensualidad: actualizado[0],
    });
  } catch (e) {
    next(e);
  }
});

// 3. Generar cuotas de mensualidad para un período nuevo (Administrador)
router.post('/generar-periodo', requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const { mes, anio, id_curso } = req.body;

  if (!mes || !anio || mes < 1 || mes > 12) {
    return res.status(400).json({ error: 'Especifique un mes válido (1 a 12) y un año' });
  }

  try {
    let sqlInscripciones = `
      SELECT i.id_inscripcion, c.mensualidad
        FROM inscripcion i
        JOIN curso c ON c.id_curso = i.id_curso
       WHERE i.estado = 'ACTIVA'`;

    const params = [];
    if (id_curso) {
      params.push(id_curso);
      sqlInscripciones += ` AND i.id_curso = $1`;
    }

    const { rows: activas } = await db.query(sqlInscripciones, params);

    let generadas = 0;
    for (const act of activas) {
      const { rowCount } = await db.query(
        `INSERT INTO pago_mensualidad (id_inscripcion, mes, anio, monto, estado)
         VALUES ($1, $2, $3, $4, 'PENDIENTE')
         ON CONFLICT (id_inscripcion, mes, anio) DO NOTHING`,
        [act.id_inscripcion, mes, anio, act.mensualidad]
      );
      if (rowCount > 0) generadas++;
    }

    res.json({
      ok: true,
      mensaje: `Período ${mes}/${anio} generado exitosamente. Se crearon ${generadas} nuevas mensualidades.`,
      generadas,
      total_inscripciones_activas: activas.length,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;