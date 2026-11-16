const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken, requerirRol('ADMINISTRADOR', 'DOCENTE'));

// 1. Reporte de Ventas e Ingresos de Taquilla
router.get('/ventas', async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_obra, id_funcion } = req.query;

    let sql = `
      SELECT vrf.id_presentacion AS id_funcion, o.titulo, vrf.fecha, f.hora_inicio,
             s.nombre AS sala_nombre, s.capacidad,
             vrf.boletos_vendidos, vrf.entradas_gratuitas, vrf.ingresos, vrf.asistentes,
             (vrf.boletos_vendidos + vrf.entradas_gratuitas) AS total_emitidos
        FROM vista_reporte_presentacion vrf
        JOIN presentacion f ON f.id_presentacion = vrf.id_presentacion
        JOIN obra o ON o.id_obra = f.id_obra
        JOIN sala s ON s.id_sala = f.id_sala
       WHERE 1=1`;

    const params = [];

    if (fecha_inicio) {
      params.push(fecha_inicio);
      sql += ` AND vrf.fecha >= $${params.length}`;
    }

    if (fecha_fin) {
      params.push(fecha_fin);
      sql += ` AND vrf.fecha <= $${params.length}`;
    }

    if (id_obra) {
      params.push(id_obra);
      sql += ` AND f.id_obra = $${params.length}`;
    }

    if (id_funcion) {
      params.push(id_funcion);
      sql += ` AND vrf.id_presentacion = $${params.length}`;
    }

    sql += ` ORDER BY vrf.fecha DESC, f.hora_inicio DESC`;

    const { rows: funciones } = await db.query(sql, params);

    let totalBoletosVendidos = 0;
    let totalEntradasGratuitas = 0;
    let totalIngresos = 0;
    let totalAsistentes = 0;

    funciones.forEach((f) => {
      totalBoletosVendidos += parseInt(f.boletos_vendidos, 10) || 0;
      totalEntradasGratuitas += parseInt(f.entradas_gratuitas, 10) || 0;
      totalIngresos += parseFloat(f.ingresos) || 0;
      totalAsistentes += parseInt(f.asistentes, 10) || 0;
    });

    res.json({
      resumen: {
        total_funciones: funciones.length,
        total_boletos_vendidos: totalBoletosVendidos,
        total_entradas_gratuitas: totalEntradasGratuitas,
        total_boletos_emitidos: totalBoletosVendidos + totalEntradasGratuitas,
        total_ingresos: Number(totalIngresos.toFixed(2)),
        total_asistentes: totalAsistentes,
      },
      funciones,
    });
  } catch (e) {
    next(e);
  }
});

