const db = require('./db');

async function probarConexion() {
  try {
    // Hacemos una consulta simple para verificar la fecha y hora actual del servidor de la base de datos
    const resultado = await db.query('SELECT NOW() AS hora_actual');
    console.log('¡Conexión exitosa a Supabase!');
    console.log('Hora del servidor:', resultado.rows[0].hora_actual);
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  } finally {
    // Cerramos el pool de conexiones para que el script termine limpiamente
    await db.pool.end();
  }
}

probarConexion();