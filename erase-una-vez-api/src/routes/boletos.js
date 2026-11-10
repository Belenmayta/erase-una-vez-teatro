const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

const SELECT_BOLETO = `
  SELECT b.id_boleto, b.codigo_qr, b.tipo, b.precio, b.estado,
         a.id_asiento, a.fila, a.numero, a.zona,
         f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio,
         o.id_obra, o.titulo AS obra_titulo, o.duracion_min, o.publico_objetivo, o.afiche_url,
         s.id_sala, s.nombre AS sala_nombre, s.direccion AS sala_direccion,
         v.id_venta, v.fecha_venta, v.id_usuario,
         u.nombres AS comprador_nombres, u.apellidos AS comprador_apellidos, u.ci AS comprador_ci,
         i.id_ingreso, i.fecha_hora AS fecha_hora_ingreso
    FROM boleto b
    JOIN asiento a ON a.id_asiento = b.id_asiento
    JOIN presentacion f ON f.id_presentacion = b.id_presentacion
    JOIN obra o ON o.id_obra = f.id_obra
    JOIN sala s ON s.id_sala = f.id_sala
    JOIN venta v ON v.id_venta = b.id_venta
    JOIN usuario u ON u.id_usuario = v.id_usuario
    LEFT JOIN ingreso i ON i.id_boleto = b.id_boleto`;

// 1. Mis boletos (Comprador autenticado)
router.get('/mis-boletos', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `${SELECT_BOLETO}
        WHERE v.id_usuario = $1
          AND b.estado IN ('EMITIDO', 'USADO')
        ORDER BY f.fecha DESC, f.hora_inicio DESC, a.fila, a.numero`,
      [req.usuario.id]
    );

    const boletosConQr = await Promise.all(
      rows.map(async (b) => {
        const qrImagen = await QRCode.toDataURL(b.codigo_qr, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 250,
        });
        return { ...b, qr_imagen: qrImagen };
      })
    );

    res.json(boletosConQr);
  } catch (e) {
    next(e);
  }
});

// 2. Detalle de un boleto por ID
router.get('/:id', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await db.query(`${SELECT_BOLETO} WHERE b.id_boleto = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Boleto no encontrado' });

    const boleto = rows[0];

    if (
      req.usuario.rol !== 'ADMINISTRADOR' &&
      req.usuario.rol !== 'RECEPCION' &&
      boleto.id_usuario !== req.usuario.id
    ) {
      return res.status(403).json({ error: 'No tiene permiso para ver este boleto' });
    }

    const qrImagen = await QRCode.toDataURL(boleto.codigo_qr, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    res.json({ ...boleto, qr_imagen: qrImagen });
  } catch (e) {
    next(e);
  }
});

// 3. Obtener solo imagen QR de un boleto
router.get('/:id/qr', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT codigo_qr FROM boleto WHERE id_boleto = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Boleto no encontrado' });

    res.setHeader('Content-Type', 'image/png');
    await QRCode.toFileStream(res, rows[0].codigo_qr, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 350,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;