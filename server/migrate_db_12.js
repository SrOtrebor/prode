require('dotenv').config();
const pool = require('./db');

async function migrateDatabase() {
  console.log('Iniciando migración para la refactorización del estado VIP...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Eliminar la columna vip_expires_at de la tabla users (si existe)
    console.log("Eliminando la columna 'vip_expires_at' de la tabla 'users' si existe...");
    await client.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS vip_expires_at;
    `);
    console.log("'vip_expires_at' eliminada (si existía).");

    // 2. Crear la nueva tabla vip_statuses
    console.log("Creando la tabla 'vip_statuses' si no existe...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS vip_statuses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      );
    `);
    console.log("'vip_statuses' creada (si no existía).");

    // 3. Revertir roles 'vip' existentes a 'player' en la tabla users
    console.log("Revirtiendo roles 'vip' existentes a 'player'...");
    await client.query(`
      UPDATE users
      SET role = 'player'
      WHERE role = 'vip';
    `);
    console.log("Roles 'vip' revertidos a 'player'.");

    await client.query('COMMIT'); // Confirmar transacción
    console.log('¡Migración de refactorización VIP completada con éxito!');

  } catch (error) {
    await client.query('ROLLBACK'); // Revertir transacción en caso de error
    console.error('¡ERROR! No se pudo migrar la base de datos para la refactorización VIP.');
    console.error('Detalles del error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateDatabase();
