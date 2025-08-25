// 1. Importar las librerías
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- AGREGÁ ESTA LÍNEA
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

// 2. Crear una instancia de Express
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // <-- ASEGURATE DE QUE ESTA LÍNEA ESTÉ AQUÍ
// MIDDLEWARE NUEVO: Para que Express entienda JSON
// Esto es crucial para recibir datos en las peticiones POST
app.use(express.json());

// 3. Configurar la conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// 4. Ruta de prueba (la dejamos por ahora)
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({
        message: '¡Conexión a la base de datos exitosa!',
        database_time: result.rows[0].now
    });
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al conectar con la base de datos');
  }
});

// NUEVA RUTA: Endpoint para registrar usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Verificar que nos enviaron todos los datos
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username y password son requeridos.' });
    }

    // Hashear la contraseña
    const saltRounds = 10; // Nivel de seguridad del hasheo
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar el nuevo usuario en la base de datos
    const newUser = await pool.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [email, username, passwordHash]
    );

    // Enviar una respuesta exitosa con los datos del usuario creado
    res.status(201).json(newUser.rows[0]);

  } catch (error) {
    console.error('Error en el registro:', error);
    // Manejar errores comunes, como email o usuario duplicado
    if (error.code === '23505') { // Código de error de PostgreSQL para "unique violation"
      return res.status(409).json({ message: 'El email o el nombre de usuario ya existen.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA LOGIN ACTUALIZADA
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos.' });
    }

    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });

    }

// NUEVA RUTA PROTEGIDA: Guardar predicciones
app.post('/api/predictions', authMiddleware, async (req, res) => {
  const { predictions } = req.body; // Recibimos un objeto: { matchId: prediction, ... }
  const userId = req.user.id;

  if (!predictions || Object.keys(predictions).length === 0) {
    return res.status(400).json({ message: 'No se enviaron predicciones.' });
  }

  // Usamos un cliente para ejecutar todas las consultas en una sola transacción
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Inicia la transacción

    // Recorremos cada predicción y la guardamos
    for (const matchId in predictions) {
      const prediction = predictions[matchId];
      
      // Esta consulta especial (UPSERT) inserta una nueva predicción
      // o actualiza la existente si el usuario ya había predicho para ese partido.
      const query = `
        INSERT INTO predictions (user_id, match_id, prediction_main)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, match_id) DO UPDATE SET prediction_main = $3;
      `;
      await client.query(query, [userId, matchId, prediction]);
    }

    await client.query('COMMIT'); // Confirma la transacción
    res.status(200).json({ message: 'Pronósticos guardados exitosamente.' });

  } catch (error) {
    await client.query('ROLLBACK'); // Deshace todo si hay un error
    console.error('Error al guardar las predicciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release(); // Libera al cliente de vuelta al pool
  }
});

// NUEVA RUTA PROTEGIDA: Obtener el evento activo y sus partidos
app.get('/api/events/active', authMiddleware, async (req, res) => {
  try {
    // 1. Buscamos el primer evento que esté 'abierto'
    const eventResult = await pool.query("SELECT * FROM events WHERE status = 'open' LIMIT 1");

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'No hay eventos activos en este momento.' });
    }
    const activeEvent = eventResult.rows[0];

    // 2. Buscamos todos los partidos asociados a ese evento
    const matchesResult = await pool.query("SELECT * FROM matches WHERE event_id = $1 ORDER BY match_date ASC", [activeEvent.id]);
    const matches = matchesResult.rows;

    // 3. Devolvemos el evento y su lista de partidos
    res.json({ event: activeEvent, matches: matches });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

    // --- NUEVA LÓGICA DE JWT ---
    // 1. Crear el "payload" del token (la información que guardamos)
    const payload = {
      user: {
        id: user.id
      }
    };

    // 2. Firmar el token con nuestra clave secreta
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // El token expira en 1 hora
      (error, token) => {
        if (error) throw error;
        // 3. Enviar el token al cliente
        res.status(200).json({ token });
      }
    );
    // --- FIN DE LA LÓGICA DE JWT ---

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA ACTUALIZADA: Obtener evento activo, partidos Y PREDICCIONES DEL USUARIO
app.get('/api/events/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const eventResult = await pool.query("SELECT * FROM events WHERE status = 'open' LIMIT 1");
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'No hay eventos activos.' });
    }
    const activeEvent = eventResult.rows[0];

    // Esta es la nueva consulta: une 'matches' con 'predictions'
    // para traer la predicción de ESTE usuario si existe.
    const matchesQuery = `
      SELECT 
        m.id, 
        m.local_team, 
        m.visitor_team, 
        m.match_date,
        p.prediction_main AS user_prediction
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = $1
      WHERE m.event_id = $2
      ORDER BY m.match_date ASC
    `;
    const matchesResult = await pool.query(matchesQuery, [userId, activeEvent.id]);

    res.json({ event: activeEvent, matches: matchesResult.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PROTEGIDA: Obtener perfil del usuario
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    // Gracias al middleware, ya tenemos req.user.id
    const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// NUEVA RUTA PROTEGIDA: Obtener los últimos mensajes del chat
app.get('/api/chat/messages', authMiddleware, async (req, res) => {
  try {
    // Buscamos los últimos 50 mensajes, uniendo con la tabla de usuarios
    // para obtener el nombre de usuario de quien envió el mensaje.
    const messagesResult = await pool.query(`
      SELECT 
        cm.id, 
        cm.message_content, 
        cm.created_at, 
        u.username 
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      ORDER BY cm.created_at DESC
      LIMIT 50
    `);

    // Invertimos el array para que queden en orden cronológico (el más viejo primero)
    const orderedMessages = messagesResult.rows.reverse();

    res.json(orderedMessages);

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// NUEVA RUTA PROTEGIDA: Enviar un nuevo mensaje al chat
app.post('/api/chat/messages', authMiddleware, async (req, res) => {
  try {
    const { message_content } = req.body;
    const userId = req.user.id;

    // Verificación simple para que no envíen mensajes vacíos
    if (!message_content || message_content.trim() === '') {
      return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío.' });
    }

    // Insertamos el nuevo mensaje en la base de datos
    const newMessageResult = await pool.query(
      "INSERT INTO chat_messages (user_id, message_content) VALUES ($1, $2) RETURNING *",
      [userId, message_content]
    );

    // Idealmente, aquí deberíamos notificar a los otros usuarios en tiempo real.
    // Por ahora, solo confirmamos que se guardó.
    res.status(201).json(newMessageResult.rows[0]);

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

