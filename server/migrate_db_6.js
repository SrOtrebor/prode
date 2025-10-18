require('dotenv').config();
const pool = require('./db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migración v6: Ajustar estado VIP a eventos...');
    await client.query('BEGIN');

    // 1. Eliminar la columna 'vip_expires_at' si existe
    const checkOldColumnQuery = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='vip_expires_at'`;
    const colResult = await client.query(checkOldColumnQuery);

    if (colResult.rows.length > 0) {
      await client.query('ALTER TABLE users DROP COLUMN vip_expires_at');
      console.log("Columna 'vip_expires_at' eliminada de la tabla 'users'.");
    } else {
      console.log("La columna 'vip_expires_at' no existe, no se necesita eliminar.");
    }

    // 2. Añadir la nueva columna 'vip_for_event_id' si no existe
    const checkNewColumnQuery = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='vip_for_event_id'`;
    const newColResult = await client.query(checkNewColumnQuery);

    if (newColResult.rows.length === 0) {
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN vip_for_event_id INTEGER REFERENCES events(id) ON DELETE SET NULL
      `;
      await client.query(addColumnQuery);
      console.log("Columna 'vip_for_event_id' añadida a la tabla 'users'.");
    } else {
      console.log("La columna 'vip_for_event_id' ya existe.");
    }

    await client.query('COMMIT');
    console.log('Migración v6 completada con éxito.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración v6:', err);
  } finally {
    client.release();
  }
}

runMigrations().then(() => {
  console.log('Cerrando pool de conexión.');
  pool.end();
});
