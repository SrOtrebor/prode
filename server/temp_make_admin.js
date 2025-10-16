
require('dotenv').config();
const pool = require('./db');

const userEmail = 'admin@fulbitoplay.com';

async function makeAdmin() {
  console.log(`Iniciando proceso para convertir a '${userEmail}' en administrador...`);
  const client = await pool.connect();

  try {
    const updateUserQuery = `UPDATE users SET role = 'admin' WHERE email = $1`;
    const result = await client.query(updateUserQuery, [userEmail]);

    if (result.rowCount > 0) {
      console.log(`¡Éxito! El usuario con email '${userEmail}' ahora es administrador.`);
    } else {
      console.log(`No se encontró ningún usuario con el email '${userEmail}'. Por favor, verifica que el email sea correcto.`);
    }

  } catch (error) {
    console.error('¡ERROR! No se pudo actualizar el rol del usuario.');
    console.error('Detalles del error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

makeAdmin();
