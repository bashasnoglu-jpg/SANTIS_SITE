const db = require('../storage/sqlite');
const crypto = require('crypto');

function uuid(){
    return crypto.randomUUID();
}

function appendEvent(event){
    return new Promise((resolve,reject)=>{
        const sql = `
        INSERT INTO telemetry_events
        VALUES(?,?,?,?,?,?,?, ?, CURRENT_TIMESTAMP)
        `;

        db.run(sql,[
            uuid(),
            event.type,
            event.visitorId,
            event.sessionId,
            event.page,
            event.source || 'frontend',
            JSON.stringify(event.data),
            event.timestamp
        ],(err)=>{
            if(err){
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    appendEvent
};
