/**
 * Script de verificación de integración completa
 * Prueba TODOS los módulos: Nihaht, Sandro, Danilo, Rocket
 */

const http = require('http');

const API_URL = 'http://localhost:3001';
let token = '';

function makeRequest(method, path, data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testIntegration() {
  console.log('🔍 VERIFICACIÓN DE INTEGRACIÓN COMPLETA\n');
  console.log('=====================================\n');

  const results = { passed: 0, failed: 0, tests: [] };

  function check(name, status, expected) {
    const passed = status === expected;
    results.tests.push({ name, status, expected, passed });
    if (passed) results.passed++; else results.failed++;
    console.log(`${passed ? '✅' : '❌'} ${name} (Status: ${status}, Expected: ${expected})`);
    return passed;
  }

  try {
    // 1. HEALTH CHECK
    console.log('1️⃣  HEALTH CHECK');
    const health = await makeRequest('GET', '/api/health');
    check('Servidor responde', health.status, 200);
    console.log('');

    // 2. AUTH (LOGIN)
    console.log('2️⃣  AUTENTICACIÓN');
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@deliver.com',
      password: 'password123'
    });
    check('Login admin', login.status, 200);
    if (login.status === 200) {
      token = login.data.token;
      check('Token recibido', !!token, true);
    }
    console.log('');

    // 3. MÓDULO ROCKET (RRHH)
    console.log('3️⃣  MÓDULO ROCKET - RECURSOS HUMANOS');
    const empleados = await makeRequest('GET', '/api/empleados', null, token);
    check('GET /api/empleados', empleados.status, 200);
    
    const horarios = await makeRequest('GET', '/api/horarios-asistencias', null, token);
    check('GET /api/horarios-asistencias', horarios.status, 200);
    
    const tareas = await makeRequest('GET', '/api/tareas', null, token);
    check('GET /api/tareas', tareas.status, 200);
    
    const areas = await makeRequest('GET', '/api/areas', null, token);
    check('GET /api/areas', areas.status, 200);
    
    const rrhhIncidencias = await makeRequest('GET', '/api/rrhh/incidencias', null, token);
    check('GET /api/rrhh/incidencias', rrhhIncidencias.status, 200);
    console.log('');

    // 4. MÓDULO NIHAHT (COCINA)
    console.log('4️⃣  MÓDULO NIHAHT - COCINA');
    const pedidos = await makeRequest('GET', '/api/pedidos', null, token);
    check('GET /api/pedidos', pedidos.status, 200);
    
    const cola = await makeRequest('GET', '/api/pedidos/cola', null, token);
    check('GET /api/pedidos/cola', cola.status, 200);
    
    const incidencias = await makeRequest('GET', '/api/incidencias', null, token);
    check('GET /api/incidencias', incidencias.status, 200);
    console.log('');

    // 5. MÓDULO SANDRO (OPERACIONES)
    console.log('5️⃣  MÓDULO SANDRO - OPERACIONES');
    const equipos = await makeRequest('GET', '/api/equipos', null, token);
    check('GET /api/equipos', equipos.status, 200);
    
    const inventario = await makeRequest('GET', '/api/inventario', null, token);
    check('GET /api/inventario', inventario.status, 200);
    
    const mantenimientos = await makeRequest('GET', '/api/mantenimientos', null, token);
    check('GET /api/mantenimientos', mantenimientos.status, 200);
    console.log('');

    // 6. MÓDULO DANILO (DELIVERY)
    console.log('6️⃣  MÓDULO DANILO - DELIVERY');
    const pagos = await makeRequest('GET', '/api/pagos', null, token);
    check('GET /api/pagos', pagos.status, 200);
    
    const mensajes = await makeRequest('GET', '/api/mensajes', null, token);
    check('GET /api/mensajes', mensajes.status, 200);
    console.log('');

    // 7. RESUMEN
    console.log('=====================================');
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('=====================================');
    console.log(`✅ Tests pasados: ${results.passed}`);
    console.log(`❌ Tests fallidos: ${results.failed}`);
    console.log(`📈 Total: ${results.passed + results.failed}`);
    console.log('');
    
    if (results.failed === 0) {
      console.log('🎉🎉🎉 INTEGRACIÓN COMPLETA Y FUNCIONAL 🎉🎉🎉');
      console.log('');
      console.log('✅ Todos los módulos están integrados:');
      console.log('   • Nihaht (Cocina): Pedidos, Cola, Incidencias');
      console.log('   • Sandro (Operaciones): Equipos, Inventario, Mantenimiento');
      console.log('   • Danilo (Delivery): Pagos, Mensajes');
      console.log('   • Rocket (RRHH): Empleados, Horarios, Tareas, Áreas, Incidencias');
    } else {
      console.log('⚠️ Algunos tests fallaron. Revisar arriba.');
    }

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.log('\n💡 Verifica que:');
    console.log('   1. El servidor esté corriendo (node server.js)');
    console.log('   2. La base de datos esté conectada');
  }
}

testIntegration();
