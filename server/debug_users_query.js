const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testQuery() {
    try {
        const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.is_active, 
        u.is_muted,
        u.last_login,
        (SELECT COUNT(*) > 0 FROM predictions p WHERE p.user_id = u.id) as has_played
      FROM users u 
      ORDER BY u.id ASC
    `;
        console.log("Ejecutando query...");
        const res = await pool.query(query);
        console.log("Query exitosa. Filas encontradas:", res.rowCount);
        if (res.rowCount > 0) {
            console.log("Primera fila:", res.rows[0]);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error detallado de la query:', err);
        process.exit(1);
    }
}

testQuery();
