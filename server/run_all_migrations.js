require('dotenv').config();
const { exec } = require('child_process');

async function runMigration(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando migración: ${scriptPath}`);
    const child = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar ${scriptPath}: ${error}`);
        console.error(`Stderr: ${stderr}`);
        return reject(error);
      }
      console.log(`Stdout: ${stdout}`);
      if (stderr) {
        console.warn(`Stderr (advertencias/errores no fatales) de ${scriptPath}: ${stderr}`);
      }
      resolve();
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

async function runAllMigrations() {
  try {
    console.log('Iniciando la ejecución de todas las migraciones...');
    await runMigration('./server/migrate_db_11.js');
    await runMigration('./server/migrate_db_12.js');
    console.log('Todas las migraciones se ejecutaron con éxito.');
  } catch (error) {
    console.error('Una o más migraciones fallaron. Deteniendo el proceso.');
    process.exit(1); // Salir con código de error
  }
}

runAllMigrations();
