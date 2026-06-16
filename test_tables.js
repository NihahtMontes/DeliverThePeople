require('dotenv').config({path: './.env'});
const {pool} = require('./server/config/db');

async function testControllers() {
  try {
    console.log('=== PROBANDO CONTROLLERS ===\n');
    
    const tests = [
      { name: 'pedidos', sql: 'SELECT id FROM pedidos LIMIT 1' },
      { name: 'incidencias', sql: 'SELECT id FROM incidencias LIMIT 1' },
      { name: 'pagos', sql: 'SELECT id FROM pagos LIMIT 1' },
      { name: 'mensajes_cliente', sql: 'SELECT id FROM mensajes_cliente LIMIT 1' },
      { name: 'horarios_asistencias', sql: 'SELECT id FROM horarios_asistencias LIMIT 1' },
      { name: 'tareas', sql: 'SELECT id FROM tareas LIMIT 1' },
      { name: 'areas', sql: 'SELECT id FROM areas LIMIT 1' },
      { name: 'empleados', sql: 'SELECT id FROM empleados LIMIT 1' },
      { name: 'equipos', sql: 'SELECT id FROM equipos LIMIT 1' },
      { name: 'inventario', sql: 'SELECT id FROM inventario LIMIT 1' },
      { name: 'mantenimientos', sql: 'SELECT id FROM mantenimientos LIMIT 1' },
    ];
    
    for (const test of tests) {
      try {
        await pool.query(test.sql);
        console.log(`✅ ${test.name}: OK`);
      } catch (e) {
        console.log(`❌ ${test.name}: ${e.message}`);
      }
    }
    
  } catch(e) {
    console.log('Error general:', e.message);
  }
  pool.end();
}

testControllers();
