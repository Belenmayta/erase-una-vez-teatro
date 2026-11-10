require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

async function run() {
  try {
    // 1. Configurar contraseña para tu cuenta (Araceli)
    const hashAraceli = await bcrypt.hash('teatro123', 10);
    await db.query('UPDATE usuario SET contrasena_hash = $1 WHERE correo = $2', [
      hashAraceli,
      'araceli@teatro.com',
    ]);
    console.log('Password para araceli@teatro.com configurado a: teatro123');

    // 2. Configurar contraseña para Jaqueline (Admin)
    const hashJaqueline = await bcrypt.hash('teatro123', 10);
    await db.query('UPDATE usuario SET contrasena_hash = $1 WHERE correo = $2', [
      hashJaqueline,
      'jaqueline@teatro.com',
    ]);
    console.log('Password para jaqueline@teatro.com configurado a: teatro123');

    // 3. Configurar usuario de Recepción
    const hashRec = await bcrypt.hash('recepcion123', 10);
    await db.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash, estado)
       VALUES (2, 'Personal', 'Recepcion', 'recepcion@teatro.com', $1, true)
       ON CONFLICT (correo) DO UPDATE SET contrasena_hash = $1, estado = true`,
      [hashRec]
    );
    console.log('Usuario recepcion@teatro.com configurado con password: recepcion123');

    // 4. Configurar usuario Comprador de prueba
    const hashComp = await bcrypt.hash('comprador123', 10);
    await db.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash, estado)
       VALUES (3, 'Maria', 'Perez', 'maria@comprador.com', $1, true)
       ON CONFLICT (correo) DO UPDATE SET contrasena_hash = $1, estado = true`,
      [hashComp]
    );
    console.log('Usuario maria@comprador.com configurado con password: comprador123');

  } catch (err) {
    console.error('Error configurando usuarios:', err);
  } finally {
    await db.pool.end();
  }
}

run();