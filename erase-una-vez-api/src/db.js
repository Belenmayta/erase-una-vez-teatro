require('dotenv').config();

// Ignorar la advertencia de certificado autofirmado en desarrollo local con Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

module.exports = {
  query: (texto, parametros) => pool.query(texto, parametros),
  pool,
};