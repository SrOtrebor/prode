
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
  console.log('Iniciando migración de la base de datos (v2)...');
  const client = await pool.connect();

  try {
    // Añadir columna 'quantity' a la tabla 'activation_keys'
    await addColumnIfNotExists(client, 'activation_keys', 'quantity', 'INTEGER DEFAULT 1');

    // Añadir columna 'key_balance' a la tabla 'users'
    await addColumnIfNotExists(client, 'users', 'key_balance', 'INTEGER DEFAULT 0');

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
