const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://santis:sovereign_password@localhost:5432/santis_db',
});

// Simple query wrapper
module.exports = {
    query: (text, params) => pool.query(text, params),
    getPool: () => pool
};
