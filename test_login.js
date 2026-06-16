require('dotenv').config({path: './.env'});
const {pool} = require('./server/config/db');
const bcrypt = require('./server/node_modules/bcryptjs');

async function test() {
  try {
    const r = await pool.query("SELECT email, password_hash FROM empleados WHERE email = 'admin@dtp.com'");
    const user = r.rows[0];
    console.log('Email:', user.email);
    console.log('Hash:', user.password_hash);
    
    const valid = await bcrypt.compare('contra123', user.password_hash);
    console.log('contra123 válida:', valid);
    
    const valid2 = await bcrypt.compare('password123', user.password_hash);
    console.log('password123 válida:', valid2);
  } catch(e) {
    console.log('Error:', e.message);
  }
  pool.end();
}

test();
