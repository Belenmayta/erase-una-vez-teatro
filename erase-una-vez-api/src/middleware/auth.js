const jwt = require('jsonwebtoken');

// Verifica la sesión (token) enviada en el encabezado Authorization: Bearer <token>
function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Falta el token de sesión' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, rol }
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
}

// Permite el paso solo a los roles indicados
function requerirRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tiene permiso para esta acción' });
    }
    next();
  };
}

module.exports = { verificarToken, requerirRol };
