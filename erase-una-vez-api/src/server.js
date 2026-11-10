require('dotenv').config();

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('Falta configurar DATABASE_URL o JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = require('./app');
const puerto = process.env.PORT || 3000;

app.listen(puerto, () => {
  console.log(`API Érase una Vez escuchando en http://localhost:${puerto}`);
});
