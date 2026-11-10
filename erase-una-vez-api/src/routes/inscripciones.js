const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

// 1. Inscribir a un estudiante a un curso
router.post('/', async (req, res, next) => {
  const { id_curso, id_estudiante } = req.body;

  if (!id_curso || !id_estudiante) {
    return res.status(400).json({ error: 'Debe especificar el curso y el estudiante a inscribir' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar estudiante y permisos
    const { rows: eRows } = await client.query('SELECT * FROM estudiante WHERE id_estudiante = $1', [id_estudiante]);
    if (!eRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    const estudiante = eRows[0];

    if (req.usuario.rol !== 'ADMINISTRADOR' && estudiante.id_usuario !== req.usuario.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tiene permiso para inscribir a este estudiante' });
    }

    // Verificar curso
    const { rows: cRows } = await client.query('SELECT * FROM curso WHERE id_curso = $1', [id_curso]);
    if (!cRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    const curso = cRows[0];

    if (curso.estado !== 'ACTIVO') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `El curso se encuentra ${curso.estado} y no admite inscripciones` });
    }

    // Verificar cupo disponible
    const { rows: inscritos } = await client.query(
      `SELECT COUNT(*) FROM inscripcion WHERE id_curso = $1 AND estado = 'ACTIVA'`,
      [id_curso]
    );
    const cantInscritos = parseInt(inscritos[0].count, 10);
    if (cantInscritos >= curso.cupo_maximo) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `No hay cupos disponibles. El curso ha alcanzado su cupo máximo de ${curso.cupo_maximo} estudiantes.`,
      });
    }

    // Verificar si ya está inscrito
    const { rows: yaInscrito } = await client.query(
      `SELECT * FROM inscripcion WHERE id_estudiante = $1 AND id_curso = $2`,
      [id_estudiante, id_curso]
    );

    let inscripcionFinal;
    if (yaInscrito[0]) {
      if (yaInscrito[0].estado === 'ACTIVA') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'El estudiante ya se encuentra inscrito activamente en este curso' });
      } else {
        // Reactivar inscripción previamente retirada
        const { rows: reactivada } = await client.query(
          `UPDATE inscripcion SET estado = 'ACTIVA', fecha_inscripcion = CURRENT_DATE
            WHERE id_inscripcion = $1 RETURNING *`,
          [yaInscrito[0].id_inscripcion]
        );
        inscripcionFinal = reactivada[0];
      }
    } else {
      // Nueva inscripción
      const { rows: nueva } = await client.query(
        `INSERT INTO inscripcion (id_estudiante, id_curso, fecha_inscripcion, estado)
         VALUES ($1, $2, CURRENT_DATE, 'ACTIVA')
         RETURNING *`,
        [id_estudiante, id_curso]
      );
      inscripcionFinal = nueva[0];
    }

    // Generar la mensualidad del mes actual en la tabla real 'pago_mensualidad' si aún no existe
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const { rows: mensualidadRows } = await client.query(
      `INSERT INTO pago_mensualidad (id_inscripcion, mes, anio, monto, estado)
       VALUES ($1, $2, $3, $4, 'PENDIENTE')
       ON CONFLICT (id_inscripcion, mes, anio) DO NOTHING
       RETURNING *`,
      [inscripcionFinal.id_inscripcion, mesActual, anioActual, curso.mensualidad]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: '¡Inscripción realizada exitosamente!',
      inscripcion: {
        ...inscripcionFinal,
        estudiante: `${estudiante.nombres} ${estudiante.apellidos}`,
        curso: curso.nombre,
        mensualidad_inicial: mensualidadRows[0] || null,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 2. Listar inscripciones con filtros
router.get('/', async (req, res, next) => {
  try {
    const { id_curso, id_estudiante, estado } = req.query;

    let sql = `
      SELECT i.id_inscripcion, i.fecha_inscripcion, i.estado,
             e.id_estudiante, e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos,
             e.ci AS estudiante_ci, e.telefono AS estudiante_telefono, e.tutor_nombre, e.tutor_telefono,
             c.id_curso, c.nombre AS curso_nombre, c.mensualidad, c.publico,
             u.id_usuario AS tutor_id_usuario, u.correo AS tutor_correo
        FROM inscripcion i
        JOIN estudiante e ON e.id_estudiante = i.id_estudiante
        JOIN curso c ON c.id_curso = i.id_curso
        LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE 1=1`;

    const params = [];

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      params.push(req.usuario.id);
      sql += ` AND e.id_usuario = $${params.length}`;
    }

    if (id_curso) {
      params.push(id_curso);
      sql += ` AND i.id_curso = $${params.length}`;
    }

    if (id_estudiante) {
      params.push(id_estudiante);
      sql += ` AND i.id_estudiante = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      sql += ` AND i.estado = $${params.length}`;
    }

    sql += ` ORDER BY i.fecha_inscripcion DESC, e.apellidos`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// 3. Cambiar estado de inscripción (Administrador)
router.patch('/:id/estado', requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const { estado } = req.body;
  const estadosValidos = ['ACTIVA', 'RETIRADA', 'FINALIZADA'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Use: ${estadosValidos.join(', ')}` });
  }

  try {
    const { rows } = await db.query(
      `UPDATE inscripcion SET estado = $1 WHERE id_inscripcion = $2 RETURNING *`,
      [estado, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Inscripción no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;