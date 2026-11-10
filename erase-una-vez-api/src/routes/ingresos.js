const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de validación de ingresos requieren rol RECEPCION o ADMINISTRADOR
router.use(verificarToken, requerirRol('RECEPCION', 'ADMINISTRADOR'));

// 1. Validar ingreso escaneando código QR en puerta
router.post('/validar', async (req, res, next) => {
  const { codigo_qr, id_funcion } = req.body;

  if (!codigo_qr) {
    return res.status(400).json({ ok: false, motivo: 'DATOS_INCOMPLETOS', mensaje: 'Debe escanear o ingresar el código QR del boleto' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Buscar el boleto por código QR (Adaptado a la tabla presentacion)
    const { rows: bRows } = await client.query(
      `SELECT b.id_boleto, b.id_presentacion AS id_funcion, b.id_asiento, b.codigo_qr, b.tipo, b.precio, b.estado,
              a.fila, a.numero, a.zona,
              f.fecha, f.hora_inicio, f.id_sala,
              o.titulo AS obra_titulo,
              s.nombre AS sala_nombre,
              u.nombres AS comprador_nombres, u.apellidos AS comprador_apellidos, u.ci AS comprador_ci
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
         JOIN presentacion f ON f.id_presentacion = b.id_presentacion
         JOIN obra o ON o.id_obra = f.id_obra
         JOIN sala s ON s.id_sala = f.id_sala
         JOIN venta v ON v.id_venta = b.id_venta
         JOIN usuario u ON u.id_usuario = v.id_usuario
        WHERE b.codigo_qr = $1`,
      [codigo_qr.trim()]
    );

    if (!bRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        ok: false,
        motivo: 'BOLETO_INEXISTENTE',
        mensaje: 'Acceso denegado: El código QR no corresponde a ningún boleto del teatro.',
      });
    }

    const boleto = bRows[0];

    // Verificar si corresponde a la presentación activa seleccionada
    if (id_funcion && Number(boleto.id_funcion) !== Number(id_funcion)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        motivo: 'FUNCION_INCORRECTA',
        mensaje: `Acceso denegado: El boleto corresponde a otra función (${boleto.obra_titulo} - ${boleto.fecha} ${boleto.hora_inicio}).`,
        boleto: {
          obra: boleto.obra_titulo,
          fecha: boleto.fecha,
          hora: boleto.hora_inicio,
        },
      });
    }

    // Verificar si el boleto está anulado o reservado sin pagar
    if (boleto.estado === 'ANULADO') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        motivo: 'BOLETO_ANULADO',
        mensaje: 'Acceso denegado: Este boleto fue anulado o la reserva expiró.',
      });
    }

    if (boleto.estado === 'RESERVADO') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        motivo: 'BOLETO_NO_PAGADO',
        mensaje: 'Acceso denegado: Este boleto está pendiente de pago y no ha sido emitido.',
      });
    }

    // Verificar si ya fue utilizado (ingreso previo)
    const { rows: iRows } = await client.query(
      `SELECT i.id_ingreso, i.fecha_hora, u.nombres AS validador_nombres, u.apellidos AS validador_apellidos
         FROM ingreso i
         JOIN usuario u ON u.id_usuario = i.id_usuario
        WHERE i.id_boleto = $1`,
      [boleto.id_boleto]
    );

    if (iRows[0] || boleto.estado === 'USADO') {
      await client.query('ROLLBACK');
      const ingresoPrevio = iRows[0] || {};
      return res.status(409).json({
        ok: false,
        motivo: 'BOLETO_YA_UTILIZADO',
        mensaje: `¡Alerta! Este boleto YA FUE UTILIZADO para ingresar.`,
        asiento: `Fila ${boleto.fila} Asiento #${boleto.numero}`,
        hora_ingreso_previo: ingresoPrevio.fecha_hora || 'Previamente registrado',
        validado_por: ingresoPrevio.validador_nombres ? `${ingresoPrevio.validador_nombres} ${ingresoPrevio.validador_apellidos}` : 'Personal de puerta',
      });
    }

    // Si es válido y está EMITIDO: registrar ingreso
    const { rows: nuevoIngreso } = await client.query(
      `INSERT INTO ingreso (id_boleto, id_usuario, fecha_hora)
       VALUES ($1, $2, NOW())
       RETURNING id_ingreso, fecha_hora`,
      [boleto.id_boleto, req.usuario.id]
    );

    // Actualizar estado del boleto a USADO
    await client.query(`UPDATE boleto SET estado = 'USADO' WHERE id_boleto = $1`, [boleto.id_boleto]);

    await client.query('COMMIT');

    res.json({
      ok: true,
      mensaje: '¡Acceso autorizado!',
      ingreso: nuevoIngreso[0],
      boleto: {
        id_boleto: boleto.id_boleto,
        asiento: `Fila ${boleto.fila} - Asiento #${boleto.numero}`,
        fila: boleto.fila,
        numero: boleto.numero,
        zona: boleto.zona,
        tipo: boleto.tipo,
        comprador: `${boleto.comprador_nombres} ${boleto.comprador_apellidos}`,
        ci: boleto.comprador_ci,
        obra: boleto.obra_titulo,
        sala: boleto.sala_nombre,
        fecha: boleto.fecha,
        hora_inicio: boleto.hora_inicio,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 2. Historial de ingresos de una presentación (función)
router.get('/funcion/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT i.id_ingreso, i.fecha_hora,
              b.id_boleto, b.codigo_qr, b.tipo, b.precio,
              a.fila, a.numero, a.zona,
              u_comp.nombres AS comprador_nombres, u_comp.apellidos AS comprador_apellidos, u_comp.ci AS comprador_ci,
              u_val.nombres AS validador_nombres, u_val.apellidos AS validador_apellidos
         FROM ingreso i
         JOIN boleto b ON b.id_boleto = i.id_boleto
         JOIN asiento a ON a.id_asiento = b.id_asiento
         JOIN venta v ON v.id_venta = b.id_venta
         JOIN usuario u_comp ON u_comp.id_usuario = v.id_usuario
         JOIN usuario u_val ON u_val.id_usuario = i.id_usuario
        WHERE b.id_presentacion = $1
        ORDER BY i.fecha_hora DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;