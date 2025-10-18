
require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');
const url = require('url');

const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

async function migrateDatabase() {
  console.log('Iniciando migración de la base de datos...');
  const client = await pool.connect();

  try {
    console.log("Añadiendo la columna 'puede_apostar_resultado' a la tabla de usuarios...");
    
    // Primero, verificamos si la columna ya existe para no generar un error
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='puede_apostar_resultado'
    `;
    const result = await client.query(checkColumnQuery);

    if (result.rows.length > 0) {
      console.log("La columna 'puede_apostar_resultado' ya existe. No se necesita hacer nada.");
    } else {
      const alterTableQuery = 'ALTER TABLE users ADD COLUMN puede_apostar_resultado BOOLEAN DEFAULT FALSE';
      await client.query(alterTableQuery);
      console.log('¡Columna añadida exitosamente!');
    }

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
