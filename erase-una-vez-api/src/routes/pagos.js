const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// 1. Generar código QR dinámico de pago para una venta pendiente
router.post('/generar-qr/:idVenta', verificarToken, async (req, res, next) => {
  try {
    const idVenta = req.params.idVenta;

    // Verificar venta (Adaptado a la tabla presentacion)
    const { rows: vRows } = await db.query(
      `SELECT v.id_venta, v.id_usuario, v.id_presentacion AS id_funcion, v.total, v.estado, v.fecha_limite_pago,
              o.titulo AS obra_titulo, f.fecha, f.hora_inicio
         FROM venta v
         JOIN presentacion f ON f.id_presentacion = v.id_presentacion
         JOIN obra o ON o.id_obra = f.id_obra
        WHERE v.id_venta = $1`,
      [idVenta]
    );

    if (!vRows[0]) return res.status(404).json({ error: 'Venta no encontrada' });
    const venta = vRows[0];

    // Permisos
    if (req.usuario.rol !== 'ADMINISTRADOR' && venta.id_usuario !== req.usuario.id) {
      return res.status(403).json({ error: 'No tiene permiso para pagar esta venta' });
    }

    if (venta.estado === 'PAGADA') {
      return res.status(400).json({ error: 'Esta venta ya fue pagada con anterioridad' });
    }

    if (venta.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: `La venta se encuentra en estado ${venta.estado}` });
    }

    // Verificar si la reserva ya expiró
    const ahora = new Date();
    if (new Date(venta.fecha_limite_pago) < ahora) {
      // Liberar asientos y marcar vencida
      await db.query(`UPDATE boleto SET estado = 'ANULADO' WHERE id_venta = $1 AND estado = 'RESERVADO'`, [idVenta]);
      await db.query(`UPDATE venta SET estado = 'VENCIDA' WHERE id_venta = $1`, [idVenta]);
      return res.status(400).json({
        error: 'El tiempo límite de 15 minutos para pagar la reserva ha expirado. Por favor seleccione nuevamente sus asientos.',
      });
    }

    // Generar referencia única de pago
    const refAleatoria = crypto.randomBytes(4).toString('hex').toUpperCase();
    const referenciaQr = `QR-EUV-${venta.id_venta}-${Date.now().toString(36).toUpperCase()}-${refAleatoria}`;

    // Registrar en tabla pago en estado PENDIENTE
    const { rows: pRows } = await db.query(
      `INSERT INTO pago (id_venta, referencia_qr, monto, estado, fecha_generacion)
       VALUES ($1, $2, $3, 'PENDIENTE', NOW())
       RETURNING id_pago, id_venta, referencia_qr, monto, estado, fecha_generacion`,
      [venta.id_venta, referenciaQr, venta.total]
    );
    const pago = pRows[0];

    // Payload de pago QR dinámico (formato estandarizado)
    const payloadPago = JSON.stringify({
      comercio: 'Compañía de Teatro Érase una Vez',
      ciudad: 'La Paz - Bolivia',
      id_pago: pago.id_pago,
      id_venta: venta.id_venta,
      referencia: referenciaQr,
      monto: Number(venta.total).toFixed(2),
      moneda: 'BOB',
      concepto: `Entradas presentación: ${venta.obra_titulo} (${venta.fecha} ${venta.hora_inicio})`,
      fecha_limite: venta.fecha_limite_pago,
    });

    // Generar imagen QR en Base64
    const qrImagenDataUrl = await QRCode.toDataURL(payloadPago, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    res.status(201).json({
      mensaje: 'Código QR de pago generado con éxito',
      pago: {
        id_pago: pago.id_pago,
        id_venta: pago.id_venta,
        referencia_qr: pago.referencia_qr,
        monto: pago.monto,
        estado: pago.estado,
        fecha_limite_pago: venta.fecha_limite_pago,
        qr_imagen: qrImagenDataUrl,
        payload: payloadPago,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Confirmar pago (notificación de pasarela o confirmación de prueba)
router.post('/confirmar', verificarToken, async (req, res, next) => {
  const { id_pago, referencia_qr } = req.body;

  if (!id_pago && !referencia_qr) {
    return res.status(400).json({ error: 'Debe proporcionar el id_pago o la referencia_qr a confirmar' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Buscar el pago
    let queryPago = `SELECT * FROM pago WHERE `;
    queryPago += id_pago ? `id_pago = $1` : `referencia_qr = $1`;
    const { rows: pRows } = await client.query(queryPago, [id_pago || referencia_qr]);

    if (!pRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const pago = pRows[0];

    if (pago.estado === 'CONFIRMADO') {
      await client.query('ROLLBACK');
      return res.status(200).json({ mensaje: 'El pago ya se encontraba confirmado previamente' });
    }

    // Buscar la venta
    const { rows: vRows } = await client.query('SELECT * FROM venta WHERE id_venta = $1', [pago.id_venta]);
    const venta = vRows[0];

    if (!venta) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta asociada no encontrada' });
    }

    // Verificar si la reserva ya venció
    if (new Date(venta.fecha_limite_pago) < new Date() && venta.estado === 'PENDIENTE') {
      await client.query(`UPDATE pago SET estado = 'VENCIDO' WHERE id_pago = $1`, [pago.id_pago]);
      await client.query(`UPDATE boleto SET estado = 'ANULADO' WHERE id_venta = $1`, [venta.id_venta]);
      await client.query(`UPDATE venta SET estado = 'VENCIDA' WHERE id_venta = $1`, [venta.id_venta]);
      await client.query('COMMIT');
      return res.status(400).json({ error: 'El tiempo límite de la reserva ha expirado. Los asientos fueron liberados.' });
    }

    // Marcar pago como CONFIRMADO
    await client.query(
      `UPDATE pago SET estado = 'CONFIRMADO', fecha_pago = NOW() WHERE id_pago = $1`,
      [pago.id_pago]
    );

    // Marcar venta como PAGADA
    await client.query(
      `UPDATE venta SET estado = 'PAGADA' WHERE id_venta = $1`,
      [venta.id_venta]
    );

    // Emitir boletos y generar sus códigos QR únicos finales
    const { rows: boletosReservados } = await client.query(
      `SELECT b.id_boleto, b.id_asiento, a.fila, a.numero, a.zona
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
        WHERE b.id_venta = $1`,
      [venta.id_venta]
    );

    const boletosEmitidos = [];
    for (const b of boletosReservados) {
      const qrFinal = `EUV-TK-${b.id_boleto}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await client.query(
        `UPDATE boleto SET estado = 'EMITIDO', codigo_qr = $1 WHERE id_boleto = $2`,
        [qrFinal, b.id_boleto]
      );
      boletosEmitidos.push({
        id_boleto: b.id_boleto,
        asiento: `${b.fila}-${b.numero}`,
        zona: b.zona,
        codigo_qr: qrFinal,
        estado: 'EMITIDO',
      });
    }

    await client.query('COMMIT');

    res.json({
      ok: true,
      mensaje: '¡Pago confirmado con éxito! Los boletos digitales fueron emitidos.',
      pago: {
        id_pago: pago.id_pago,
        referencia_qr: pago.referencia_qr,
        monto: pago.monto,
        estado: 'CONFIRMADO',
      },
      venta: {
        id_venta: venta.id_venta,
        estado: 'PAGADA',
      },
      boletos: boletosEmitidos,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 3. Consultar estado del pago
router.get('/estado/:idPago', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.id_pago, p.id_venta, p.referencia_qr, p.monto, p.estado AS estado_pago,
              p.fecha_generacion, p.fecha_pago,
              v.estado AS estado_venta, v.fecha_limite_pago
         FROM pago p
         JOIN venta v ON v.id_venta = p.id_venta
        WHERE p.id_pago = $1`,
      [req.params.idPago]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;