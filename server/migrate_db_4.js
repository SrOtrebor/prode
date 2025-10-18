require('dotenv').config();
const pool = require('./db');

// Función para añadir una columna solo si no existe
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
    console.log('Iniciando migración v4: Añadir is_active a la tabla de usuarios...');
    
    // Añadir la columna is_active a la tabla users
    await addColumnIfNotExists(client, 'users', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE');

    console.log('Migración v4 completada con éxito.');
  } catch (err) {
    console.error('Error durante la migración v4:', err);
  } finally {
    client.release();
  }
}

migrate().then(() => {
    console.log('Cerrando pool de conexión.');
    pool.end();
});
