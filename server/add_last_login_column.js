const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Conectado a la base de datos...');

        // Verificar si la columna ya existe
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='last_login';
    `);

        if (res.rows.length === 0) {
            console.log('Agregando columna last_login...');
            await client.query('ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL');
            console.log('Columna last_login agregada exitosamente.');
        } else {
            console.log('La columna last_login ya existe.');
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();