// 2. Reporte de Ocupación de Sala y Asistencia en Puerta
router.get('/asistencia', async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let sql = `
      SELECT f.id_presentacion AS id_funcion, o.titulo, f.fecha, f.hora_inicio,
             s.nombre AS sala, s.capacidad,
             vrf.boletos_vendidos, vrf.entradas_gratuitas, vrf.asistentes,
             (vrf.boletos_vendidos + vrf.entradas_gratuitas) AS total_emitidos,
             CASE
               WHEN s.capacidad > 0 THEN
                 ROUND(((vrf.boletos_vendidos + vrf.entradas_gratuitas)::numeric / s.capacidad::numeric) * 100, 1)
               ELSE 0
             END AS porcentaje_ocupacion,
             CASE
               WHEN (vrf.boletos_vendidos + vrf.entradas_gratuitas) > 0 THEN
                 ROUND((vrf.asistentes::numeric / (vrf.boletos_vendidos + vrf.entradas_gratuitas)::numeric) * 100, 1)
               ELSE 0
             END AS porcentaje_asistencia
        FROM presentacion f
        JOIN obra o ON o.id_obra = f.id_obra
        JOIN sala s ON s.id_sala = f.id_sala
        JOIN vista_reporte_presentacion vrf ON vrf.id_presentacion = f.id_presentacion
       WHERE 1=1`;

    const params = [];
    if (fecha_inicio) {
      params.push(fecha_inicio);
      sql += ` AND f.fecha >= $${params.length}`;
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      sql += ` AND f.fecha <= $${params.length}`;
    }

    sql += ` ORDER BY f.fecha DESC, f.hora_inicio DESC`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// 3. Reporte de Cobro de Mensualidades de Cursos
router.get('/mensualidades', async (req, res, next) => {
  try {
    const { id_curso, mes, anio } = req.query;

    let sql = `
      SELECT c.id_curso, c.nombre AS curso_nombre, c.mensualidad AS costo_mensual,
             COUNT(m.id_pago_mensualidad) AS total_cuotas,
             COUNT(m.id_pago_mensualidad) FILTER (WHERE m.estado = 'PAGADA') AS cuotas_pagadas,
             COUNT(m.id_pago_mensualidad) FILTER (WHERE m.estado = 'PENDIENTE') AS cuotas_pendientes,
             COALESCE(SUM(m.monto) FILTER (WHERE m.estado = 'PAGADA'), 0) AS total_recaudado,
             COALESCE(SUM(m.monto) FILTER (WHERE m.estado = 'PENDIENTE'), 0) AS total_pendiente
        FROM curso c
        JOIN inscripcion i ON i.id_curso = c.id_curso
        JOIN pago_mensualidad m ON m.id_inscripcion = i.id_inscripcion
       WHERE 1=1`;

    const params = [];
    if (id_curso) {
      params.push(id_curso);
      sql += ` AND c.id_curso = $${params.length}`;
    }
    if (mes) {
      params.push(mes);
      sql += ` AND m.mes = $${params.length}`;
    }
    if (anio) {
      params.push(anio);
      sql += ` AND m.anio = $${params.length}`;
    }

    sql += ` GROUP BY c.id_curso, c.nombre, c.mensualidad ORDER BY c.nombre`;

    const { rows: porCurso } = await db.query(sql, params);

    let granTotalRecaudado = 0;
    let granTotalPendiente = 0;
    let cuotasPagadas = 0;
    let cuotasPendientes = 0;

    porCurso.forEach((c) => {
      granTotalRecaudado += parseFloat(c.total_recaudado) || 0;
      granTotalPendiente += parseFloat(c.total_pendiente) || 0;
      cuotasPagadas += parseInt(c.cuotas_pagadas, 10) || 0;
      cuotasPendientes += parseInt(c.cuotas_pendientes, 10) || 0;
    });

    res.json({
      resumen: {
        total_recaudado: Number(granTotalRecaudado.toFixed(2)),
        total_pendiente: Number(granTotalPendiente.toFixed(2)),
        cuotas_pagadas: cuotasPagadas,
        cuotas_pendientes: cuotasPendientes,
        total_cuotas: cuotasPagadas + cuotasPendientes,
        porcentaje_cobro: (cuotasPagadas + cuotasPendientes) > 0
          ? Number(((cuotasPagadas / (cuotasPagadas + cuotasPendientes)) * 100).toFixed(1))
          : 0,
      },
      cursos: porCurso,
    });
  } catch (e) {
    next(e);
  }
});

// 4. Informe Académico de Talleres: Asistencia, Crecimiento, Culminación y Certificados
router.get('/talleres', async (req, res, next) => {
  try {
    const { id_curso } = req.query;
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
             e.ci AS estudiante_ci, e.telefono AS estudiante_telefono,
             e.tutor_nombre, e.tutor_telefono,
             COALESCE(NULLIF(e.correo, ''), u.correo) AS estudiante_correo,
             c.id_curso, c.nombre AS curso_nombre, c.publico, c.mensualidad
        FROM inscripcion i
        JOIN estudiante e ON e.id_estudiante = i.id_estudiante
        JOIN curso c ON c.id_curso = i.id_curso
        LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE 1=1`;

    const params = [];
    if (id_curso) {
      params.push(id_curso);
      sql += ` AND i.id_curso = $1`;
    }

    sql += ` ORDER BY c.nombre, e.apellidos, e.nombres`;

    const { rows: participantes } = await db.query(sql, params);

    const totalInscritos = participantes.length;
    const totalCulminaron = participantes.filter((p) => p.culmino_taller).length;
    const totalCertificados = participantes.filter((p) => p.certificado_otorgado).length;
    const sumaAsist = participantes.reduce((s, p) => s + Number(p.asistencia_porcentaje || 0), 0);
    const sumaNota = participantes.reduce((s, p) => s + Number(p.nota_final || 0), 0);

    res.json({
      resumen: {
        total_inscritos: totalInscritos,
        total_culminaron: totalCulminaron,
        total_certificados: totalCertificados,
        promedio_asistencia: totalInscritos > 0 ? Number((sumaAsist / totalInscritos).toFixed(1)) : 0,
        promedio_nota: totalInscritos > 0 ? Number((sumaNota / totalInscritos).toFixed(1)) : 0,
      },
      participantes,
    });
  } catch (e) {
    next(e);
  }
});

// 5. Métricas consolidadas para el Dashboard Principal
router.get('/dashboard', async (req, res, next) => {
  try {
    const { rows: oRows } = await db.query(
      `SELECT COUNT(*) FILTER (WHERE COALESCE(estado, 'ACTIVA') NOT IN ('INACTIVA', 'Finalizada')) AS activas,
              COUNT(*) FILTER (WHERE estado = 'Finalizada') AS historicas,
              COUNT(*) AS total
         FROM obra`
    );

    const { rows: fRows } = await db.query(
      `SELECT COUNT(*) FROM presentacion WHERE estado = 'PROGRAMADA'`
    );

    const { rows: vMes } = await db.query(
      `SELECT COUNT(b.id_boleto) FILTER (WHERE b.tipo = 'PAGADO') AS boletos_mes,
              COALESCE(SUM(b.precio) FILTER (WHERE b.tipo = 'PAGADO'), 0) AS ingresos_mes
         FROM boleto b
         JOIN venta v ON v.id_venta = b.id_venta
        WHERE b.estado IN ('EMITIDO', 'USADO')`
    );

    const { rows: cRows } = await db.query(`SELECT COUNT(*) FROM curso WHERE estado = 'ACTIVO'`);
    const { rows: eRows } = await db.query(
      `SELECT COUNT(DISTINCT id_estudiante) AS activos,
              COUNT(*) FILTER (WHERE culmino_taller = TRUE) AS culminados,
              COUNT(*) FILTER (WHERE certificado_otorgado = TRUE) AS certificados
         FROM inscripcion`
    );

    const { rows: mMes } = await db.query(
      `SELECT COALESCE(SUM(monto) FILTER (WHERE estado = 'PAGADA'), 0) AS cobrado_mes,
              COALESCE(SUM(monto) FILTER (WHERE estado = 'PENDIENTE'), 0) AS pendiente_mes
         FROM pago_mensualidad`
    );

    res.json({
      obras_activas: parseInt(oRows[0].activas, 10) || 0,
      obras_historicas: parseInt(oRows[0].historicas, 10) || 0,
      obras_totales: parseInt(oRows[0].total, 10) || 0,
      proximas_funciones: parseInt(fRows[0].count, 10) || 0,
      boletos_vendidos_mes: parseInt(vMes[0].boletos_mes, 10) || 0,
      ingresos_taquilla_mes: parseFloat(vMes[0].ingresos_mes) || 0,
      cursos_activos: parseInt(cRows[0].count, 10) || 0,
      estudiantes_activos: parseInt(eRows[0].activos, 10) || 0,
      talleres_culminados: parseInt(eRows[0].culminados, 10) || 0,
      certificados_emitidos: parseInt(eRows[0].certificados, 10) || 0,
      mensualidades_cobradas_mes: parseFloat(mMes[0].cobrado_mes) || 0,
      mensualidades_pendientes_mes: parseFloat(mMes[0].pendiente_mes) || 0,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
