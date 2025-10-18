const pool = require('./db');

async function calculateMatchPoints(matchId, client) {
  console.log(`Calculando puntos para el partido ${matchId}...`);

  // 1. Obtener el resultado real del partido
  const matchResultQuery = 'SELECT result_local, result_visitor FROM matches WHERE id = $1';
  const matchResult = await client.query(matchResultQuery, [matchId]);

  if (matchResult.rows.length === 0) {
    console.warn(`Partido ${matchId} no encontrado.`);
    return;
  }

  const realMatch = matchResult.rows[0];
  const realLocal = realMatch.result_local;
  const realVisitor = realMatch.result_visitor;

  // Si el resultado real no está cargado, no se pueden calcular puntos
  if (realLocal === null || realVisitor === null) {
    console.log(`Resultado real para el partido ${matchId} aún no cargado. Saltando cálculo de puntos.`);
    return;
  }

  let realOutcome;
  if (realLocal > realVisitor) {
    realOutcome = 'L'; // Local
  } else if (realVisitor > realLocal) {
    realOutcome = 'V'; // Visitante
  } else {
    realOutcome = 'E'; // Empate
  }

  // 2. Obtener todas las predicciones para este partido
  const predictionsQuery = 'SELECT id, user_id, prediction_main, predicted_score_local, predicted_score_visitor FROM predictions WHERE match_id = $1';
  const predictionsResult = await client.query(predictionsQuery, [matchId]);

  // 3. Calcular puntos para cada predicción
  for (const pred of predictionsResult.rows) {
    let points = 0;

    // Puntos por acertar el resultado principal (L/E/V)
    if (pred.prediction_main === realOutcome) {
      points += 1;

      // Puntos extra por acertar el resultado exacto (si aplica)
      if (pred.predicted_score_local === realLocal && pred.predicted_score_visitor === realVisitor) {
        points += 2;
      }
    }

    // 4. Actualizar los puntos obtenidos en la predicción
    await client.query('UPDATE predictions SET points_obtained = $1 WHERE id = $2', [points, pred.id]);

    // 5. Actualizar el total de puntos del usuario (esto podría ser más eficiente con un trigger o un cálculo batch)
    // Por simplicidad, lo actualizamos aquí. Asegurarse de que total_points en users sea la suma de points_obtained
    await client.query(`
      UPDATE users
      SET total_points = (
        SELECT COALESCE(SUM(points_obtained), 0)
        FROM predictions
        WHERE user_id = $1
      )
      WHERE id = $1;
    `, [pred.user_id]);
  }

  console.log(`Puntos calculados y actualizados para el partido ${matchId}.`);
}

module.exports = { calculateMatchPoints };
