const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

const SELECT_FUNCION = `
  SELECT f.id_presentacion AS id_funcion, f.fecha, f.hora_inicio, f.precio, f.cupo_gratuito, f.estado,
         o.id_obra, o.titulo, o.descripcion, o.duracion_min, o.publico_objetivo, o.afiche_url,
         s.id_sala, s.nombre AS sala
    FROM presentacion f
    JOIN obra o ON o.id_obra = f.id_obra
    JOIN sala s ON s.id_sala = f.id_sala`;

// Consultar cartelera sin restricciones estrictas de estado
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `${SELECT_FUNCION}
        ORDER BY f.fecha DESC, f.hora_inicio`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`${SELECT_FUNCION} WHERE f.id_presentacion = $1`, [req.params.id]);
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

function errorDeFuncion(e, res, next) {
  if (e.code === '23505') {
    return res.status(409).json({ error: 'La sala ya tiene una presentación programada en esa fecha y hora' });
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
    const { rows } = await db.query(
      `INSERT INTO presentacion (id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_presentacion AS id_funcion, *`,
      [id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    errorDeFuncion(e, res, next);
  }
});

// Modificar presentación (administrador)
router.put('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito } = req.body;
    const { rows } = await db.query(
      `UPDATE presentacion SET id_obra = $1, id_sala = $2, fecha = $3, hora_inicio = $4,
                             precio = $5, cupo_gratuito = $6
        WHERE id_presentacion = $7 RETURNING id_presentacion AS id_funcion, *`,
      [id_obra, id_sala, fecha, hora_inicio, precio, cupo_gratuito || 0, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Presentación no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    errorDeFuncion(e, res, next);
  }
});

// Cancelar presentación (administrador): no se borra, queda CANCELADA
router.delete('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE presentacion SET estado = 'CANCELADA' WHERE id_presentacion = $1 RETURNING id_presentacion AS id_funcion, estado`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Presentación no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});
// Obtener la sala y los asientos asociados a una presentación/función específica
router.get('/:id/asientos', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener la presentación y su sala correspondiente
    const presentacionRes = await db.query(
      `SELECT f.id_presentacion, f.id_sala, s.nombre AS sala_nombre, s.direccion AS sala_direccion, s.capacidad
         FROM presentacion f
         JOIN sala s ON s.id_sala = f.id_sala
        WHERE f.id_presentacion = $1`,
      [id]
    );

    if (!presentacionRes.rows[0]) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const presentacion = presentacionRes.rows[0];

    // 2. Obtener los asientos de esa sala usando la tabla 'asiento'
    const asientosRes = await db.query(
      `SELECT id_asiento, fila, numero, tipo, estado 
         FROM asiento 
        WHERE id_sala = $1 
        ORDER BY fila, numero`,
      [presentacion.id_sala]
    );

    res.json({
      presentacion,
      asientos: asientosRes.rows
    });
  } catch (e) {
    next(e);
  }
});
module.exports = router;