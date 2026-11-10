const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');
const { tieneSectoresMultiples, calcularSectorYPrecio } = require('./presentaciones');

const router = express.Router();

// Helper para liberar reservas vencidas (Adaptado a presentacion)
async function liberarReservasVencidas(idPresentacion = null) {
  try {
    let sqlBoletos = `
      UPDATE boleto SET estado = 'ANULADO'
       WHERE estado = 'RESERVADO'
         AND id_venta IN (
           SELECT id_venta FROM venta
            WHERE estado = 'PENDIENTE'
              AND fecha_limite_pago < NOW()
              ${idPresentacion ? 'AND id_presentacion = $1' : ''}
         )`;
    let sqlVentas = `
      UPDATE venta SET estado = 'VENCIDA'
       WHERE estado = 'PENDIENTE'
         AND fecha_limite_pago < NOW()
         ${idPresentacion ? 'AND id_presentacion = $1' : ''}`;

    const params = idPresentacion ? [idPresentacion] : [];
    await db.query(sqlBoletos, params);
    await db.query(sqlVentas, params);
  } catch (err) {
    console.error('Error liberando reservas vencidas:', err.message);
  }
}

// 1. Reservar asientos para una presentación (Comprador o Administrador)
router.post('/reservar', verificarToken, async (req, res, next) => {
  const { id_funcion: id_presentacion, asientos } = req.body;

  if (!id_presentacion || !Array.isArray(asientos) || asientos.length === 0) {
    return res.status(400).json({ error: 'Debe especificar la presentación y seleccionar al menos un asiento' });
  }

  const idAsientosUnicos = [...new Set(asientos.map(Number))];
  if (idAsientosUnicos.some(isNaN)) {
    return res.status(400).json({ error: 'Identificadores de asientos no válidos' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Limpiar reservas vencidas
    await client.query(
      `UPDATE boleto SET estado = 'ANULADO'
        WHERE estado = 'RESERVADO'
          AND id_venta IN (
            SELECT id_venta FROM venta
             WHERE estado = 'PENDIENTE' AND fecha_limite_pago < NOW() AND id_presentacion = $1
          )`,
      [id_presentacion]
    );
    await client.query(
      `UPDATE venta SET estado = 'VENCIDA'
        WHERE estado = 'PENDIENTE' AND fecha_limite_pago < NOW() AND id_presentacion = $1`,
      [id_presentacion]
    );

    // Verificar presentación y sala
    const { rows: fRows } = await client.query(
      `SELECT f.id_presentacion AS id_funcion, f.precio, f.estado, f.id_sala, o.titulo,
              s.nombre AS sala_nombre, s.capacidad
         FROM presentacion f
         JOIN obra o ON o.id_obra = f.id_obra
         JOIN sala s ON s.id_sala = f.id_sala
        WHERE f.id_presentacion = $1`,
      [id_presentacion]
    );

    if (!fRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const funcion = fRows[0];
    if (funcion.estado !== 'PROGRAMADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `La presentación se encuentra ${funcion.estado} y no admite reservas` });
    }

    // Verificar que los asientos pertenezcan a la sala de la presentación
    const { rows: asientosValidos } = await client.query(
      `SELECT id_asiento, fila, numero, zona, tipo_asiento FROM asiento
        WHERE id_sala = $1 AND id_asiento = ANY($2::int[])`,
      [funcion.id_sala, idAsientosUnicos]
    );

    if (asientosValidos.length !== idAsientosUnicos.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Uno o más asientos no corresponden a la sala de esta presentación' });
    }

    // Comprobar si alguno de los asientos ya está ocupado o reservado
    const { rows: ocupados } = await client.query(
      `SELECT b.id_asiento, a.fila, a.numero, b.estado
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
        WHERE b.id_presentacion = $1
          AND b.id_asiento = ANY($2::int[])
          AND b.estado <> 'ANULADO'`,
      [id_presentacion, idAsientosUnicos]
    );

    if (ocupados.length > 0) {
      await client.query('ROLLBACK');
      const detalle = ocupados.map((o) => `${o.fila}-${o.numero}`).join(', ');
      return res.status(409).json({
        error: `Los siguientes asientos ya no están disponibles: ${detalle}. Por favor elija otros asientos.`,
        asientosOcupados: ocupados,
      });
    }

    const precioBase = Number(funcion.precio);
    const esMultiple = tieneSectoresMultiples(funcion.sala_nombre, funcion.capacidad);

    // Calcular precio individual por sector (VIP / PLATEA / MEZZANINE o GENERAL)
    const asientosConPrecio = asientosValidos.map((a) => {
      const infoSector = calcularSectorYPrecio(
        a.fila,
        precioBase,
        esMultiple,
        a.tipo_asiento,
        funcion.sala_nombre
      );
      return {
        ...a,
        sector: infoSector.sector,
        zona: infoSector.zona_nombre,
        precio_asiento: infoSector.precio,
      };
    });

    const total = asientosConPrecio.reduce((sum, a) => sum + a.precio_asiento, 0);

    // Crear venta en estado PENDIENTE con tiempo límite de 15 minutos
    const { rows: vRows } = await client.query(
      `INSERT INTO venta (id_usuario, id_presentacion, fecha_limite_pago, total, estado)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes', $3, 'PENDIENTE')
       RETURNING id_venta, id_usuario, id_presentacion AS id_funcion, fecha_venta, fecha_limite_pago, total, estado`,
      [req.usuario.id, id_presentacion, total]
    );
    const venta = vRows[0];

    // Insertar boletos en estado RESERVADO con el precio correspondiente a su sector
    const boletosCreados = [];
    for (const a of asientosConPrecio) {
      const provisionalQr = `RES-${venta.id_venta}-${a.id_asiento}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const { rows: bRows } = await client.query(
        `INSERT INTO boleto (id_venta, id_presentacion, id_asiento, codigo_qr, tipo, precio, estado)
         VALUES ($1, $2, $3, $4, 'PAGADO', $5, 'RESERVADO')
         RETURNING id_boleto, id_asiento, codigo_qr, tipo, precio, estado`,
        [venta.id_venta, id_presentacion, a.id_asiento, provisionalQr, a.precio_asiento]
      );
      boletosCreados.push({
        ...bRows[0],
        fila: a.fila,
        numero: a.numero,
        zona: a.zona,
        sector: a.sector,
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Reserva creada con éxito. Tiene 15 minutos para completar el pago.',
      venta: {
        ...venta,
        obra: funcion.titulo,
        cantidad_asientos: boletosCreados.length,
        boletos: boletosCreados,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Uno o más asientos fueron reservados simultáneamente por otro usuario. Intente seleccionando otros.',
      });
    }
    next(err);
  } finally {
    client.release();
  }
});

// 2. Asignar entradas gratuitas (Cupo social - Solo Administrador)
router.post('/gratuita', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const { id_funcion: id_presentacion, asientos, id_usuario_beneficiario, beneficiario_nombre } = req.body;

  if (!id_presentacion || !Array.isArray(asientos) || asientos.length === 0) {
    return res.status(400).json({ error: 'Debe especificar la presentación y los asientos a asignar gratuitamente' });
  }

  const idAsientosUnicos = [...new Set(asientos.map(Number))];
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener presentación y cupo gratuito
    const { rows: fRows } = await client.query(
      `SELECT f.id_presentacion, f.cupo_gratuito, f.id_sala, o.titulo
         FROM presentacion f
         JOIN obra o ON o.id_obra = f.id_obra
        WHERE f.id_presentacion = $1`,
      [id_presentacion]
    );

    if (!fRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const funcion = fRows[0];

    // Conteo actual de entradas gratuitas emitidas
    const { rows: cRows } = await client.query(
      `SELECT COUNT(*) FROM boleto
        WHERE id_presentacion = $1 AND tipo = 'GRATUITO' AND estado <> 'ANULADO'`,
      [id_presentacion]
    );

    const actualesGratuitos = parseInt(cRows[0].count, 10);
    const disponiblesCupo = (funcion.cupo_gratuito || 0) - actualesGratuitos;

    if (idAsientosUnicos.length > disponiblesCupo) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `El cupo gratuito restante es de ${disponiblesCupo} entrada(s). No puede asignar ${idAsientosUnicos.length}.`,
      });
    }

    // Verificar asientos válidos en la sala
    const { rows: asientosValidos } = await client.query(
      `SELECT id_asiento, fila, numero, zona FROM asiento
        WHERE id_sala = $1 AND id_asiento = ANY($2::int[])`,
      [funcion.id_sala, idAsientosUnicos]
    );

    if (asientosValidos.length !== idAsientosUnicos.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Uno o más asientos no corresponden a la sala de esta presentación' });
    }

    // Verificar si algún asiento ya está tomado
    const { rows: ocupados } = await client.query(
      `SELECT b.id_asiento, a.fila, a.numero
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
        WHERE b.id_presentacion = $1
          AND b.id_asiento = ANY($2::int[])
          AND b.estado <> 'ANULADO'`,
      [id_presentacion, idAsientosUnicos]
    );

    if (ocupados.length > 0) {
      await client.query('ROLLBACK');
      const detalle = ocupados.map((o) => `${o.fila}-${o.numero}`).join(', ');
      return res.status(409).json({
        error: `Los asientos ${detalle} ya no se encuentran disponibles.`,
      });
    }

    const usuarioVenta = id_usuario_beneficiario || req.usuario.id;

    // Crear venta con total 0 y estado PAGADA
    const { rows: vRows } = await client.query(
      `INSERT INTO venta (id_usuario, id_presentacion, total, estado)
       VALUES ($1, $2, 0, 'PAGADA')
       RETURNING id_venta, id_usuario, id_presentacion AS id_funcion, fecha_venta, total, estado`,
      [usuarioVenta, id_presentacion]
    );
    const venta = vRows[0];

    // Crear boletos GRATUITO en estado EMITIDO con QR único definitivo
    const boletosCreados = [];
    for (const a of asientosValidos) {
      const qrDefinitivo = `EUV-GRAT-${venta.id_venta}-${a.id_asiento}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const { rows: bRows } = await client.query(
        `INSERT INTO boleto (id_venta, id_presentacion, id_asiento, codigo_qr, tipo, precio, estado)
         VALUES ($1, $2, $3, $4, 'GRATUITO', 0, 'EMITIDO')
         RETURNING id_boleto, id_asiento, codigo_qr, tipo, precio, estado`,
        [venta.id_venta, id_presentacion, a.id_asiento, qrDefinitivo]
      );
      boletosCreados.push({
        ...bRows[0],
        fila: a.fila,
        numero: a.numero,
        zona: a.zona,
        beneficiario: beneficiario_nombre || 'Cupo Social Infantil',
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Entradas gratuitas asignadas con éxito.',
      venta: {
        ...venta,
        obra: funcion.titulo,
        boletos: boletosCreados,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// 3. Mis compras (Comprador autenticado)
router.get('/mis-compras', verificarToken, async (req, res, next) => {
  try {
    await liberarReservasVencidas();
    const { rows: ventas } = await db.query(
      `SELECT v.id_venta, v.fecha_venta, v.fecha_limite_pago, v.total, v.estado,
              f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio, f.precio AS precio_funcion,
              o.titulo AS obra_titulo, o.afiche_url,
              s.nombre AS sala_nombre,
              p.id_pago, p.referencia_qr, p.estado AS estado_pago, p.fecha_pago
         FROM venta v
         JOIN presentacion f ON f.id_presentacion = v.id_presentacion
         JOIN obra o ON o.id_obra = f.id_obra
         JOIN sala s ON s.id_sala = f.id_sala
         LEFT JOIN pago p ON p.id_venta = v.id_venta
        WHERE v.id_usuario = $1
        ORDER BY v.fecha_venta DESC`,
      [req.usuario.id]
    );

    const ventasConBoletos = await Promise.all(
      ventas.map(async (v) => {
        const { rows: boletos } = await db.query(
          `SELECT b.id_boleto, b.codigo_qr, b.tipo, b.precio, b.estado,
                  a.fila, a.numero, a.zona
             FROM boleto b
             JOIN asiento a ON a.id_asiento = b.id_asiento
            WHERE b.id_venta = $1
            ORDER BY a.fila, a.numero`,
          [v.id_venta]
        );
        return { ...v, boletos };
      })
    );

    res.json(ventasConBoletos);
  } catch (e) {
    next(e);
  }
});

// 4. Listar todas las ventas (Administrador)
router.get('/', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    await liberarReservasVencidas();
    const { id_funcion: id_presentacion, estado, fecha_inicio, fecha_fin } = req.query;

    let query = `
      SELECT v.id_venta, v.fecha_venta, v.fecha_limite_pago, v.total, v.estado,
             u.id_usuario, u.nombres AS comprador_nombres, u.apellidos AS comprador_apellidos, u.correo AS comprador_correo,
             f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio,
             o.titulo AS obra_titulo,
             s.nombre AS sala_nombre,
             COUNT(b.id_boleto) AS cantidad_boletos
        FROM venta v
        JOIN usuario u ON u.id_usuario = v.id_usuario
        JOIN presentacion f ON f.id_presentacion = v.id_presentacion
        JOIN obra o ON o.id_obra = f.id_obra
        JOIN sala s ON s.id_sala = f.id_sala
        LEFT JOIN boleto b ON b.id_venta = v.id_venta AND b.estado <> 'ANULADO'
       WHERE 1=1`;

    const params = [];
    if (id_presentacion) {
      params.push(id_presentacion);
      query += ` AND v.id_presentacion = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      query += ` AND v.estado = $${params.length}`;
    }
    if (fecha_inicio) {
      params.push(fecha_inicio);
      query += ` AND v.fecha_venta::date >= $${params.length}`;
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      query += ` AND v.fecha_venta::date <= $${params.length}`;
    }

    query += ` GROUP BY v.id_venta, u.id_usuario, f.id_presentacion, o.titulo, s.nombre
               ORDER BY v.fecha_venta DESC`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// 5. Detalle de una venta
router.get('/:id', verificarToken, async (req, res, next) => {
  try {
    await liberarReservasVencidas();
    const { rows: vRows } = await db.query(
      `SELECT v.id_venta, v.id_usuario, v.fecha_venta, v.fecha_limite_pago, v.total, v.estado,
              u.nombres AS comprador_nombres, u.apellidos AS comprador_apellidos, u.correo AS comprador_correo,
              f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio, f.precio,
              o.titulo AS obra_titulo, o.afiche_url,
              s.nombre AS sala_nombre
         FROM venta v
         JOIN usuario u ON u.id_usuario = v.id_usuario
         JOIN presentacion f ON f.id_presentacion = v.id_presentacion
         JOIN obra o ON o.id_obra = f.id_obra
         JOIN sala s ON s.id_sala = f.id_sala
        WHERE v.id_venta = $1`,
      [req.params.id]
    );

    if (!vRows[0]) return res.status(404).json({ error: 'Venta no encontrada' });
    const venta = vRows[0];

    if (req.usuario.rol !== 'ADMINISTRADOR' && venta.id_usuario !== req.usuario.id) {
      return res.status(403).json({ error: 'No tiene permiso para ver esta venta' });
    }

    const { rows: boletos } = await db.query(
      `SELECT b.id_boleto, b.codigo_qr, b.tipo, b.precio, b.estado,
              a.fila, a.numero, a.zona
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
        WHERE b.id_venta = $1
        ORDER BY a.fila, a.numero`,
      [venta.id_venta]
    );

    const { rows: pagos } = await db.query(
      `SELECT id_pago, referencia_qr, monto, estado, fecha_generacion, fecha_pago
         FROM pago WHERE id_venta = $1 ORDER BY fecha_generacion DESC`,
      [venta.id_venta]
    );

    res.json({
      ...venta,
      boletos,
      pago: pagos[0] || null,
      historial_pagos: pagos,
    });
  } catch (e) {
    next(e);
  }
});

// 6. Anular o cancelar venta
router.post('/:id/anular', verificarToken, async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: vRows } = await client.query('SELECT * FROM venta WHERE id_venta = $1', [req.params.id]);
    if (!vRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    const venta = vRows[0];

    if (req.usuario.rol !== 'ADMINISTRADOR' && venta.id_usuario !== req.usuario.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tiene permiso para anular esta venta' });
    }

    if (venta.estado === 'ANULADA' || venta.estado === 'VENCIDA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `La venta ya se encuentra ${venta.estado}` });
    }

    await client.query(`UPDATE boleto SET estado = 'ANULADO' WHERE id_venta = $1`, [venta.id_venta]);
    await client.query(`UPDATE venta SET estado = 'ANULADA' WHERE id_venta = $1`, [venta.id_venta]);

    await client.query('COMMIT');
    res.json({ mensaje: 'Venta anulada y asientos liberados con éxito' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
module.exports.liberarReservasVencidas = liberarReservasVencidas;