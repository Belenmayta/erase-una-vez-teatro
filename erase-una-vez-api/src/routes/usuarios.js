const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');

const router = express.Router();
const ROLES = ['ADMINISTRADOR', 'RECEPCION', 'COMPRADOR', 'DOCENTE'];

// Todo este módulo es solo para el administrador
router.use(verificarToken, requerirRol('ADMINISTRADOR'));

// Herencia de usuario: deja al usuario solo en la tabla hija que corresponde a su rol
async function asegurarSubtipo(client, id, rol, datos = {}) {
  await client.query('DELETE FROM administrador WHERE id_usuario = $1', [id]);
  await client.query('DELETE FROM personal_recepcion WHERE id_usuario = $1', [id]);
  await client.query('DELETE FROM docente WHERE id_usuario = $1', [id]);
  if (rol === 'ADMINISTRADOR') {
    await client.query('INSERT INTO administrador (id_usuario, cargo) VALUES ($1, $2)', [id, datos.cargo || null]);
  } else if (rol === 'RECEPCION') {
    await client.query('INSERT INTO personal_recepcion (id_usuario, turno) VALUES ($1, $2)', [id, datos.turno || null]);
  } else if (rol === 'DOCENTE') {
    await client.query('INSERT INTO docente (id_usuario, especialidad) VALUES ($1, $2)', [id, datos.especialidad || null]);
  }
}

// Listar usuarios
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.ci, u.correo, u.telefono, u.estado,
              u.fecha_registro, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        ORDER BY u.id_usuario`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Crear una cuenta (administrador, recepción, docente o comprador)
router.post('/', async (req, res, next) => {
  const { nombres, apellidos, ci, correo, telefono, contrasena, rol } = req.body;
  if (!nombres || !apellidos || !correo || !contrasena || contrasena.length < 8 || !ROLES.includes(rol)) {
    return res.status(400).json({
      error: `Complete nombres, apellidos, correo, contraseña (mínimo 8) y un rol válido: ${ROLES.join(', ')}`,
    });
  }
  const client = await db.pool.connect();
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, ci, correo, telefono, contrasena_hash)
       VALUES ((SELECT id_rol FROM rol WHERE nombre = $1), $2, $3, $4, lower($5), $6, $7)
       RETURNING id_usuario, nombres, apellidos, correo`,
      [rol, nombres, apellidos, ci || null, correo, telefono || null, hash]
    );
    await asegurarSubtipo(client, rows[0].id_usuario, rol, req.body);
    await client.query('COMMIT');
    res.status(201).json({ ...rows[0], rol });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    if (e.code === '23502') return res.status(500).json({ error: `Falta el rol ${rol} en la tabla rol` });
    next(e);
  } finally {
    client.release();
  }
});

// Cambiar el rol o activar/desactivar una cuenta
router.patch('/:id', async (req, res, next) => {
  const { estado, rol } = req.body;
  if (rol !== undefined && !ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol no válido. Use: ${ROLES.join(', ')}` });
  }
  if (String(req.usuario.id) === req.params.id && (estado === false || (rol && rol !== 'ADMINISTRADOR'))) {
    return res.status(400).json({ error: 'No puede desactivar ni quitarse el rol a su propia cuenta' });
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE usuario
          SET estado = COALESCE($1, estado),
              id_rol = COALESCE((SELECT id_rol FROM rol WHERE nombre = $2), id_rol)
        WHERE id_usuario = $3
        RETURNING id_usuario, nombres, apellidos, correo, estado`,
      [typeof estado === 'boolean' ? estado : null, rol || null, req.params.id]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (rol) await asegurarSubtipo(client, rows[0].id_usuario, rol, req.body);
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23503') {
      return res.status(409).json({ error: 'No se puede cambiar el rol: el docente tiene cursos asignados' });
    }
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
