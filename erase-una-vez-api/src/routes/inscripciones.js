const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

function esAdminODocente(rol) {
  return rol === 'ADMINISTRADOR' || rol === 'DOCENTE';
}

// 1. Inscribir a un estudiante a un curso
router.post('/', async (req, res, next) => {
  const { id_curso, id_estudiante } = req.body;

  if (!id_curso || !id_estudiante) {
    return res.status(400).json({ error: 'Debe especificar el curso y el estudiante a inscribir' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: eRows } = await client.query('SELECT * FROM estudiante WHERE id_estudiante = $1', [id_estudiante]);
    if (!eRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    const estudiante = eRows[0];

    if (!esAdminODocente(req.usuario.rol) && estudiante.id_usuario !== req.usuario.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tiene permiso para inscribir a este estudiante' });
    }

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
        const { rows: reactivada } = await client.query(
          `UPDATE inscripcion SET estado = 'ACTIVA', fecha_inscripcion = CURRENT_DATE
            WHERE id_inscripcion = $1 RETURNING *`,
          [yaInscrito[0].id_inscripcion]
        );
        inscripcionFinal = reactivada[0];
      }
    } else {
      const { rows: nueva } = await client.query(
        `INSERT INTO inscripcion (id_estudiante, id_curso, fecha_inscripcion, estado, clases_totales, nivel_crecimiento)
         VALUES ($1, $2, CURRENT_DATE, 'ACTIVA', 16, 'EN PROCESO')
         RETURNING *`,
        [id_estudiante, id_curso]
      );
      inscripcionFinal = nueva[0];
    }

    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const { rows: mensualidadRows } = await client.query(
      `INSERT INTO pago_mensualidad (id_inscripcion, mes, anio, monto, estado, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, 'PENDIENTE', (CURRENT_DATE + INTERVAL '10 days')::date)
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

// 2. Listar inscripciones con filtros y todos los datos de asistencia, crecimiento y certificados
router.get('/', async (req, res, next) => {
  try {
    const { id_curso, id_estudiante, estado } = req.query;

    let sql = `
      SELECT i.id_inscripcion, i.fecha_inscripcion, i.estado,
             COALESCE(i.clases_asistidas, 0) AS clases_asistidas,
             COALESCE(i.clases_totales, 16) AS clases_totales,
             COALESCE(i.asistencia_porcentaje, 0) AS asistencia_porcentaje,
             COALESCE(i.eval_expresion, 0) AS eval_expresion,
             COALESCE(i.eval_voz, 0) AS eval_voz,
             COALESCE(i.eval_improvisacion, 0) AS eval_improvisacion,
             COALESCE(i.eval_compromiso, 0) AS eval_compromiso,
             COALESCE(i.nota_final, 0) AS nota_final,
             COALESCE(i.nivel_crecimiento, 'EN PROCESO') AS nivel_crecimiento,
             i.observaciones_docente,
             i.evaluado_por,
             i.fecha_evaluacion,
             COALESCE(i.culmino_taller, FALSE) AS culmino_taller,
             COALESCE(i.certificado_otorgado, FALSE) AS certificado_otorgado,
             i.codigo_certificado,
             i.fecha_certificado,
             e.id_estudiante, e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos,
             e.ci AS estudiante_ci, e.telefono AS estudiante_telefono, e.tutor_nombre, e.tutor_telefono,
             COALESCE(NULLIF(e.correo, ''), u.correo) AS estudiante_correo,
             c.id_curso, c.nombre AS curso_nombre, c.mensualidad, c.publico,
             u.id_usuario AS tutor_id_usuario, u.correo AS tutor_correo
        FROM inscripcion i
        JOIN estudiante e ON e.id_estudiante = i.id_estudiante
        JOIN curso c ON c.id_curso = i.id_curso
        LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE 1=1`;

    const params = [];

    if (!esAdminODocente(req.usuario.rol)) {
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

// 3. Actualizar seguimiento académico: asistencia, evaluación de crecimiento, culminación y certificado (Docente o Administrador)
router.put('/:id/seguimiento', requerirRol('ADMINISTRADOR', 'DOCENTE'), async (req, res, next) => {
  try {
    const {
      clases_asistidas,
      clases_totales,
      eval_expresion,
      eval_voz,
      eval_improvisacion,
      eval_compromiso,
      nivel_crecimiento,
      observaciones_docente,
      culmino_taller,
      certificado_otorgado,
      estado,
    } = req.body;

    const { rows: actualRows } = await db.query(
      'SELECT * FROM inscripcion WHERE id_inscripcion = $1',
      [req.params.id]
    );
    if (!actualRows[0]) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }
    const actual = actualRows[0];

    const cTotales = Math.max(1, parseInt(clases_totales ?? actual.clases_totales ?? 16, 10));
    const cAsistidas = Math.min(
      cTotales,
      Math.max(0, parseInt(clases_asistidas ?? actual.clases_asistidas ?? 0, 10))
    );
    const porcAsistencia = Number(((cAsistidas / cTotales) * 100).toFixed(1));

    const exp = Math.min(100, Math.max(0, parseInt(eval_expresion ?? actual.eval_expresion ?? 0, 10)));
    const voz = Math.min(100, Math.max(0, parseInt(eval_voz ?? actual.eval_voz ?? 0, 10)));
    const imp = Math.min(
      100,
      Math.max(0, parseInt(eval_improvisacion ?? actual.eval_improvisacion ?? 0, 10))
    );
    const comp = Math.min(
      100,
      Math.max(0, parseInt(eval_compromiso ?? actual.eval_compromiso ?? 0, 10))
    );

    const notaFinal = Number(((exp + voz + imp + comp) / 4).toFixed(1));

    // Determinar nivel de crecimiento automáticamente si no se envía uno explícito
    let nivel = nivel_crecimiento || actual.nivel_crecimiento || 'EN PROCESO';
    if (!nivel_crecimiento) {
      if (notaFinal >= 90) nivel = 'SOBRESALIENTE';
      else if (notaFinal >= 75) nivel = 'DESTACADO';
      else if (notaFinal >= 51) nivel = 'EN PROCESO';
      else nivel = 'INICIAL';
    }

    const culmino = culmino_taller !== undefined ? Boolean(culmino_taller) : Boolean(actual.culmino_taller);
    const certOtorgado =
      certificado_otorgado !== undefined
        ? Boolean(certificado_otorgado)
        : Boolean(actual.certificado_otorgado);

    let codigoCert = actual.codigo_certificado;
    let fechaCert = actual.fecha_certificado;

    if (certOtorgado && !codigoCert) {
      const anio = new Date().getFullYear();
      codigoCert = `EUV-CERT-${anio}-${String(actual.id_inscripcion).padStart(4, '0')}`;
      fechaCert = new Date().toISOString().slice(0, 10);
    } else if (!certOtorgado) {
      codigoCert = null;
      fechaCert = null;
    }

    const nuevoEstado =
      estado || (culmino ? 'FINALIZADA' : actual.estado === 'FINALIZADA' ? 'ACTIVA' : actual.estado);
    const nombreEvaluador = `${req.usuario.nombres || 'Dirección'} ${req.usuario.apellidos || ''}`.trim();

    const { rows } = await db.query(
      `UPDATE inscripcion
          SET clases_asistidas = $1,
              clases_totales = $2,
              asistencia_porcentaje = $3,
              eval_expresion = $4,
              eval_voz = $5,
              eval_improvisacion = $6,
              eval_compromiso = $7,
              nota_final = $8,
              nivel_crecimiento = $9,
              observaciones_docente = $10,
              evaluado_por = $11,
              fecha_evaluacion = NOW(),
              culmino_taller = $12,
              certificado_otorgado = $13,
              codigo_certificado = $14,
              fecha_certificado = $15,
              estado = $16
        WHERE id_inscripcion = $17
        RETURNING *`,
      [
        cAsistidas,
        cTotales,
        porcAsistencia,
        exp,
        voz,
        imp,
        comp,
        notaFinal,
        nivel,
        observaciones_docente !== undefined ? observaciones_docente : actual.observaciones_docente,
        nombreEvaluador,
        culmino,
        certOtorgado,
        codigoCert,
        fechaCert,
        nuevoEstado,
        req.params.id,
      ]
    );

    res.json({
      ok: true,
      mensaje: 'Evaluación, asistencia y estado de certificación actualizados con éxito',
      inscripcion: rows[0],
    });
  } catch (e) {
    next(e);
  }
});

// 4. Registro rápido de asistencia (+1 o -1 clase asistida)
router.post('/:id/asistencia-rapida', requerirRol('ADMINISTRADOR', 'DOCENTE'), async (req, res, next) => {
  try {
    const delta = Number(req.body.delta || 1);
    const { rows: actualRows } = await db.query(
      'SELECT * FROM inscripcion WHERE id_inscripcion = $1',
      [req.params.id]
    );
    if (!actualRows[0]) return res.status(404).json({ error: 'Inscripción no encontrada' });

    const actual = actualRows[0];
    const cTotales = Math.max(1, parseInt(actual.clases_totales || 16, 10));
    const cAsistidas = Math.min(
      cTotales,
      Math.max(0, (parseInt(actual.clases_asistidas || 0, 10)) + delta)
    );
    const porc = Number(((cAsistidas / cTotales) * 100).toFixed(1));

    const { rows } = await db.query(
      `UPDATE inscripcion
          SET clases_asistidas = $1,
              asistencia_porcentaje = $2
        WHERE id_inscripcion = $3
        RETURNING *`,
      [cAsistidas, porc, req.params.id]
    );

    res.json({ ok: true, inscripcion: rows[0] });
  } catch (e) {
    next(e);
  }
});

// 5. Cambiar estado de inscripción (Administrador o Docente)
router.patch('/:id/estado', requerirRol('ADMINISTRADOR', 'DOCENTE'), async (req, res, next) => {
  const { estado } = req.body;
  const estadosValidos = ['ACTIVA', 'RETIRADA', 'FINALIZADA'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Use: ${estadosValidos.join(', ')}` });
  }

  try {
    const { rows } = await db.query(
      `UPDATE inscripcion
          SET estado = $1,
              culmino_taller = CASE WHEN $1 = 'FINALIZADA' THEN TRUE ELSE culmino_taller END
        WHERE id_inscripcion = $2
        RETURNING *`,
      [estado, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Inscripción no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
