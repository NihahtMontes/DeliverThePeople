require('dotenv').config({path: './.env'});
const {pool} = require('../server/config/db');

async function check() {
  try {
    console.log('=== COLUMNAS DE TABLAS ===');
    
    const tables = ['pedidos', 'items_pedido', 'historial_pedido', 'ingredientes_item', 'pagos', 'mensajes_cliente', 'horarios_asistencias', 'tareas', 'areas', 'incidencias'];
    
    for (const table of tables) {
      try {
        const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`\n${table}:`, r.rows.map(x => x.column_name).join(', '));
      } catch(e) {
        console.log(`\n${table}: ERROR - ${e.message}`);
      }
    }
    
  } catch(e) {
    console.log('Error:', e.message);
  }
  pool.end();
}

check();
