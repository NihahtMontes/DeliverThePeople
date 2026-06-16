require('dotenv').config({path: '../.env'});
const {pool} = require('./config/db');

async function test() {
  try {
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos'");
    console.log('Columnas de pedidos:', r.rows.map(x => x.column_name).join(', '));
  } catch(e) {
    console.log('Error:', e.message);
  }
  pool.end();
}

test();
