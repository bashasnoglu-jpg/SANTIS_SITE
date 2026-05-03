import db from '../storage/sqlite.js';

function ensureSession({ sessionId, visitorId, entryPage, deviceType, userAgent }) {
  const startedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO sessions (
        session_id,
        visitor_id,
        started_at,
        entry_page,
        device_type,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO NOTHING
    `;

    db.run(
      sql,
      [sessionId, visitorId, startedAt, entryPage || null, deviceType || null, userAgent || null],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function endSession({ sessionId, exitPage }) {
  const endedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const selectSql = `SELECT started_at FROM sessions WHERE session_id = ?`;

    db.get(selectSql, [sessionId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve();

      const durationSeconds = Math.max(
        0,
        Math.floor((new Date(endedAt) - new Date(row.started_at)) / 1000)
      );

      const updateSql = `
        UPDATE sessions
        SET ended_at = ?,
            exit_page = ?,
            duration_seconds = ?
        WHERE session_id = ?
      `;

      db.run(updateSql, [endedAt, exitPage || null, durationSeconds, sessionId], (updateErr) => {
        if (updateErr) return reject(updateErr);
        resolve();
      });
    });
  });
}

export {
  ensureSession,
  endSession,
};
