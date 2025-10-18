require('dotenv').config();
const pool = require('./db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migración v7: Refactorización de estado VIP a tabla dedicada...');
    await client.query('BEGIN');

    // 1. Eliminar la columna 'vip_for_event_id' si existe
    const checkOldColumnQuery = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='vip_for_event_id'`;
    const colResult = await client.query(checkOldColumnQuery);

    if (colResult.rows.length > 0) {
      await client.query('ALTER TABLE users DROP COLUMN vip_for_event_id');
      console.log("Columna 'vip_for_event_id' eliminada de la tabla 'users'.");
    } else {
      console.log("La columna 'vip_for_event_id' no existe, no se necesita eliminar.");
    }

    // 2. Crear la nueva tabla 'vip_statuses' si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS vip_statuses (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, event_id)
      );
    `);
    console.log("Tabla 'vip_statuses' asegurada/creada exitosamente.");

    // 3. Revertir todos los usuarios con rol 'vip' a 'player'
    const updateUserRoles = await client.query("UPDATE users SET role = 'player' WHERE role = 'vip'");
    if (updateUserRoles.rowCount > 0) {
      console.log(`${updateUserRoles.rowCount} usuarios con rol 'vip' han sido revertidos a 'player'.`);
    } else {
      console.log("No se encontraron usuarios con rol 'vip' para revertir.");
    }

    await client.query('COMMIT');
    console.log('Migración v7 completada con éxito.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración v7:', err);
  } finally {
    client.release();
  }
}

runMigrations().then(() => {
  console.log('Cerrando pool de conexión.');
  pool.end();
});
