// 1. Importar las librerías
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const adminAuthMiddleware = require('./middleware/adminAuth');
require('dotenv').config();

// 2. Crear una instancia de Express
const app = express();
app.use(cors({
  origin: 'https://fulbitoplay.onrender.com'
}));
app.use(express.json());
const PORT = process.env.PORT || 3001;

// 3. Configurar la conexión a la base de datos
const pool = require('./db');

// 4. RUTAS DE LA API

// Ruta de prueba
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
    res.status(500).send('Error al conectar con la base de datos');
  }
});

// Ruta para registrar nuevos usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validar que los campos no estén vacíos
    if (!username || !password) {
      return res.status(400).json({ message: 'El nombre de usuario y la contraseña son requeridos.' });
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    // 3. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insertar el nuevo usuario con rol 'player'
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'player')",
      [username, passwordHash]
    );

    // 5. Enviar respuesta de éxito
    res.status(201).json({ message: 'Usuario registrado exitosamente.' });

  } catch (error) {
    console.error('Error en /api/register:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para iniciar sesión
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
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (error, token) => {
        if (error) throw error;
        res.status(200).json({ token });
      }
    );
  } catch (error) {
    console.error('Error en /api/login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    // Añadimos "role" a la consulta SQL
    const user = await pool.query("SELECT id, username, email, role FROM users WHERE id = $1", [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA ACTUALIZADA: Obtiene el evento activo MÁS RECIENTE o el último finalizado
app.get('/api/events/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Buscamos el evento 'open' MÁS RECIENTE
    let eventResult = await pool.query("SELECT * FROM events WHERE status = 'open' ORDER BY id DESC LIMIT 1");

    // 2. Si no hay evento 'open', buscamos el último 'finished'
    if (eventResult.rows.length === 0) {
      eventResult = await pool.query("SELECT * FROM events WHERE status = 'finished' ORDER BY close_date DESC LIMIT 1");
    }

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'No hay eventos activos o finalizados.' });
    }
    const event = eventResult.rows[0];

    // 3. Buscamos los partidos y las predicciones del usuario para ese evento (esto no cambia)
    const matchesQuery = `
      SELECT 
        m.id, m.local_team, m.visitor_team, m.result_local, m.result_visitor,
        p.prediction_main AS user_prediction,
        p.predicted_score_local,
        p.predicted_score_visitor,
        p.points_obtained
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = $1
      WHERE m.event_id = $2
      ORDER BY m.match_date ASC
    `;
    const matchesResult = await pool.query(matchesQuery, [userId, event.id]);

    res.json({ event: event, matches: matchesResult.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta protegida para guardar predicciones
app.post('/api/predictions', authMiddleware, async (req, res) => {
  const { predictions } = req.body;
  const userId = req.user.id;

  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    return res.status(400).json({ message: 'No se enviaron predicciones.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const prediction of predictions) {
      const { match_id, prediction_main, predicted_score_local, predicted_score_visitor } = prediction;
      const query = `
        INSERT INTO predictions (user_id, match_id, prediction_main, predicted_score_local, predicted_score_visitor)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, match_id) 
        DO UPDATE SET 
          prediction_main = $3, 
          predicted_score_local = $4, 
          predicted_score_visitor = $5;
      `;
      await client.query(query, [userId, match_id, prediction_main, predicted_score_local, predicted_score_visitor]);
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Pronósticos guardados exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar predicciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// NUEVA RUTA PROTEGIDA: Finalizar un evento y calcular los puntos
app.post('/api/events/:eventId/calculate', authMiddleware, async (req, res) => {
  // Por ahora, cualquiera puede llamarlo. Más adelante, lo restringiremos a admins.
  const { eventId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtenemos todos los partidos y sus resultados reales para este evento
    const matchesResult = await client.query('SELECT id, result_local, result_visitor FROM matches WHERE event_id = $1', [eventId]);
    const realResults = {};
    for (const match of matchesResult.rows) {
      realResults[match.id] = { local: match.result_local, visitor: match.result_visitor };
    }

    // 2. Obtenemos todas las predicciones para este evento
    const predictionsResult = await client.query('SELECT id, user_id, match_id, prediction_main, predicted_score_local, predicted_score_visitor FROM predictions WHERE match_id = ANY($1::int[])', [Object.keys(realResults)]);
    
    // 3. Calculamos los puntos para cada predicción
    for (const pred of predictionsResult.rows) {
      const matchResult = realResults[pred.match_id];
      let points = 0;

      // Determinamos el resultado real (L, E, V)
      let realOutcome = 'E';
      if (matchResult.local > matchResult.visitor) realOutcome = 'L';
      if (matchResult.visitor > matchResult.local) realOutcome = 'V';

      // Comparamos L/E/V -> 1 punto
      if (pred.prediction_main === realOutcome) {
        points += 1;
        
        // Si acertó L/E/V, revisamos si acertó el resultado exacto -> 3 puntos extra
        if (pred.predicted_score_local === matchResult.local && pred.predicted_score_visitor === matchResult.visitor) {
          points += 3;
        }
      }
      
      // 4. Actualizamos la predicción con los puntos obtenidos
      await client.query('UPDATE predictions SET points_obtained = $1 WHERE id = $2', [points, pred.id]);
    }

    // (Opcional) Cambiamos el estado del evento a 'finished'
    await client.query("UPDATE events SET status = 'finished' WHERE id = $1", [eventId]);
    
    await client.query('COMMIT');
    res.status(200).json({ message: `Puntos para el evento ${eventId} calculados exitosamente.` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al calcular puntos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// Ruta protegida para obtener los últimos mensajes del chat
app.get('/api/chat/messages', authMiddleware, async (req, res) => {
    try {
      const messagesResult = await pool.query(`
        SELECT cm.id, cm.message_content, cm.created_at, u.username 
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        ORDER BY cm.created_at DESC
        LIMIT 50
      `);
      const orderedMessages = messagesResult.rows.reverse();
      res.json(orderedMessages);
    } catch (error) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta protegida para enviar un nuevo mensaje al chat
app.post('/api/chat/messages', authMiddleware, async (req, res) => {
    try {
      const { message_content } = req.body;
      const userId = req.user.id;
      if (!message_content || message_content.trim() === '') {
        return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío.' });
      }
      const newMessageResult = await pool.query(
        "INSERT INTO chat_messages (user_id, message_content) VALUES ($1, $2) RETURNING *",
        [userId, message_content]
      );
      res.status(201).json(newMessageResult.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// NUEVA RUTA: Solo para Admins
app.get('/api/admin/test', authMiddleware, adminAuthMiddleware, (req, res) => {
  res.json({ message: '¡Bienvenido, Admin! La ruta de administrador funciona.' });
});

// RUTA DE ADMIN: Crear un nuevo usuario
app.post('/api/admin/users', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'El nombre de usuario, la contraseña y el rol son requeridos.' });
    }

    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at",
      [username, passwordHash, role]
    );

    res.status(201).json(newUser.rows[0]);

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// NUEVA RUTA DE ADMIN: Crear un nuevo evento (fecha)
app.post('/api/admin/events', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { name, close_date } = req.body;
    if (!name || !close_date) {
      return res.status(400).json({ message: 'El nombre y la fecha de cierre son requeridos.' });
    }

    const newEvent = await pool.query(
      "INSERT INTO events (name, status, close_date) VALUES ($1, 'open', $2) RETURNING *",
      [name, close_date]
    );

    res.status(201).json(newEvent.rows[0]);

  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Obtener todos los eventos
app.get('/api/admin/events', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const events = await pool.query("SELECT id, name FROM events ORDER BY id DESC");
    res.json(events.rows);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Agregar un nuevo partido a un evento
app.post('/api/admin/matches', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { event_id, local_team, visitor_team, match_date } = req.body;
    if (!event_id || !local_team || !visitor_team || !match_date) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const newMatch = await pool.query(
      "INSERT INTO matches (event_id, local_team, visitor_team, match_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [event_id, local_team, visitor_team, match_date]
    );

    res.status(201).json(newMatch.rows[0]);

  } catch (error) {
    console.error('Error al crear partido:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Obtener todos los partidos de un evento específico
app.get('/api/admin/matches/:eventId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const matches = await pool.query("SELECT id, local_team, visitor_team, result_local, result_visitor FROM matches WHERE event_id = $1 ORDER BY match_date ASC", [eventId]);
    res.json(matches.rows);
  } catch (error) {
    console.error('Error al obtener los partidos del evento:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Guardar los resultados de los partidos de un evento
app.post('/api/admin/results', authMiddleware, adminAuthMiddleware, async (req, res) => {
  const { results } = req.body; 

  if (!results || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: 'No se enviaron resultados válidos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const result of results) {
      await client.query(
        'UPDATE matches SET result_local = $1, result_visitor = $2 WHERE id = $3',
        [result.result_local, result.result_visitor, result.match_id]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Resultados guardados exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar resultados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// 5. Iniciar el servidor (SIEMPRE AL FINAL)
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});