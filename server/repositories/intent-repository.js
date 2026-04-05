const db = require('../storage/sqlite');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function insertIntentSignal(signal) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO intent_signals (
        id,
        visitor_id,
        session_id,
        signal_type,
        score,
        confidence,
        page_path,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        uuid(),
        signal.visitorId,
        signal.sessionId,
        signal.signalType,
        signal.score,
        signal.confidence,
        signal.pagePath || null,
        signal.createdAt || new Date().toISOString(),
      ],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

module.exports = {
  insertIntentSignal,
};
