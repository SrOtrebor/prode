require('dotenv').config({ path: './server/.env' });
const pool = require('./db');

async function migrateDatabase() {
  console.log('Iniciando migración para unificar columnas de fecha y hora de partidos...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Añadir la nueva columna match_datetime
    console.log("Añadiendo la columna 'match_datetime' a la tabla 'matches'...");
    await client.query(`
      ALTER TABLE matches
      ADD COLUMN match_datetime TIMESTAMP WITH TIME ZONE;
    `);
    console.log("'match_datetime' añadida.");

    // 2. Migrar datos
    console.log("Migrando datos a 'match_datetime'...");
    await client.query(`
      UPDATE matches
      SET match_datetime = COALESCE(real_match_datetime, match_date);
    `);
    console.log("Datos migrados.");

    // 3. Establecer NOT NULL en match_datetime
    console.log("Estableciendo 'match_datetime' como NOT NULL...");
    await client.query(`
      ALTER TABLE matches
      ALTER COLUMN match_datetime SET NOT NULL;
    `);
    console.log("'match_datetime' es ahora NOT NULL.");

    // 4. Eliminar las columnas antiguas
    console.log("Eliminando columnas antiguas 'match_date' y 'real_match_datetime'...");
    await client.query(`
      ALTER TABLE matches
      DROP COLUMN match_date,
      DROP COLUMN real_match_datetime;
    `);
    console.log("Columnas antiguas eliminadas.");

    await client.query('COMMIT'); // Confirmar transacción
    console.log('¡Migración de unificación de fecha y hora de partidos completada con éxito!');

  } catch (error) {
    await client.query('ROLLBACK'); // Revertir transacción en caso de error
    console.error('¡ERROR! No se pudo migrar la base de datos para unificar fecha y hora de partidos.');
    console.error('Detalles del error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateDatabase();