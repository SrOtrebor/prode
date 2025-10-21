// 1. Importar las librerías
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const adminAuthMiddleware = require('./middleware/adminAuth');
const crypto = require('crypto');
const { calculateMatchPoints } = require('./scoringService');
const { spawn } = require('child_process'); // Importar child_process para ejecutar scripts de Python
// require('./textParser.js') ya no es necesario.
require('dotenv').config();

// --- CONFIGURACIÓN DEL SERVIDOR Y CORS ---
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const whitelist = [
    'https://fulbitoplay.onrender.com',
    'https://www.fulbitoplay.com.ar',
    'https://fulbitoplay.com.ar',
    'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

// 2. Crear una instancia de Express
app.use(cors(corsOptions));
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
    const { username, password, email } = req.body;

    // 1. Validar que los campos no estén vacíos
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'El nombre de usuario, el email y la contraseña son requeridos.' });
    }

    // 2. Verificar si el usuario o el email ya existen
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario o el email ya existe.' });
    }

    // 3. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insertar el nuevo usuario con rol 'player', email y estado inactivo
    await pool.query(
      "INSERT INTO users (username, password_hash, role, email, is_active) VALUES ($1, $2, 'player', $3, false)",
      [username, passwordHash, email]
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

    // <-- INICIO: Verificación de usuario activo -->
    if (!user.is_active) {
      return res.status(403).json({ message: 'Esta cuenta ha sido desactivada por un administrador.' });
    }
    // <-- FIN: Verificación de usuario activo -->

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
    const query = `
      SELECT id, username, email, role, key_balance,
            (SELECT array_agg(event_id) FROM vip_statuses WHERE user_id = u.id) as vip_events
      FROM users u
      WHERE u.id = $1
    `;
    const userResult = await pool.query(query, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = userResult.rows[0];
    // Si vip_events es null (porque el usuario no es VIP para ningún evento), lo convertimos a un array vacío
    if (!user.vip_events) {
      user.vip_events = [];
    }

    res.json(user);

  } catch (error) {
    console.error('Error en /api/profile:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE USUARIO: Cambiar el nombre de usuario (solo para VIPs y Admins)
app.put('/api/profile/change-username', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { newUsername } = req.body;

  if (!newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({ message: 'El nuevo nombre de usuario debe tener al menos 3 caracteres.' });
  }

  try {
    // 1. Verificar permisos
    const userResult = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    let hasPermission = false;
    if (user.role === 'admin') {
      hasPermission = true;
    } else {
      const vipCheck = await pool.query(
        `SELECT 1 FROM vip_statuses vs
         JOIN events e ON vs.event_id = e.id
         WHERE vs.user_id = $1 AND e.status = 'open'
         LIMIT 1`,
        [userId]
      );
      if (vipCheck.rows.length > 0) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Debes ser Admin o tener un VIP activo para cambiar tu nombre de usuario.' });
    }

    // 2. Verificar que el nuevo nombre de usuario no esté en uso
    const existingUser = await pool.query("SELECT id FROM users WHERE username = $1 AND id != $2", [newUsername, userId]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Ese nombre de usuario ya está en uso.' });
    }

    // 3. Actualizar el nombre de usuario
    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [newUsername, userId]);

    res.status(200).json({ message: '¡Nombre de usuario actualizado exitosamente!' });

  } catch (error) {
    console.error('Error al cambiar el nombre de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA para obtener la lista de eventos abiertos
app.get('/api/events/open', authMiddleware, async (req, res) => {
  try {
    const events = await pool.query("SELECT id, name FROM events WHERE status = 'open' ORDER BY id DESC");
    res.json(events.rows);
  } catch (error) {
    console.error('Error al obtener eventos abiertos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA ACTUALIZADA: Obtiene un evento específico por ID
app.get('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: eventId } = req.params;
    
    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró el evento.' });
    }
    const event = eventResult.rows[0];

    // 1. Obtener todos los partidos del evento
    const matchesQuery = `
      SELECT 
        m.id, m.local_team, m.visitor_team, m.result_local, m.result_visitor, m.match_datetime,
        p.prediction_main AS user_prediction,
        p.predicted_score_local,
        p.predicted_score_visitor,
        p.points_obtained
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = $1
      WHERE m.event_id = $2
      ORDER BY m.match_datetime ASC
    `;
    const matchesResult = await pool.query(matchesQuery, [userId, event.id]);
    const matches = matchesResult.rows;

    // 2. Obtener los IDs de los partidos desbloqueados por el usuario para este evento
    const matchIds = matches.map(m => m.id);
    const unlockedResult = await pool.query(
      'SELECT match_id FROM unlocked_score_bets WHERE user_id = $1 AND match_id = ANY($2::int[])',
      [userId, matchIds]
    );
    const unlockedIds = new Set(unlockedResult.rows.map(r => r.match_id));

    // 3. Unir la información en el código
    const matchesWithUnlockStatus = matches.map(match => ({
      ...match,
      is_unlocked: unlockedIds.has(match.id)
    }));

    // 4. Verificar si el usuario es VIP para este evento específico
    const vipCheckResult = await pool.query('SELECT 1 FROM vip_statuses WHERE user_id = $1 AND event_id = $2', [userId, event.id]);
    const is_vip_for_event = vipCheckResult.rows.length > 0;

    res.json({ event: event, matches: matchesWithUnlockStatus, is_vip_for_event });

  } catch (error) {
    console.error(`Error detallado en /api/events/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al cargar el evento.' });
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

    // --- NUEVA VALIDACIÓN DE FECHA LÍMITE (EXISTENTE) ---
    const firstMatchId = predictions[0].match_id;
    const eventResult = await client.query(
      'SELECT e.id, e.close_date FROM events e JOIN matches m ON e.id = m.event_id WHERE m.id = $1',
      [firstMatchId]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'El evento asociado a estas predicciones no fue encontrado.' });
    }

    const eventCloseDate = eventResult.rows[0].close_date;
    if (new Date() > new Date(eventCloseDate)) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(403).json({ message: 'El tiempo para enviar o modificar pronósticos para este evento ha finalizado.' });
    }
    // --- FIN DE LA VALIDACIÓN DE FECHA LÍMITE ---

    // --- INICIO: Validación de consistencia de pronósticos (NUEVA) ---
    const isVipForEventResult = await client.query('SELECT 1 FROM vip_statuses WHERE user_id = $1 AND event_id = $2', [userId, eventResult.rows[0].id]);
    const isVipForEvent = isVipForEventResult.rows.length > 0;

    for (const prediction of predictions) {
      const { match_id, prediction_main, predicted_score_local, predicted_score_visitor } = prediction;

      // Solo validar si el usuario es VIP y ha proporcionado scores exactos
      if (isVipForEvent && predicted_score_local !== null && predicted_score_visitor !== null) {
        const local = predicted_score_local;
        const visitor = predicted_score_visitor;

        if (typeof local !== 'number' || typeof visitor !== 'number' || local < 0 || visitor < 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ message: 'Los resultados exactos deben ser números enteros no negativos.' });
        }

        switch (prediction_main) {
          case 'L':
            if (local <= visitor) {
              await client.query('ROLLBACK');
              client.release();
              return res.status(400).json({ message: `El pronóstico exacto para el partido ${match_id} no coincide con la predicción principal (Victoria Local).` });
            }
            break;
          case 'V':
            if (visitor <= local) {
              await client.query('ROLLBACK');
              client.release();
              return res.status(400).json({ message: `El pronóstico exacto para el partido ${match_id} no coincide con la predicción principal (Victoria Visitante).` });
            }
            break;
          case 'E':
            if (local !== visitor) {
              await client.query('ROLLBACK');
              client.release();
              return res.status(400).json({ message: `El pronóstico exacto para el partido ${match_id} no coincide con la predicción principal (Empate).` });
            }
            break;
        }
      }
    }
    // --- FIN: Validación de consistencia de pronósticos ---

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
    if (!client.isReleased) {
      client.release();
    }
  }
});

// RUTA DE ADMIN ACTUALIZADA Y SEGURA: Finalizar un evento y calcular los puntos
app.post('/api/events/:eventId/calculate', authMiddleware, adminAuthMiddleware, async (req, res) => {
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

      // Si el resultado del partido no ha sido cargado, los puntos son 0
      if (matchResult.local === null || matchResult.visitor === null) {
        points = 0;
      } else {
        // Determinamos el resultado real (L, E, V)
        let realOutcome = 'E';
        if (matchResult.local > matchResult.visitor) realOutcome = 'L';
        if (matchResult.visitor > matchResult.local) realOutcome = 'V';

        // Comparamos L/E/V -> 1 punto
        if (pred.prediction_main === realOutcome) {
          points += 1;
          
          // Si acertó L/E/V, revisamos si acertó el resultado exacto -> 2 puntos extra
          if (pred.predicted_score_local === matchResult.local && pred.predicted_score_visitor === matchResult.visitor) {
            points += 2; // <-- CAMBIO APLICADO
          }
        }
      }
      
      // 4. Actualizamos la predicción con los puntos obtenidos
      await client.query('UPDATE predictions SET points_obtained = $1 WHERE id = $2', [points, pred.id]);
    }

    // Cambiamos el estado del evento a 'finished'
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
        SELECT cm.id, cm.message_content, cm.created_at, u.username, u.role 
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

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Ruta protegida para enviar un nuevo mensaje al chat
app.post('/api/chat/messages', authMiddleware, async (req, res) => {
    try {
      const { message_content } = req.body;
      const userId = req.user.id;

      // Verificar si el usuario está silenciado
      const userCheckResult = await pool.query('SELECT username, role, is_muted FROM users WHERE id = $1', [userId]);
      const user = userCheckResult.rows[0];

      if (user.is_muted) {
        return res.status(403).json({ message: 'No puedes enviar mensajes porque has sido silenciado.' });
      }

      if (!message_content || message_content.trim() === '') {
        return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío.' });
      }

      const newMessageResult = await pool.query(
        "INSERT INTO chat_messages (user_id, message_content) VALUES ($1, $2) RETURNING id, created_at, message_content",
        [userId, message_content]
      );

      const finalMessage = {
        ...newMessageResult.rows[0],
        username: user.username,
        role: user.role
      };

      // Emitir el nuevo mensaje a todos los clientes conectados
      io.emit('new_message', finalMessage);

      res.status(201).json(finalMessage);
    } catch (error) {
      console.error('Error al enviar mensaje de chat:', error);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// RUTA DE ADMIN: Borrar todos los mensajes del chat
app.delete('/api/admin/chat/messages', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE chat_messages RESTART IDENTITY');
    
    // Emitir un evento a todos los clientes para que limpien su chat
    io.emit('chat_cleared');

    res.status(200).json({ message: 'El historial del chat ha sido eliminado.' });

  } catch (error) {
    console.error('Error al borrar los mensajes del chat:', error);
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
    const { username, password, email, role } = req.body;

    if (!username || !password || !role || !email) {
      return res.status(400).json({ message: 'El email, nombre de usuario, la contraseña y el rol son requeridos.' });
    }

    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario o email ya existe.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isActive = role === 'admin';

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, role, email, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, email, created_at, is_active",
      [username, passwordHash, role, email, isActive]
    );

    res.status(201).json(newUser.rows[0]);

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Obtener todos los usuarios
app.get('/api/admin/users', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const users = await pool.query("SELECT id, username, email, role, is_active, is_muted FROM users ORDER BY id ASC");
    res.json(users.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Actualizar el rol de un usuario
app.put('/api/admin/users/:userId/role', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validar que el rol sea uno de los permitidos
    const validRoles = ['player', 'vip', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role",
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error al actualizar el rol del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Eliminar un usuario
app.delete('/api/admin/users/:userId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // No se puede eliminar al usuario admin principal (ID 1, por ejemplo)
    // Esta es una medida de seguridad importante. Asumimos que el admin principal tiene ID 1.
    if (userId === '1') {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal.' });
    }

    const deleteOp = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: `El usuario ${userId} ha sido eliminado.` });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Cambiar el estado de activación de un usuario
app.put('/api/admin/users/:userId/status', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'El estado de activación debe ser un valor booleano.' });
    }

    // No se puede desactivar al admin principal
    if (userId === '1' && !is_active) {
      return res.status(403).json({ message: 'No se puede desactivar al administrador principal.' });
    }

    const result = await pool.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, is_active",
      [is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error al cambiar el estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Silenciar/reactivar un usuario
app.put('/api/admin/users/:userId/mute', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_muted } = req.body;

    if (typeof is_muted !== 'boolean') {
      return res.status(400).json({ message: 'El estado de silencio debe ser un valor booleano.' });
    }

    // No se puede silenciar a un admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0 && userResult.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'No se puede silenciar a un administrador.' });
    }

    const result = await pool.query(
      "UPDATE users SET is_muted = $1 WHERE id = $2 RETURNING id, username, is_muted",
      [is_muted, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error al cambiar el estado de silencio del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Resetear la contraseña de un usuario
app.post('/api/admin/reset-password', authMiddleware, adminAuthMiddleware, async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'El email y la nueva contraseña son requeridos.' });
  }

  try {
    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña en la base de datos
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [passwordHash, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado con ese email.' });
    }

    res.status(200).json({ message: 'La contraseña ha sido reseteada exitosamente.' });

  } catch (error) {
    console.error('Error al resetear la contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Obtener estadísticas de uso de llaves
app.get('/api/admin/stats/key-usage', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const vipByEventResult = await pool.query(`
      SELECT e.name, COUNT(vs.user_id)::int as vip_count
      FROM vip_statuses vs
      JOIN events e ON vs.event_id = e.id
      GROUP BY e.name
      ORDER BY vip_count DESC
    `);
    const unlockedResult = await pool.query('SELECT COUNT(*)::int FROM unlocked_score_bets');

    const stats = {
      vip_by_event: vipByEventResult.rows,
      keys_spent_on_unlocks: unlockedResult.rows[0].count,
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas de llaves:', error);
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

    // Interpretar el datetime como UTC-3 (Argentina)
    const close_date_art = `${close_date}:00-03:00`;

    const newEvent = await pool.query(
      "INSERT INTO events (name, status, close_date) VALUES ($1, 'open', $2) RETURNING *",
      [name, close_date_art]
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
    const events = await pool.query("SELECT id, name, status FROM events ORDER BY id DESC");
    res.json(events.rows);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Agregar un nuevo partido a un evento
app.post('/api/admin/matches', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { event_id, local_team, visitor_team, match_datetime } = req.body;
    if (!event_id || !local_team || !visitor_team || !match_datetime) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Interpretar el datetime como UTC-3 (Argentina)
    const match_datetime_art = `${match_datetime}:00-03:00`;

    const newMatch = await pool.query(
      "INSERT INTO matches (event_id, local_team, visitor_team, match_datetime) VALUES ($1, $2, $3, $4) RETURNING *",
      [event_id, local_team, visitor_team, match_datetime_art]
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
    const matches = await pool.query("SELECT id, local_team, visitor_team, result_local, result_visitor, match_datetime FROM matches WHERE event_id = $1 ORDER BY match_datetime ASC", [eventId]);
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
      // Calcular y actualizar los puntos para este partido
      await calculateMatchPoints(result.match_id, client);
    }

    await client.query('COMMIT');

    // Obtener el eventId de uno de los partidos actualizados
    const firstMatchId = results[0].match_id;
    const eventIdResult = await client.query('SELECT event_id FROM matches WHERE id = $1', [firstMatchId]);
    const eventId = eventIdResult.rows[0].event_id;

    // Obtener la tabla de posiciones actualizada para ese evento
    const leaderboardQuery = `
      SELECT
        u.username,
        u.role,
        SUM(p.points_obtained) AS total_points
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      WHERE m.event_id = $1
      GROUP BY u.username, u.role
      ORDER BY total_points DESC;
    `;
    const updatedLeaderboard = await client.query(leaderboardQuery, [eventId]);

    res.status(200).json({ message: 'Resultados guardados exitosamente.', leaderboard: updatedLeaderboard.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar resultados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// RUTA DE ADMIN: Eliminar un evento
app.delete('/api/admin/events/:eventId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // La configuración ON DELETE CASCADE en la DB se encargará de borrar partidos y predicciones asociadas
    const deleteOp = await pool.query("DELETE FROM events WHERE id = $1", [eventId]);

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    res.status(200).json({ message: `El evento ${eventId} y todos sus datos asociados han sido eliminados.` });

  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Eliminar un partido
app.delete('/api/admin/matches/:matchId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;

    // La configuración ON DELETE CASCADE se encargará de borrar las predicciones asociadas
    const deleteOp = await pool.query("DELETE FROM matches WHERE id = $1", [matchId]);

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Partido no encontrado.' });
    }

    res.status(200).json({ message: `El partido ${matchId} y sus predicciones han sido eliminados.` });

  } catch (error) {
    console.error('Error al eliminar partido:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE ADMIN: Actualizar un partido existente
app.put('/api/admin/matches/:matchId', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { local_team, visitor_team, match_datetime } = req.body;

    if (!local_team || !visitor_team || !match_datetime) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Formatear la fecha para la base de datos
    const match_datetime_art = `${match_datetime}:00-03:00`;

    const updatedMatch = await pool.query(
      "UPDATE matches SET local_team = $1, visitor_team = $2, match_datetime = $3 WHERE id = $4 RETURNING *",
      [local_team, visitor_team, match_datetime_art, matchId]
    );

    if (updatedMatch.rows.length === 0) {
      return res.status(404).json({ message: 'Partido no encontrado.' });
    }

    res.status(200).json({ message: 'Partido actualizado exitosamente.', match: updatedMatch.rows[0] });

  } catch (error) {
    console.error('Error al actualizar partido:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// La ruta /api/admin/import-fixtures ha sido reemplazada por /api/admin/batch-load-matches


// RUTA DE ADMIN: Generar una nueva llave de activación (con cantidad)
app.post('/api/admin/generate-key', authMiddleware, adminAuthMiddleware, async (req, res) => {
  const { quantity } = req.body; // Se recibe una cantidad opcional
  const keyQuantity = quantity > 0 ? quantity : 1; // Por defecto es 1 si no se especifica

  try {
    const newKey = crypto.randomBytes(8).toString('hex');

    const result = await pool.query(
      "INSERT INTO activation_keys (key_code, status, quantity) VALUES ($1, 'available', $2) RETURNING *",
      [newKey, keyQuantity]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') { 
      return res.status(500).json({ message: 'Error al generar la llave, por favor inténtalo de nuevo.' });
    }
    console.error('Error al generar la llave:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA DE USUARIO: Canjear un código para añadir llaves al saldo
app.post('/api/keys/redeem', authMiddleware, async (req, res) => {
  const { keyCode } = req.body;
  const userId = req.user.id;

  if (!keyCode) {
    return res.status(400).json({ message: 'Debes proporcionar un código de llave.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const keyResult = await client.query(
      "SELECT id, quantity FROM activation_keys WHERE key_code = $1 AND status = 'available' FOR UPDATE",
      [keyCode]
    );

    if (keyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'La llave es inválida o ya ha sido utilizada.' });
    }
    
    const key = keyResult.rows[0];
    const keyQuantity = key.quantity;

    // Añadir la cantidad de llaves al saldo del usuario
    await client.query(
      "UPDATE users SET key_balance = key_balance + $1 WHERE id = $2",
      [keyQuantity, userId]
    );

    // Marcar la llave como usada
    await client.query(
      "UPDATE activation_keys SET status = 'used', used_by_user_id = $1, used_at = NOW() WHERE id = $2",
      [userId, key.id]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: `¡Éxito! Has añadido ${keyQuantity} llave(s) a tu cuenta.` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al canjear la llave:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    if (!client.isReleased) {
      client.release();
    }
  }
});

// RUTA DE USUARIO: Gastar una llave para desbloquear la apuesta de resultado en un partido específico
app.post('/api/matches/:matchId/unlock-score-bet', authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener el perfil del usuario y bloquear la fila para la transacción
    const userResult = await client.query("SELECT key_balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const user = userResult.rows[0];

    // Verificar que el partido no haya comenzado o el evento no haya finalizado
    const matchResult = await client.query('SELECT m.match_datetime, e.status FROM matches m JOIN events e ON m.event_id = e.id WHERE m.id = $1', [matchId]);
    if (matchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'El partido no existe.' });
    }
    const match = matchResult.rows[0];
    if (new Date(match.match_datetime) <= new Date() || match.status === 'finished') {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'No puedes desbloquear un partido que ya ha comenzado o finalizado.' });
    }

    // Verificar que el usuario tenga llaves
    if (user.key_balance <= 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'No tienes llaves suficientes.' });
    }

    // Verificar que el usuario no haya desbloqueado ya este partido
    const existingUnlock = await client.query("SELECT id FROM unlocked_score_bets WHERE user_id = $1 AND match_id = $2", [userId, matchId]);
    if (existingUnlock.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Ya has desbloqueado este partido.' });
    }

    // 1. Restar una llave del saldo
    await client.query("UPDATE users SET key_balance = key_balance - 1 WHERE id = $1", [userId]);

    // 2. Registrar el desbloqueo en la nueva tabla
    await client.query("INSERT INTO unlocked_score_bets (user_id, match_id) VALUES ($1, $2)", [userId, matchId]);

    await client.query('COMMIT');
    res.status(200).json({ message: '¡Apuesta de resultado desbloqueada para este partido!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al desbloquear el partido:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    if (!client.isReleased) {
      client.release();
    }
  }
});

// RUTA DE USUARIO: Gastar una llave para un beneficio
app.post('/api/keys/spend', authMiddleware, async (req, res) => {
  const { benefit, eventId } = req.body;
  const userId = req.user.id;

  if (!benefit) {
    return res.status(400).json({ message: 'No se especificó ningún beneficio.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query("SELECT role, key_balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const user = userResult.rows[0];

    switch (benefit) {
      case 'become_vip': {
        if (!eventId) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Se requiere el ID del evento para volverse VIP.' });
        }

        // Chequear si el evento ya finalizó
        const eventResult = await client.query('SELECT status FROM events WHERE id = $1', [eventId]);
        if (eventResult.rows.length === 0 || eventResult.rows[0].status === 'finished') {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'No puedes hacerte VIP de un evento que ya ha finalizado.' });
        }

        if (user.key_balance < 1) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'No tienes llaves suficientes.' });
        }

        const alreadyVip = await client.query('SELECT 1 FROM vip_statuses WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
        if (alreadyVip.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: 'Ya eres VIP para este evento.' });
        }

        await client.query('INSERT INTO vip_statuses (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
        await client.query('UPDATE users SET key_balance = key_balance - 1 WHERE id = $1', [userId]);
        
        await client.query('COMMIT');
        res.status(200).json({ message: '¡Felicidades! Ahora eres VIP para este evento.' });
        break;
      }

      default:
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'El beneficio solicitado no es válido.' });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al gastar la llave:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    if (!client.isReleased) {
      client.release();
    }
  }
});

// NUEVA RUTA: Obtener la tabla de posiciones para un evento
app.get('/api/leaderboard/:eventId', authMiddleware, async (req, res) => {
  const { eventId } = req.params;

  try {
    const query = `
      SELECT 
        u.username,
        u.role,
        SUM(p.points_obtained) AS total_points
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      WHERE m.event_id = $1
      GROUP BY u.username, u.role
      ORDER BY total_points DESC;
    `;
    const leaderboardData = await pool.query(query, [eventId]);

    res.json(leaderboardData.rows);

  } catch (error) {
    console.error(`Error al obtener leaderboard para el evento ${eventId}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});



// --- INICIO: LÓGICA DE CARGA RÁPIDA ---
const TEAMS_DICTIONARY = [
    'Aldosivi', 'Ind. Rivadavia Mza', 'Banfield', 'Lanús', 'Barracas', 'Argentinos Jrs.',
    'Belgrano', 'Tigre', 'Central Córdoba', 'Racing', 'Defensa', 'Huracán',
    'Estudiantes', 'Boca Jrs.', 'Godoy Cruz', 'San Martín SJ', 'Independiente', 'At. Tucumán',
    'Instituto', 'Central', "Newell's", 'Unión', 'Platense', 'Sarmiento',
    'River', 'Gimnasia LP', 'San Lorenzo', 'Dep. Riestra', 'Vélez', 'Talleres'
];

app.post('/api/admin/batch-load-matches', authMiddleware, adminAuthMiddleware, async (req, res) => {
    const { rawText, eventId } = req.body;

    if (!rawText || !eventId) {
        return res.status(400).json({ message: 'El texto y el ID del evento son requeridos.' });
    }

    try {
        const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
        const matchesData = [];

        for (const line of lines) {
            const timeRegex = /^(\d{2}:\d{2})/;
            const timeMatch = line.match(timeRegex);

            if (!timeMatch) continue; // Ignorar líneas que no empiezan con hora (ej: estadios)

            console.log(`--- Processing line: ${line}`);

            const time = timeMatch[1];
            const teamsText = line.substring(time.length);

            const parts = teamsText.split(/\s{2,}/);
            console.log(`Split parts: ${JSON.stringify(parts)}`);
            if (parts.length < 2) continue; // Si no hay separador de doble espacio, ignorar

            const homeBlock = parts[0];
            const awayBlock = parts.slice(1).join('  ');
            console.log(`Home block: ${homeBlock}, Away block: ${awayBlock}`);

            // Usar .find() para encontrar el primer equipo conocido en cada bloque
            const homeTeam = TEAMS_DICTIONARY.find(team => homeBlock.includes(team));
            const awayTeam = TEAMS_DICTIONARY.find(team => awayBlock.includes(team));
            console.log(`Found teams: Home=${homeTeam}, Away=${awayTeam}`);

            if (homeTeam && awayTeam) {
                const matchDate = '2025-11-02'; // Esto debería ser dinámico
                const dateTime = `${matchDate}T${time}:00-03:00`;
                matchesData.push({
                    eventId,
                    homeTeam,
                    awayTeam,
                    dateTime
                });
            }
        }
        
        if (matchesData.length === 0) {
            return res.status(400).json({ message: 'No se pudieron interpretar partidos del texto. Asegúrate de que el formato sea correcto (ej: HH:MM EquipoLocal  EquipoVisitante).' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const match of matchesData) {
                await client.query(
                    `INSERT INTO matches (event_id, local_team, visitor_team, match_datetime)
                     VALUES ($1, $2, $3, $4)`,
                    [match.eventId, match.homeTeam, match.awayTeam, match.dateTime]
                );
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.status(201).json({ message: `Se cargaron ${matchesData.length} partidos correctamente.` });

    } catch (error) {
        console.error('Error en la carga por lotes:', error);
const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: 'Error interno del servidor.', error: errorMessage });
    }
});

// --- FIN: LÓGICA DE CARGA RÁPIDA ---

// 5. Iniciar el servidor (SIEMPRE AL FINAL)
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});