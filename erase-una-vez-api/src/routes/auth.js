const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();
const correoValido = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function firmarToken(u) {
  return jwt.sign({ id: u.id_usuario, rol: u.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h',
  });
}

// Registrar comprador
router.post('/register', async (req, res, next) => {
  try {
    const { nombres, apellidos, ci, correo, telefono, contrasena } = req.body;
    if (!nombres || !apellidos || !correoValido(correo) || !contrasena || contrasena.length < 8) {
      return res.status(400).json({
        error: 'Complete nombres, apellidos, un correo válido y una contraseña de al menos 8 caracteres',
      });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    const { rows } = await db.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, ci, correo, telefono, contrasena_hash)
       VALUES ((SELECT id_rol FROM rol WHERE nombre = 'COMPRADOR'), $1, $2, $3, lower($4), $5, $6)
       RETURNING id_usuario, nombres, apellidos, correo`,
      [nombres, apellidos, ci || null, correo, telefono || null, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    if (e.code === '23502') {
      return res.status(500).json({ error: 'Faltan los roles iniciales en la base de datos (tabla rol)' });
    }
    next(e);
  }
});

// Autenticar usuario (iniciar sesión)
router.post('/login', async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correoValido(correo) || !contrasena) {
      return res.status(400).json({ error: 'Ingrese su correo y su contraseña' });
    }
    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.contrasena_hash, u.estado, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.correo = lower($1)`,
      [correo]
    );
    const u = rows[0];
    const ok = u && u.estado && (await bcrypt.compare(contrasena, u.contrasena_hash));
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    res.json({
      token: firmarToken(u),
      usuario: { id: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, rol: u.rol },
    });
  } catch (e) {
    next(e);
  }
});

// Datos del usuario con sesión iniciada
router.get('/me', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id_usuario AS id, u.nombres, u.apellidos, u.correo, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1 AND u.estado = TRUE`,
      [req.usuario.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no disponible' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
