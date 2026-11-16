const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

const NOMBRES_MESES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function construirCorreoRecordatorio(m) {
  const nombreMes = NOMBRES_MESES[Number(m.mes)] || `Mes ${m.mes}`;
  const destinatarioNombre = m.tutor_nombre || `${m.estudiante_nombres} ${m.estudiante_apellidos}`;
  const correoDestino = m.estudiante_correo || m.tutor_correo || '';
  const telefonoDestino = (m.tutor_telefono || m.estudiante_telefono || '').replace(/\D/g, '');

  const asunto = `Recordatorio de Mensualidad Pendiente (${nombreMes} ${m.anio}) - Taller "${m.curso_nombre}" | Teatro Érase una Vez`;

  const cuerpo = `Estimado(a) ${destinatarioNombre}:

Reciba un cordial saludo de parte de la Dirección Académica de la Compañía de Teatro "Érase una Vez".

Por medio del presente mensaje, le recordamos amablemente que se registra una cuota mensual pendiente de pago correspondiente a la formación artística del participante:

• Estudiante: ${m.estudiante_nombres} ${m.estudiante_apellidos}
• Taller Artístico: ${m.curso_nombre}
• Período Pendiente: ${nombreMes} de ${m.anio}
• Monto a Cancelar: Bs. ${Number(m.monto).toFixed(2)}
• Sede: Sala de Ensayos Sopocachi (Av. 20 de Octubre, Edif. Agustín Aspiazu PB)

Puede realizar el pago mediante transferencia / código QR bancario o directamente en recepción antes del inicio de la siguiente clase (Lunes o Miércoles). En caso de haber efectuado ya el depósito, por favor envíenos el comprobante por este medio para actualizar su estado a PAGADO.

Agradecemos de antemano su puntualidad y compromiso con el desarrollo artístico de nuestros estudiantes.

Atentamente,
Dirección General y Académica
Compañía de Teatro "Érase una Vez" - La Paz, Bolivia`;

  const mailtoUrl = `mailto:${encodeURIComponent(correoDestino)}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo)}`;

  const telWa = telefonoDestino
    ? telefonoDestino.startsWith('591')
      ? telefonoDestino
      : `591${telefonoDestino}`
    : '';
  const whatsappUrl = telWa
    ? `https://wa.me/${telWa}?text=${encodeURIComponent(cuerpo)}`
    : `https://wa.me/?text=${encodeURIComponent(cuerpo)}`;

  return {
    asunto,
    cuerpo,
    correo_destino: correoDestino,
    telefono_destino: m.tutor_telefono || m.estudiante_telefono || '',
    mailto_url: mailtoUrl,
    whatsapp_url: whatsappUrl,
  };
}

