require('./db'); // Solo para asegurar que las variables de entorno se cargan si es necesario
const pool = require('./db');

const userEmail = 'admin@fulbitoplay.com';

async function makeAdmin() {
  console.log(`Intentando convertir a '${userEmail}' en administrador...`);
  const client = await pool.connect();
  try {
    const result = await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [userEmail]);
    if (result.rowCount > 0) {
      console.log(`¡Éxito! El usuario con email '${userEmail}' ahora es administrador.`);
    } else {
      console.log(`No se encontró ningún usuario con el email '${userEmail}'.`);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

makeAdmin();