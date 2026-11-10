require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/salud', async (req, res) => {
  try {
    const r = await db.query('SELECT NOW() AS ahora');
    res.json({ ok: true, baseDeDatos: 'conectada', ahora: r.rows[0].ahora });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rutas principales del sistema
app.use('/api/auth', require('./routes/auth'));
app.use('/api/obras', require('./routes/obras'));
app.use('/api/presentaciones', require('./routes/presentaciones'));
app.use('/api/funciones', require('./routes/presentaciones'));
app.use('/api/salas', require('./routes/salas'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/boletos', require('./routes/boletos'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/cursos', require('./routes/cursos'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/inscripciones', require('./routes/inscripciones'));
app.use('/api/mensualidades', require('./routes/mensualidades'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;