// 1. Listar mensualidades con filtros
router.get('/', async (req, res, next) => {
  try {
    const { id_curso, id_estudiante, id_inscripcion, mes, anio, estado } = req.query;

    let sql = `
      SELECT m.id_pago_mensualidad AS id_mensualidad, m.id_inscripcion, m.mes, m.anio, m.monto, m.estado, m.fecha_pago,
             m.fecha_vencimiento, m.metodo_pago, m.observacion_pago,
             m.ultimo_recordatorio, COALESCE(m.cantidad_recordatorios, 0) AS cantidad_recordatorios,
             e.id_estudiante, e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos, e.ci AS estudiante_ci,
             e.telefono AS estudiante_telefono,
             COALESCE(NULLIF(e.correo, ''), u_tutor.correo) AS estudiante_correo,
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

    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.rol !== 'DOCENTE') {
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
    const { metodo_pago, observacion_pago } = req.body || {};

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
              id_usuario_registro = $1,
              metodo_pago = COALESCE($2, 'EFECTIVO / QR'),
              observacion_pago = COALESCE($3, observacion_pago)
        WHERE id_pago_mensualidad = $4
        RETURNING id_pago_mensualidad AS id_mensualidad, id_inscripcion, mes, anio, monto, estado, fecha_pago, metodo_pago, observacion_pago, id_usuario_registro`,
      [req.usuario.id, metodo_pago || 'EFECTIVO / QR', observacion_pago || null, req.params.id]
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

// 3. Generar y registrar recordatorio de correo para una mensualidad en retraso
router.post('/:id/recordatorio-correo', requerirRol('ADMINISTRADOR', 'DOCENTE'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT m.id_pago_mensualidad AS id_mensualidad, m.id_inscripcion, m.mes, m.anio, m.monto, m.estado,
              e.id_estudiante, e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos,
              e.telefono AS estudiante_telefono, e.tutor_nombre, e.tutor_telefono,
              COALESCE(NULLIF(e.correo, ''), u_tutor.correo) AS estudiante_correo,
              u_tutor.correo AS tutor_correo,
              c.nombre AS curso_nombre
         FROM pago_mensualidad m
         JOIN inscripcion i ON i.id_inscripcion = m.id_inscripcion
         JOIN estudiante e ON e.id_estudiante = i.id_estudiante
         JOIN curso c ON c.id_curso = i.id_curso
         LEFT JOIN usuario u_tutor ON u_tutor.id_usuario = e.id_usuario
        WHERE m.id_pago_mensualidad = $1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Mensualidad no encontrada' });
    }

    const m = rows[0];
    const notificacion = construirCorreoRecordatorio(m);

    const { rows: actRows } = await db.query(
      `UPDATE pago_mensualidad
          SET ultimo_recordatorio = NOW(),
              cantidad_recordatorios = COALESCE(cantidad_recordatorios, 0) + 1
        WHERE id_pago_mensualidad = $1
        RETURNING ultimo_recordatorio, cantidad_recordatorios`,
      [req.params.id]
    );

    res.json({
      ok: true,
      mensaje: `Recordatorio de pago generado y registrado para ${m.estudiante_nombres} ${m.estudiante_apellidos}`,
      ultimo_recordatorio: actRows[0]?.ultimo_recordatorio,
      cantidad_recordatorios: actRows[0]?.cantidad_recordatorios,
      notificacion,
    });
  } catch (e) {
    next(e);
  }
});

// 4. Generar recordatorios masivos para todos los estudiantes con pagos pendientes
router.post('/recordatorio-masivo', requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows: pendientes } = await db.query(
      `SELECT m.id_pago_mensualidad AS id_mensualidad, m.mes, m.anio, m.monto,
              e.nombres AS estudiante_nombres, e.apellidos AS estudiante_apellidos,
              e.telefono AS estudiante_telefono, e.tutor_nombre, e.tutor_telefono,
              COALESCE(NULLIF(e.correo, ''), u_tutor.correo) AS estudiante_correo,
              u_tutor.correo AS tutor_correo,
              c.nombre AS curso_nombre
         FROM pago_mensualidad m
         JOIN inscripcion i ON i.id_inscripcion = m.id_inscripcion
         JOIN estudiante e ON e.id_estudiante = i.id_estudiante
         JOIN curso c ON c.id_curso = i.id_curso
         LEFT JOIN usuario u_tutor ON u_tutor.id_usuario = e.id_usuario
        WHERE m.estado = 'PENDIENTE'
        ORDER BY e.apellidos, e.nombres`
    );

    if (pendientes.length === 0) {
      return res.json({
        ok: true,
        mensaje: 'No existen mensualidades pendientes en este momento.',
        total_notificados: 0,
        recordatorios: [],
      });
    }

    const ids = pendientes.map((p) => p.id_mensualidad);
    await db.query(
      `UPDATE pago_mensualidad
          SET ultimo_recordatorio = NOW(),
              cantidad_recordatorios = COALESCE(cantidad_recordatorios, 0) + 1
        WHERE id_pago_mensualidad = ANY($1::int[])`,
      [ids]
    );

    const recordatorios = pendientes.map((m) => ({
      id_mensualidad: m.id_mensualidad,
      estudiante: `${m.estudiante_nombres} ${m.estudiante_apellidos}`,
      curso: m.curso_nombre,
      periodo: `${m.mes}/${m.anio}`,
      monto: m.monto,
      ...construirCorreoRecordatorio(m),
    }));

    res.json({
      ok: true,
      mensaje: `Se generaron y registraron ${recordatorios.length} correos de recordatorio de pago.`,
      total_notificados: recordatorios.length,
      recordatorios,
    });
  } catch (e) {
    next(e);
  }
});

// 5. Generar cuotas de mensualidad para un período nuevo (Administrador)
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
    const fechaVenc = `${anio}-${String(mes).padStart(2, '0')}-10`;

    for (const act of activas) {
      const { rowCount } = await db.query(
        `INSERT INTO pago_mensualidad (id_inscripcion, mes, anio, monto, estado, fecha_vencimiento)
         VALUES ($1, $2, $3, $4, 'PENDIENTE', $5)
         ON CONFLICT (id_inscripcion, mes, anio) DO NOTHING`,
        [act.id_inscripcion, mes, anio, act.mensualidad, fechaVenc]
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
