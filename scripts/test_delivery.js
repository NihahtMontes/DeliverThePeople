/**
 * Script de prueba para el módulo de Delivery (CU9-CU12)
 * Ejecutar desde tu computadora con el servidor corriendo en localhost:3001
 * 
 * Comando: node scripts/test_delivery.js
 */

const http = require('http');

const API_URL = 'http://localhost:3001';
let token = '';

// Función para hacer requests HTTP
function makeRequest(method, path, data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testDeliveryModule() {
  console.log('🧪 INICIANDO PRUEBAS DEL MÓDULO DE DELIVERY\n');
  console.log('===========================================\n');

  try {
    // 1. Verificar que el servidor está corriendo
    console.log('1️⃣ Verificando servidor...');
    const health = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Respuesta:`, health.data);
    console.log('');

    // 2. Login como Danilo
    console.log('2️⃣ Haciendo login como Danilo (despachador)...');
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'danilo@deliver.com',
      password: 'password123'
    });
    console.log(`   Status: ${login.status}`);
    
    if (login.status !== 200) {
      console.log('   ❌ Login falló:', login.data);
      console.log('\n💡 Si el login falla, verifica que el empleado existe en la base de datos.');
      return;
    }

    token = login.data.token;
    console.log(`   ✅ Login exitoso!`);
    console.log(`   Usuario: ${login.data.user.nombre} ${login.data.user.apellido}`);
    console.log(`   Rol: ${login.data.user.rol}`);
    console.log('');

    // 3. Ver pedidos listos para delivery (CU9a)
    console.log('3️⃣ CU9a - Obteniendo pedidos listos para delivery...');
    const listos = await makeRequest('GET', '/api/delivery/pedidos-listos', null, token);
    console.log(`   Status: ${listos.status}`);
    console.log(`   Pedidos encontrados: ${listos.data.pedidos?.length || 0}`);
    if (listos.data.pedidos?.length > 0) {
      console.log(`   Primer pedido: #${listos.data.pedidos[0].numero_pedido} - ${listos.data.pedidos[0].nombre_cliente}`);
    }
    console.log('');

    // 4. Ver pedidos en delivery
    console.log('4️⃣ Obteniendo pedidos en delivery...');
    const enDelivery = await makeRequest('GET', '/api/delivery/pedidos-en-delivery', null, token);
    console.log(`   Status: ${enDelivery.status}`);
    console.log(`   Pedidos encontrados: ${enDelivery.data.pedidos?.length || 0}`);
    if (enDelivery.data.pedidos?.length > 0) {
      console.log(`   Primer pedido: #${enDelivery.data.pedidos[0].numero_pedido} - ${enDelivery.data.pedidos[0].nombre_cliente}`);
    }
    console.log('');

    // 5. Enviar pedido a delivery (CU9a) - Solo si hay pedidos terminados
    if (listos.data.pedidos?.length > 0) {
      const pedidoId = listos.data.pedidos[0].id;
      console.log(`5️⃣ CU9a - Enviando pedido ${pedidoId} a delivery...`);
      const enviar = await makeRequest('PUT', `/api/delivery/${pedidoId}/enviar`, {}, token);
      console.log(`   Status: ${enviar.status}`);
      console.log(`   Respuesta:`, enviar.data);
      console.log('');
    }

    // 6. Ver historial de un pedido
    console.log('6️⃣ Ver historial de pedidos...');
    const historial = await makeRequest('GET', '/api/delivery/pedidos-listos', null, token);
    if (historial.data.pedidos?.length > 0) {
      const pedidoId = historial.data.pedidos[0].id;
      const hist = await makeRequest('GET', `/api/delivery/${pedidoId}/historial`, null, token);
      console.log(`   Status: ${hist.status}`);
      console.log(`   Registros: ${hist.data.historial?.length || 0}`);
    }
    console.log('');

    // 7. Enviar mensaje a cliente (CU10)
    console.log('7️⃣ CU10 - Enviando mensaje al cliente...');
    if (listos.data.pedidos?.length > 0) {
      const pedidoId = listos.data.pedidos[0].id;
      const mensaje = await makeRequest('POST', `/api/delivery/${pedidoId}/mensajes`, {
        mensaje: 'Su pedido está en camino! Llegaremos en 15 minutos.'
      }, token);
      console.log(`   Status: ${mensaje.status}`);
      console.log(`   Respuesta:`, mensaje.data);
    }
    console.log('');

    // 8. Registrar pago (CU11)
    console.log('8️⃣ CU11 - Registrando pago...');
    if (listos.data.pedidos?.length > 0) {
      const pedidoId = listos.data.pedidos[0].id;
      const pago = await makeRequest('POST', `/api/delivery/${pedidoId}/pagos`, {
        monto: 25.50,
        metodo: 'efectivo'
      }, token);
      console.log(`   Status: ${pago.status}`);
      console.log(`   Respuesta:`, pago.data);
    }
    console.log('');

    // 9. Ver todos los pagos
    console.log('9️⃣ Ver todos los pagos registrados...');
    const pagos = await makeRequest('GET', '/api/delivery/pagos', null, token);
    console.log(`   Status: ${pagos.status}`);
    console.log(`   Pagos encontrados: ${pagos.data.pagos?.length || 0}`);
    console.log('');

    console.log('===========================================');
    console.log('✅ PRUEBAS COMPLETADAS');
    console.log('===========================================');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Verifica que:');
    console.log('   1. El servidor esté corriendo (node server.js)');
    console.log('   2. El servidor esté en http://localhost:3001');
    console.log('   3. La base de datos tenga datos de prueba');
  }
}

// Ejecutar pruebas
testDeliveryModule();
