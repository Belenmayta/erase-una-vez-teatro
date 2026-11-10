// Crea un administrador (usuario + registro en la tabla hija administrador):
// Ejemplo: npm run crear-admin -- correo@ejemplo.com teatro123 "Nombres" "Apellidos"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

(async () => {
  const [correo, contrasena, nombres = 'Administrador', apellidos = 'Teatro'] = process.argv.slice(2);
  
  // Mantiene la validación de mínimo 8 caracteres (ideal para contraseñas como teatro123)
  if (!correo || !contrasena || contrasena.length < 8) {
    console.log('Uso: npm run crear-admin -- correo contraseña(mínimo 8 caracteres) "Nombres" "Apellidos"');
    process.exit(1);
  }
  
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await db.query(
      `WITH nuevo AS (
         INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash)
         VALUES ((SELECT id_rol FROM rol WHERE nombre = 'ADMINISTRADOR'), $1, $2, lower($3), $4)
         RETURNING id_usuario
       )
       INSERT INTO administrador (id_usuario, cargo)
       SELECT id_usuario, 'Administrador general' FROM nuevo`,
      [nombres, apellidos, correo, hash]
    );
    console.log('Administrador creado exitosamente:', correo);
  } catch (e) {
    const motivo = e.code === '23505' ? 'ese correo ya existe en la base de datos' : e.code === '23502' ? 'faltan los roles iniciales (tabla rol)' : e.message;
    console.error('No se pudo crear:', motivo);
  } finally {
    await db.pool.end();
  }
})();