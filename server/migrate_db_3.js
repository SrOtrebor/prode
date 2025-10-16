
require('dotenv').config();
const pool = require('./db');

// Función para añadir una columna solo si no existe
async function addColumnIfNotExists(client, tableName, columnName, columnType) {
  const checkColumnQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name=$1 AND column_name=$2
  `;
  const result = await client.query(checkColumnQuery, [tableName, columnName]);

  if (result.rows.length > 0) {
    console.log(`La columna '${columnName}' ya existe en la tabla '${tableName}'. No se necesita hacer nada.`);
  } else {
    const alterTableQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    await client.query(alterTableQuery);
    console.log(`¡Columna '${columnName}' añadida a la tabla '${tableName}' exitosamente!`);
  }
}

async function migrateDatabase() {
  console.log('Iniciando migración de la base de datos (v3)...');
  const client = await pool.connect();

  try {
    // 1. Eliminar la columna 'puede_apostar_resultado' si existe
    const checkColumnQuery = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='puede_apostar_resultado'`;
    const colResult = await client.query(checkColumnQuery);

    if (colResult.rows.length > 0) {
      await client.query('ALTER TABLE users DROP COLUMN puede_apostar_resultado');
      console.log("Columna 'puede_apostar_resultado' eliminada de la tabla 'users'.");
    } else {
      console.log("La columna 'puede_apostar_resultado' no existe. No se necesita eliminar.");
    }

    // 2. Crear la nueva tabla 'unlocked_score_bets' si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS unlocked_score_bets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, match_id)
      );
    `;
    await client.query(createTableQuery);
    console.log("Tabla 'unlocked_score_bets' asegurada/creada exitosamente.");

    console.log('¡Migración completada con éxito!');

  } catch (error) {
    console.error('¡ERROR! No se pudo migrar la base de datos.');
    console.error('Detalles del error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateDatabase();
