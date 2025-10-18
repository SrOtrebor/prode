require('dotenv').config();
const pool = require('./db');

async function addColumnIfNotExists(client, tableName, columnName, columnDefinition) {
  const checkColumnQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name=$1 AND column_name=$2
  `;
  const res = await client.query(checkColumnQuery, [tableName, columnName]);

  if (res.rows.length === 0) {
    const alterTableQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
    await client.query(alterTableQuery);
    console.log(`Columna '${columnName}' añadida a la tabla '${tableName}'.`);
  } else {
    console.log(`La columna '${columnName}' ya existe en la tabla '${tableName}'.`);
  }
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migración v8: Añadir is_muted a la tabla de usuarios...');
    
    await addColumnIfNotExists(client, 'users', 'is_muted', 'BOOLEAN NOT NULL DEFAULT FALSE');

    console.log('Migración v8 completada con éxito.');
  } catch (err) {
    console.error('Error durante la migración v8:', err);
  } finally {
    client.release();
  }
}

migrate().then(() => {
    console.log('Cerrando pool de conexión.');
    pool.end();
});
