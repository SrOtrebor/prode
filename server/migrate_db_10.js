require('dotenv').config();
const pool = require('./db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migración v10: Unificar fecha de partidos...');
    await client.query('BEGIN');

    // 1. Renombrar 'real_match_datetime' a 'match_datetime' si existe la primera y no la segunda
    const checkRealColumn = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='real_match_datetime'");
    const checkNewColumn = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='match_datetime'");

    if (checkRealColumn.rows.length > 0 && checkNewColumn.rows.length === 0) {
      await client.query('ALTER TABLE matches RENAME COLUMN real_match_datetime TO match_datetime');
      console.log("Columna 'real_match_datetime' renombrada a 'match_datetime'.");
    }

    // 2. Eliminar la columna 'match_date' si todavía existe
    const checkOldColumn = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='match_date'");
    if (checkOldColumn.rows.length > 0) {
      await client.query('ALTER TABLE matches DROP COLUMN match_date');
      console.log("Columna obsoleta 'match_date' eliminada.");
    }

    // 3. Asegurarse de que la nueva columna 'match_datetime' no permita nulos
    // Primero, rellenar cualquier valor nulo con la fecha actual para evitar errores
    await client.query("UPDATE matches SET match_datetime = NOW() WHERE match_datetime IS NULL");
    await client.query('ALTER TABLE matches ALTER COLUMN match_datetime SET NOT NULL');
    console.log("Columna 'match_datetime' configurada como NOT NULL.");

    await client.query('COMMIT');
    console.log('Migración v10 completada con éxito.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración v10:', err);
  } finally {
    client.release();
  }
}

runMigrations().then(() => {
  console.log('Cerrando pool de conexión.');
  pool.end();
});
