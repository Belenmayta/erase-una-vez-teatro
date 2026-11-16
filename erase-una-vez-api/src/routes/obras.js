const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

// Consultar todas las obras (en cartelera, próximamente y archivo histórico de obras antiguas)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT o.id_obra, o.titulo, o.descripcion, o.duracion_min, o.publico_objetivo, o.afiche_url, o.estado,
              COUNT(p.id_presentacion) FILTER (WHERE p.estado = 'PROGRAMADA') AS funciones_programadas
         FROM obra o
         LEFT JOIN presentacion p ON p.id_obra = o.id_obra
        GROUP BY o.id_obra
        ORDER BY
          CASE
            WHEN o.estado IN ('ACTIVA', 'En cartelera') THEN 1
            WHEN o.estado = 'Próximamente' THEN 2
            ELSE 3
          END,
          o.titulo`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id_obra, titulo, descripcion, duracion_min, publico_objetivo, afiche_url, estado
         FROM obra WHERE id_obra = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Obra no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Registrar obra (administrador)
router.post('/', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { titulo, descripcion, duracion_min, publico_objetivo, afiche_url, estado } = req.body;
    if (!titulo) return res.status(400).json({ error: 'El título es obligatorio' });
    const { rows } = await db.query(
      `INSERT INTO obra (titulo, descripcion, duracion_min, publico_objetivo, afiche_url, estado)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        titulo,
        descripcion || null,
        duracion_min || null,
        publico_objetivo || null,
        afiche_url || null,
        estado || 'En cartelera',
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23514') return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
    next(e);
  }
});

// Modificar obra (administrador)
router.put('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { titulo, descripcion, duracion_min, publico_objetivo, afiche_url, estado } = req.body;
    if (!titulo) return res.status(400).json({ error: 'El título es obligatorio' });
    const { rows } = await db.query(
      `UPDATE obra SET titulo = $1, descripcion = $2, duracion_min = $3,
                       publico_objetivo = $4, afiche_url = $5,
                       estado = COALESCE($6, estado)
        WHERE id_obra = $7 RETURNING *`,
      [
        titulo,
        descripcion || null,
        duracion_min || null,
        publico_objetivo || null,
        afiche_url || null,
        estado || null,
        req.params.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Obra no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23514') return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
    next(e);
  }
});

// Cambiar estado de obra o dar de baja
router.delete('/:id', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE obra SET estado = 'Finalizada' WHERE id_obra = $1 RETURNING id_obra, titulo, estado`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Obra no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
