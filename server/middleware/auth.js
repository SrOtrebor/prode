const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Obtener el header de Autorización
  const authHeader = req.header('Authorization');

  // 2. Verificar que el header exista
  if (!authHeader) {
    return res.status(401).json({ message: 'No hay token, permiso denegado.' });
  }

  // El header tiene el formato "Bearer <token>"
  // Hacemos un split por el espacio y tomamos la segunda parte, que es el token.
  const token = authHeader.split(' ')[1];

  // Si después del split no hay token, el formato del header es incorrecto
  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido, falta "Bearer ".' });
  }

  // 3. Verificar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Guardamos los datos del usuario en la petición
    next(); // Dejamos pasar
  } catch (error) {
    res.status(401).json({ message: 'El token no es válido.' });
  }
};