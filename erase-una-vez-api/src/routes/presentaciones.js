const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

const SELECT_PRESENTACION = `
  SELECT f.id_presentacion, f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio, f.precio, f.cupo_gratuito, f.estado,
         o.id_obra, o.titulo, o.descripcion, o.duracion_min, o.publico_objetivo, o.afiche_url,
         s.id_sala, s.nombre AS sala, s.direccion AS sala_direccion, s.capacidad
    FROM presentacion f
    JOIN obra o ON o.id_obra = f.id_obra
    JOIN sala s ON s.id_sala = f.id_sala`;

// Determina si una sala se divide en múltiples sectores o si es Sector General único
function tieneSectoresMultiples(nombreSala = '', capacidad = 0) {
  const n = nombreSala.toLowerCase();
  if (
    n.includes('norma merlo') ||
    n.includes('mala fama') ||
    n.includes('kuljis') ||
    n.includes('ensayo') ||
    n.includes('modesta') ||
    n.includes('albina')
  ) {
    return false;
  }
  if (
    n.includes('6 de agosto') ||
    n.includes('16 de julio') ||
    n.includes('saavedra') ||
    n.includes('teatro municipal') ||
    n.includes('kúu inti') ||
    n.includes('kuu inti') ||
    n.includes('nuna') ||
    n.includes('chuquiago') ||
    Number(capacidad) >= 300
  ) {
    return true;
  }
  return false;
}

// Devuelve los nombres reales de cada sector según el teatro
function obtenerNombresSectoresSala(nombreSala = '') {
  const n = nombreSala.toLowerCase();
  if (n.includes('saavedra') || n.includes('teatro municipal')) {
    return {
      VIP: 'Platea VIP',
      PLATEA: 'Platea y Palcos',
      MEZZANINE: 'Anfiteatro y Galería',
    };
  }
  if (n.includes('kúu inti') || n.includes('kuu inti')) {
    return {
      VIP: 'Lounge (Planta Baja)',
      PLATEA: 'Mezzanine',
      MEZZANINE: 'Galería',
    };
  }
  return {
    VIP: 'Platea VIP',
    PLATEA: 'Platea',
    MEZZANINE: 'Mezzanine',
  };
}

// Calcula el sector y el precio de una butaca según su tipo_asiento en BD (o fila) y el tipo de sala
function calcularSectorYPrecio(fila, precioBase, esMultiple, tipoAsiento = null, nombreSala = '') {
  const base = Number(precioBase) || 0;
  if (!esMultiple) {
    return {
      sector: 'GENERAL',
      zona_nombre: 'General Único',
      precio: base,
    };
  }

  const nombres = obtenerNombresSectoresSala(nombreSala);
  const tipo = String(tipoAsiento || '').toUpperCase();

  if (tipo === 'VIP') {
    return {
      sector: 'VIP',
      zona_nombre: nombres.VIP,
      precio: base + 20,
    };
  }
  if (tipo === 'PREFERENCIAL') {
    return {
      sector: 'PLATEA',
      zona_nombre: nombres.PLATEA,
      precio: base + 10,
    };
  }
  if (tipo === 'GENERAL') {
    return {
      sector: 'MEZZANINE',
      zona_nombre: nombres.MEZZANINE,
      precio: base,
    };
  }

  // Fallback por fila si no tuviera tipo_asiento
  const f = String(fila).toUpperCase();
  if (f === 'A' || f === 'B' || f === 'C') {
    return {
      sector: 'VIP',
      zona_nombre: nombres.VIP,
      precio: base + 20,
    };
  }
  if (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].includes(f)) {
    return {
      sector: 'PLATEA',
      zona_nombre: nombres.PLATEA,
      precio: base + 10,
    };
  }
  return {
    sector: 'MEZZANINE',
    zona_nombre: nombres.MEZZANINE,
    precio: base,
  };
}

