const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL?.trim();
const host = process.env.PGHOST?.trim() || process.env.DB_HOST?.trim();
const portValue = process.env.PGPORT?.trim() || process.env.DB_PORT?.trim();
const database = process.env.PGDATABASE?.trim() || process.env.DB_DATABASE?.trim();
const user = process.env.PGUSER?.trim() || process.env.DB_USER?.trim();
const password = process.env.PGPASSWORD ?? process.env.DB_PASSWORD;

if (!connectionString) {
  const missing = [];

  if (!host) missing.push('PGHOST o DB_HOST');
  if (!database) missing.push('PGDATABASE o DB_DATABASE');
  if (!user) missing.push('PGUSER o DB_USER');
  if (typeof password !== 'string' || password.length === 0) {
    missing.push('PGPASSWORD o DB_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuracion de base de datos incompleta en .env. Falta: ${missing.join(', ')}`
    );
  }
}

const port = Number.parseInt(portValue, 10);
const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host,
        port: Number.isNaN(port) ? 6543 : port,
        database,
        user,
        password,
        ssl: { rejectUnauthorized: false }
      }
);

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = { pool };
