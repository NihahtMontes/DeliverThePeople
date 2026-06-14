const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function getEnums() {
  try {
    const res = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'enum_tipo_solicitud';
    `);
    console.log('Valores validos para enum_tipo_solicitud:', res.rows.map(r => r.enumlabel));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
getEnums();