// Helper para asegurar que una sala tenga butacas generadas en la tabla asiento
async function asegurarAsientosSala(idSala) {
  const { rows: existentes } = await db.query(
    `SELECT COUNT(*) AS total FROM asiento WHERE id_sala = $1`,
    [idSala]
  );
  if (parseInt(existentes[0].total, 10) > 0) return;

  const { rows: salaRows } = await db.query(
    `SELECT nombre, capacidad FROM sala WHERE id_sala = $1`,
    [idSala]
  );
  const sala = salaRows[0] || { nombre: '', capacidad: 100 };
  const multiple = tieneSectoresMultiples(sala.nombre, sala.capacidad);

  const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const valores = [];
  const params = [];
  let idx = 1;

  for (const fila of filas) {
    const esVip = fila === 'A' || fila === 'B';
    const esPlatea = ['C', 'D', 'E', 'F'].includes(fila);
    const zona = !multiple
      ? 'General'
      : esVip
      ? 'VIP'
      : esPlatea
      ? 'Platea'
      : 'Mezzanine';
    const tipoAsiento = !multiple
      ? 'GENERAL'
      : esVip
      ? 'VIP'
      : esPlatea
      ? 'PREFERENCIAL'
      : 'GENERAL';

    for (let num = 1; num <= 10; num++) {
      valores.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(idSala, fila, num, zona, tipoAsiento);
    }
  }

  await db.query(
    `INSERT INTO asiento (id_sala, fila, numero, zona, tipo_asiento)
     VALUES ${valores.join(', ')}
     ON CONFLICT (id_sala, fila, numero) DO NOTHING`,
    params
  );
}

