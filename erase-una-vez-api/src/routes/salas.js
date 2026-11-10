const express = require('express');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, requerirRol('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id_sala, nombre, direccion, capacidad FROM sala ORDER BY id_sala');
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
