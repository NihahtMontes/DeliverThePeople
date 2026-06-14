const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT) || 6543,
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = { pool };