// Consultar cartelera (público o todas para admin)
router.get('/', async (req, res, next) => {
  try {
    const verTodas = req.query.todas === 'true';
    let sql = SELECT_PRESENTACION;
    if (!verTodas) {
      sql += ` WHERE f.estado = 'PROGRAMADA' AND COALESCE(o.estado, 'ACTIVA') <> 'INACTIVA'`;
    }
    sql += ` ORDER BY f.fecha ASC, f.hora_inicio ASC`;
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`${SELECT_PRESENTACION} WHERE f.id_presentacion = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Presentación no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

function validar(body) {
  const { id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito } = body;
  if (!id_obra || !id_sala || !fecha || !hora_inicio || precio === undefined || precio === '') {
    return 'Complete obra, sala, fecha, hora y precio';
  }
  if (Number(precio) < 0) return 'El precio no puede ser negativo';
  if (cupo_gratuito !== undefined && Number(cupo_gratuito) < 0) return 'El cupo gratuito no puede ser negativo';
  return null;
}

function errorDePresentacion(e, res, next) {
  if (e.code === '23505') {
    return res.status(409).json({ error: 'La sala ya tiene una presentación en esa fecha y hora' });
  }
  if (e.code === '23503') return res.status(400).json({ error: 'La obra o la sala indicada no existe' });
  if (e.code === '23514' || e.code === '22007' || e.code === '22P02') {
    return res.status(400).json({ error: 'Revise los datos: fecha, hora, precio o estado no válidos' });
  }
  next(e);
}

// Programar presentación (administrador)
router.post('/', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito } = req.body;
    await asegurarAsientosSala(id_sala);
    const { rows } = await db.query(
      `INSERT INTO presentacion (id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_presentacion AS id_funcion, *`,
      [id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    errorDePresentacion(e, res, next);
  }
});

// Modificar presentación (administrador)
router.put('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito } = req.body;
    await asegurarAsientosSala(id_sala);
    const { rows } = await db.query(
      `UPDATE presentacion SET id_obra = $1, id_sala = $2, fecha = $3, hora_inicio = $4,
                          precio = $5, cupo_gratuito = $6
        WHERE id_presentacion = $7 RETURNING id_presentacion AS id_funcion, *`,
      [id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito || 0, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Presentación no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    errorDePresentacion(e, res, next);
  }
});

// Cancelar presentación (administrador): no se borra, queda CANCELADA
router.delete('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE presentacion SET estado = 'CANCELADA' WHERE id_presentacion = $1 RETURNING id_presentacion, id_presentacion AS id_funcion, estado`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Presentación no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Obtener la sala, los sectores de precios y los asientos asociados a una presentación específica
router.get('/:id/asientos', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de presentación no válido o no proporcionado' });
    }

    // Liberar reservas vencidas antes de consultar el mapa
    await db.query(
      `UPDATE boleto SET estado = 'ANULADO'
        WHERE estado = 'RESERVADO'
          AND id_venta IN (
            SELECT id_venta FROM venta
             WHERE estado = 'PENDIENTE' AND fecha_limite_pago < NOW() AND id_presentacion = $1
          )`,
      [id]
    );
    await db.query(
      `UPDATE venta SET estado = 'VENCIDA'
        WHERE estado = 'PENDIENTE' AND fecha_limite_pago < NOW() AND id_presentacion = $1`,
      [id]
    );

    // 1. Obtener la presentación y su sala
    const presentacionRes = await db.query(
      `SELECT f.id_presentacion, f.id_presentacion AS id_funcion, f.id_sala,
              s.nombre AS sala_nombre, s.direccion AS sala_direccion, s.capacidad, f.precio
         FROM presentacion f
         JOIN sala s ON s.id_sala = f.id_sala
        WHERE f.id_presentacion = $1`,
      [id]
    );

    if (!presentacionRes.rows[0]) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const presentacion = presentacionRes.rows[0];
    const esMultiple = tieneSectoresMultiples(presentacion.sala_nombre, presentacion.capacidad);
    const precioBase = Number(presentacion.precio) || 0;

    // Asegurar que la sala tenga asientos creados en la base de datos
    await asegurarAsientosSala(presentacion.id_sala);

    // 2. Obtener todos los asientos de la sala (ordenados por longitud de fila y luego alfabéticamente para soportar AA..AF)
    const asientosRes = await db.query(
      `SELECT id_asiento, fila, numero, zona, tipo_asiento AS tipo
         FROM asiento
        WHERE id_sala = $1
        ORDER BY LENGTH(fila), fila, numero`,
      [presentacion.id_sala]
    );

    // 3. Obtener asientos ocupados/reservados por boletos activos de ESTA presentación
    const boletosRes = await db.query(
      `SELECT b.id_asiento, b.estado AS estado_boleto, b.tipo AS tipo_boleto
         FROM boleto b
        WHERE b.id_presentacion = $1
          AND b.estado NOT IN ('ANULADO')`,
      [id]
    );

    // 4. Construir mapa: id_asiento -> estado_actual
    const estadoMap = {};
    boletosRes.rows.forEach((b) => {
      if (b.estado_boleto === 'RESERVADO') {
        estadoMap[b.id_asiento] = 'RESERVADO';
      } else if (b.tipo_boleto === 'GRATUITO') {
        estadoMap[b.id_asiento] = 'GRATUITO';
      } else {
        estadoMap[b.id_asiento] = 'OCUPADO';
      }
    });

    // 5. Combinar cada asiento con su estado_actual, su sector y su precio_asiento
    const asientosConEstado = asientosRes.rows.map((a) => {
      const infoSector = calcularSectorYPrecio(
        a.fila,
        precioBase,
        esMultiple,
        a.tipo,
        presentacion.sala_nombre
      );
      return {
        ...a,
        sector: infoSector.sector,
        zona: infoSector.zona_nombre,
        precio_asiento: infoSector.precio,
        estado_actual: estadoMap[a.id_asiento] || 'DISPONIBLE',
      };
    });

    // 6. Resumen dinámico de sectores según las filas reales de esta sala
    const nombresSectores = obtenerNombresSectoresSala(presentacion.sala_nombre);
    const describirFilas = (cod) => {
      const delSector = asientosConEstado.filter((a) => a.sector === cod);
      const filasUnicas = [...new Set(delSector.map((a) => a.fila))];
      if (filasUnicas.length === 0) return '';
      const primera = filasUnicas[0];
      const ultima = filasUnicas[filasUnicas.length - 1];
      return `Filas ${primera} - ${ultima} (${delSector.length} butacas)`;
    };

    const sectores = esMultiple
      ? [
          {
            codigo: 'VIP',
            nombre: nombresSectores.VIP,
            filas: describirFilas('VIP'),
            precio: precioBase + 20,
          },
          {
            codigo: 'PLATEA',
            nombre: nombresSectores.PLATEA,
            filas: describirFilas('PLATEA'),
            precio: precioBase + 10,
          },
          {
            codigo: 'MEZZANINE',
            nombre: nombresSectores.MEZZANINE,
            filas: describirFilas('MEZZANINE'),
            precio: precioBase,
          },
        ]
      : [
          {
            codigo: 'GENERAL',
            nombre: 'Sector General Único',
            filas: describirFilas('GENERAL'),
            precio: precioBase,
          },
        ];

    res.json({
      presentacion: {
        ...presentacion,
        nombre_sala: presentacion.sala_nombre,
        tiene_sectores: esMultiple,
      },
      sectores,
      asientos: asientosConEstado,
    });
  } catch (e) {
    next(e);
  }
});

// Obtener aforo en tiempo real y últimas entradas validadas de una presentación (Escáner Puerta)
router.get('/:id/asistencia', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de presentación no válido' });
    }

    const { rows: presRows } = await db.query(
      `SELECT f.id_presentacion, s.capacidad
         FROM presentacion f
         JOIN sala s ON s.id_sala = f.id_sala
        WHERE f.id_presentacion = $1`,
      [id]
    );
    if (!presRows[0]) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }
    const capacidadSala = parseInt(presRows[0].capacidad, 10) || 100;

    // Obtener todos los boletos emitidos o usados de esta presentación (ordenados por fecha_hora de ingreso descendente)
    const { rows: boletos } = await db.query(
      `SELECT b.id_boleto, b.codigo_qr, b.tipo, b.precio, b.estado,
              a.fila, a.numero, a.zona,
              u.nombres, u.apellidos, u.ci,
              i.fecha_hora AS fecha_hora_ingreso
         FROM boleto b
         JOIN asiento a ON a.id_asiento = b.id_asiento
         JOIN venta v ON v.id_venta = b.id_venta
         JOIN usuario u ON u.id_usuario = v.id_usuario
         LEFT JOIN ingreso i ON i.id_boleto = b.id_boleto
        WHERE b.id_presentacion = $1
          AND b.estado IN ('EMITIDO', 'USADO')
        ORDER BY i.fecha_hora DESC NULLS LAST, b.id_boleto DESC`,
      [id]
    );

    const totalEmitidos = boletos.length;
    const asistentesIngresados = boletos.filter((b) => b.estado === 'USADO').length;
    const pendientesIngreso = Math.max(0, totalEmitidos - asistentesIngresados);
    const boletosVendidos = boletos.filter((b) => b.tipo === 'PAGADO').length;
    const entradasGratuitas = boletos.filter((b) => b.tipo === 'GRATUITO').length;
    const porcentajeAsistencia =
      totalEmitidos > 0 ? Math.round((asistentesIngresados / totalEmitidos) * 100) : 0;

    res.json({
      aforo: {
        capacidad_sala: capacidadSala,
        total_emitidos: totalEmitidos,
        asistentes_ingresados: asistentesIngresados,
        pendientes_ingreso: pendientesIngreso,
        boletos_vendidos: boletosVendidos,
        entradas_gratuitas: entradasGratuitas,
        porcentaje_asistencia: porcentajeAsistencia,
      },
      boletos,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
module.exports.tieneSectoresMultiples = tieneSectoresMultiples;
module.exports.calcularSectorYPrecio = calcularSectorYPrecio;
