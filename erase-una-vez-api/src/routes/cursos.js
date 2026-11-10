const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

const PUBLICOS_VALIDOS = ['NINOS', 'JOVENES', 'ADULTOS'];

// 1. Listar cursos (Público / Admin)
router.get('/', async (req, res, next) => {
  try {
    const verTodos = req.query.todos === 'true';
    let sql = `
      SELECT c.id_curso, c.nombre, c.descripcion, c.publico, c.cupo_maximo, c.mensualidad,
             c.fecha_inicio, c.fecha_fin, c.estado,
             c.id_docente, u.nombres AS docente_nombres, u.apellidos AS docente_apellidos,
             COUNT(i.id_inscripcion) FILTER (WHERE i.estado = 'ACTIVA') AS inscritos_activos
        FROM curso c
        LEFT JOIN docente d ON d.id_usuario = c.id_docente
        LEFT JOIN usuario u ON u.id_usuario = d.id_usuario
        LEFT JOIN inscripcion i ON i.id_curso = c.id_curso`;

    if (!verTodos) {
      sql += ` WHERE c.estado = 'ACTIVO'`;
    }

    sql += ` GROUP BY c.id_curso, u.id_usuario, u.nombres, u.apellidos
             ORDER BY c.fecha_inicio DESC, c.nombre`;

    const { rows: cursos } = await db.query(sql);

    // Obtener horarios de cada curso
    const cursosConHorarios = await Promise.all(
      cursos.map(async (c) => {
        const { rows: horarios } = await db.query(
          `SELECT id_horario, dia_semana, hora_inicio, hora_fin
             FROM horario_curso WHERE id_curso = $1 ORDER BY dia_semana, hora_inicio`,
          [c.id_curso]
        );
        const inscritos = parseInt(c.inscritos_activos, 10) || 0;
        const cuposDisponibles = Math.max(0, c.cupo_maximo - inscritos);
        return {
          ...c,
          inscritos_activos: inscritos,
          cupos_disponibles: cuposDisponibles,
          horarios,
        };
      })
    );

    res.json(cursosConHorarios);
  } catch (e) {
    next(e);
  }
});
// 2. Detalle de un curso
router.get('/:id', async (req, res, next) => {
  try {
    const { rows: cRows } = await db.query(
      `SELECT c.*, u.nombres AS docente_nombres, u.apellidos AS docente_apellidos
         FROM curso c
         LEFT JOIN docente d ON d.id_usuario = c.id_docente
         LEFT JOIN usuario u ON u.id_usuario = d.id_usuario
        WHERE c.id_curso = $1`,
      [req.params.id]
    );

    if (!cRows[0]) return res.status(404).json({ error: 'Curso no encontrado' });
    const curso = cRows[0];

    const { rows: horarios } = await db.query(
      `SELECT id_horario, dia_semana, hora_inicio, hora_fin
         FROM horario_curso WHERE id_curso = $1 ORDER BY dia_semana, hora_inicio`,
      [curso.id_curso]
    );

    const { rows: inscritos } = await db.query(
      `SELECT i.id_inscripcion, i.fecha_inscripcion, i.estado,
              e.id_estudiante, e.nombres, e.apellidos, e.ci, e.telefono, e.tutor_nombre, e.tutor_telefono
         FROM inscripcion i
         JOIN estudiante e ON e.id_estudiante = i.id_estudiante
        WHERE i.id_curso = $1 AND i.estado = 'ACTIVA'
        ORDER BY e.apellidos, e.nombres`,
      [curso.id_curso]
    );

    res.json({
      ...curso,
      inscritos_activos: inscritos.length,
      cupos_disponibles: Math.max(0, curso.cupo_maximo - inscritos.length),
      horarios,
      estudiantes_inscritos: inscritos,
    });
  } catch (e) {
    next(e);
  }
});

function validarCurso(body) {
  const { nombre, publico, cupo_maximo, mensualidad, fecha_inicio } = body;
  if (!nombre || !publico || cupo_maximo === undefined || mensualidad === undefined || !fecha_inicio) {
    return 'Complete el nombre, público objetivo, cupo máximo, mensualidad y fecha de inicio';
  }
  if (!PUBLICOS_VALIDOS.includes(publico)) {
    return `El público debe ser uno de: ${PUBLICOS_VALIDOS.join(', ')}`;
  }
  if (Number(cupo_maximo) <= 0) return 'El cupo máximo debe ser mayor a cero';
  if (Number(mensualidad) < 0) return 'La mensualidad no puede ser negativa';
  return null;
}

// 3. Crear curso (Administrador)
router.post('/', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const error = validarCurso(req.body);
  if (error) return res.status(400).json({ error });

  const { nombre, descripcion, publico, cupo_maximo, mensualidad, fecha_inicio, fecha_fin, id_docente, horarios } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cRows } = await client.query(
      `INSERT INTO curso (id_docente, nombre, descripcion, publico, cupo_maximo, mensualidad, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id_docente || null,
        nombre.trim(),
        descripcion || null,
        publico,
        cupo_maximo,
        mensualidad,
        fecha_inicio,
        fecha_fin || null,
      ]
    );
    const nuevoCurso = cRows[0];

    const horariosGuardados = [];
    if (Array.isArray(horarios) && horarios.length > 0) {
      for (const h of horarios) {
        if (h.dia_semana && h.hora_inicio && h.hora_fin) {
          const { rows: hRows } = await client.query(
            `INSERT INTO horario_curso (id_curso, dia_semana, hora_inicio, hora_fin)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nuevoCurso.id_curso, h.dia_semana, h.hora_inicio, h.hora_fin]
          );
          horariosGuardados.push(hRows[0]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...nuevoCurso, horarios: horariosGuardados });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 4. Modificar curso (Administrador)
router.put('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const error = validarCurso(req.body);
  if (error) return res.status(400).json({ error });

  const { nombre, descripcion, publico, cupo_maximo, mensualidad, fecha_inicio, fecha_fin, id_docente, estado, horarios } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cRows } = await client.query(
      `UPDATE curso
          SET id_docente = $1, nombre = $2, descripcion = $3, publico = $4,
              cupo_maximo = $5, mensualidad = $6, fecha_inicio = $7, fecha_fin = $8,
              estado = COALESCE($9, estado)
        WHERE id_curso = $10 RETURNING *`,
      [
        id_docente || null,
        nombre.trim(),
        descripcion || null,
        publico,
        cupo_maximo,
        mensualidad,
        fecha_inicio,
        fecha_fin || null,
        estado || null,
        req.params.id,
      ]
    );

    if (!cRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    const cursoActualizado = cRows[0];

    // Si se enviaron horarios, actualizar
    if (Array.isArray(horarios)) {
      await client.query(`DELETE FROM horario_curso WHERE id_curso = $1`, [req.params.id]);
      for (const h of horarios) {
        if (h.dia_semana && h.hora_inicio && h.hora_fin) {
          await client.query(
            `INSERT INTO horario_curso (id_curso, dia_semana, hora_inicio, hora_fin)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, h.dia_semana, h.hora_inicio, h.hora_fin]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json(cursoActualizado);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 5. Dar de baja curso (Administrador): estado INACTIVO
router.delete('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE curso SET estado = 'INACTIVO' WHERE id_curso = $1 RETURNING id_curso, nombre, estado`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
