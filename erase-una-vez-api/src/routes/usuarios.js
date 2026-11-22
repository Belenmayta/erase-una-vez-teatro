const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verificarToken, requerirRol } = require('../middleware/auth');
const {
  validarNombreApellido,
  validarCIBolivia,
  validarTelefonoBolivia,
  validarContrasenaFuerte,
  verificarExistenciaCorreo,
} = require('../utils/validaciones');

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
    await client.query('INSERT INTO administrador (id_usuario, cargo) VALUES ($1, $2)', [
      id,
      datos.cargo || null,
    ]);
  } else if (rol === 'RECEPCION') {
    await client.query('INSERT INTO personal_recepcion (id_usuario, turno) VALUES ($1, $2)', [
      id,
      datos.turno || null,
    ]);
  } else if (rol === 'DOCENTE') {
    await client.query('INSERT INTO docente (id_usuario, especialidad) VALUES ($1, $2)', [
      id,
      datos.especialidad || null,
    ]);
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

// Crear una cuenta (administrador, recepción, docente o comprador) con validación estricta y verificación MX
router.post('/', async (req, res, next) => {
  const { nombres, apellidos, ci, correo, telefono, contrasena, rol } = req.body;

  const errNom = validarNombreApellido(nombres, 'Nombres');
  if (errNom) return res.status(400).json({ error: errNom });

  const errApe = validarNombreApellido(apellidos, 'Apellidos');
  if (errApe) return res.status(400).json({ error: errApe });

  const errCi = validarCIBolivia(ci, false);
  if (errCi) return res.status(400).json({ error: errCi });

  const errTel = validarTelefonoBolivia(telefono, false);
  if (errTel) return res.status(400).json({ error: errTel });

  const errPass = validarContrasenaFuerte(contrasena);
  if (errPass) return res.status(400).json({ error: errPass });

  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol no válido. Use: ${ROLES.join(', ')}` });
  }

  const verifCorreo = await verificarExistenciaCorreo(correo);
  if (!verifCorreo.valido) {
    return res.status(400).json({ error: verifCorreo.error });
  }

  const client = await db.pool.connect();
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, ci, correo, telefono, contrasena_hash)
       VALUES ((SELECT id_rol FROM rol WHERE nombre = $1), $2, $3, $4, lower($5), $6, $7)
       RETURNING id_usuario, nombres, apellidos, correo`,
      [rol, nombres.trim(), apellidos.trim(), ci || null, correo.trim(), telefono || null, hash]
    );
    await asegurarSubtipo(client, rows[0].id_usuario, rol, req.body);
    await client.query('COMMIT');
    res.status(201).json({ ...rows[0], rol, servidor_mx: verifCorreo.servidor_mx });
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
  if (
    String(req.usuario.id) === req.params.id &&
    (estado === false || (rol && rol !== 'ADMINISTRADOR'))
  ) {
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

// Eliminar permanentemente un usuario que ya no se utilice (Administrador)
router.delete('/:id', async (req, res, next) => {
  const idEliminar = Number(req.params.id);
  if (!idEliminar) {
    return res.status(400).json({ error: 'ID de usuario no válido' });
  }
  if (Number(req.usuario.id) === idEliminar) {
    return res.status(400).json({ error: 'Por seguridad no puede eliminar su propia cuenta activa.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Desvincular referencias opcionales para no sobrecargar la base de datos
    await client.query('UPDATE curso SET id_docente = NULL WHERE id_docente = $1', [idEliminar]);
    await client.query(
      'UPDATE pago_mensualidad SET id_usuario_registro = NULL WHERE id_usuario_registro = $1',
      [idEliminar]
    );
    await client.query('DELETE FROM ingreso WHERE id_usuario = $1', [idEliminar]);

    // Eliminar boletos, pagos y ventas asociadas al usuario a eliminar
    await client.query(
      `DELETE FROM ingreso WHERE id_boleto IN (
         SELECT id_boleto FROM boleto WHERE id_venta IN (SELECT id_venta FROM venta WHERE id_usuario = $1)
       )`,
      [idEliminar]
    );
    await client.query(
      'DELETE FROM pago WHERE id_venta IN (SELECT id_venta FROM venta WHERE id_usuario = $1)',
      [idEliminar]
    );
    await client.query(
      'DELETE FROM boleto WHERE id_venta IN (SELECT id_venta FROM venta WHERE id_usuario = $1)',
      [idEliminar]
    );
    await client.query('DELETE FROM venta WHERE id_usuario = $1', [idEliminar]);

    // Eliminar subtipos
    await client.query('DELETE FROM administrador WHERE id_usuario = $1', [idEliminar]);
    await client.query('DELETE FROM personal_recepcion WHERE id_usuario = $1', [idEliminar]);
    await client.query('DELETE FROM docente WHERE id_usuario = $1', [idEliminar]);

    const { rows } = await client.query(
      'DELETE FROM usuario WHERE id_usuario = $1 RETURNING id_usuario, nombres, apellidos, correo',
      [idEliminar]
    );

    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await client.query('COMMIT');
    res.json({
      ok: true,
      mensaje: `Usuario ${rows[0].nombres} ${rows[0].apellidos} (${rows[0].correo}) eliminado permanentemente de la base de datos.`,
      usuario_eliminado: rows[0],
    });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
