const db = require('../storage/sqlite');

function upsertVisitor(visitorId) {
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO visitors (
        visitor_id,
        first_seen_at,
        last_seen_at,
        total_sessions,
        current_intent_score,
        current_status
      )
      VALUES (?, ?, ?, 0, 0, 'cold')
      ON CONFLICT(visitor_id)
      DO UPDATE SET
        last_seen_at = excluded.last_seen_at
    `;

    db.run(sql, [visitorId, now, now], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function incrementVisitorSessionCount(visitorId) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE visitors
      SET total_sessions = total_sessions + 1
      WHERE visitor_id = ?
      `,
      [visitorId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function updateVisitorIntent(visitorId, intentScore, status) {
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE visitors
      SET current_intent_score = ?,
          current_status = ?,
          last_seen_at = ?
      WHERE visitor_id = ?
      `,
      [intentScore, status, now, visitorId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

module.exports = {
  upsertVisitor,
  incrementVisitorSessionCount,
  updateVisitorIntent,
};
