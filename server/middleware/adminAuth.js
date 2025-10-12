const pool = require('../db');

module.exports = async function(req, res, next) {
  try {
    const user = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }

    next(); // Si es admin, dejamos pasar.
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};