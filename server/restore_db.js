
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function restoreDatabase() {
  console.log('Iniciando la restauración de la base de datos...');

  try {
    const sqlFilePath = path.join(__dirname, '..', 'SQL', 'prode_backup.sql');
    let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Limpiando el archivo SQL de comandos no estándar...');
    // Expresión regular para encontrar y eliminar los bloques COPY ... FROM stdin; ... \.
    const copyBlockRegex = /COPY .*? FROM stdin;[\s\S]*?^\\\.$/gm;
    sqlContent = sqlContent.replace(copyBlock_regex, '');

    // Eliminar otros comandos meta de psql que puedan haber quedado
    sqlContent = sqlContent.split('\n').filter(line => {
      const trimmedLine = line.trim();
      return !trimmedLine.startsWith('\\');
    }).join('\n');

    const client = await pool.connect();
    console.log('Conexión a la base de datos exitosa.');

    console.log('Creando tablas (ignorando datos de ejemplo)...');
    await client.query(sqlContent);

    client.release();
    console.log('¡Restauración completada con éxito!');
    console.log('La base de datos y sus tablas han sido creadas.');

  } catch (error) {
    console.error('¡ERROR! No se pudo restaurar la base de datos.');
    console.error('Detalles del error:', error.message);
    console.error('Por favor, asegúrate de que los datos en el archivo .env son correctos y que el servidor de PostgreSQL está corriendo.');
  } finally {
    await pool.end();
  }
}

restoreDatabase();
