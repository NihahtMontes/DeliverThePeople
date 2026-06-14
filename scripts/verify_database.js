const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function verifyDatabase() {
  console.log('🔍 Verificando base de datos...\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL\n');

    // 1. Verificar tablas
    console.log('📊 Tablas en la base de datos:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   Total de tablas: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    console.log();

    // 2. Verificar sucursales
    console.log('🏢 Sucursales:');
    const sucursalesResult = await client.query('SELECT * FROM sucursales');
    sucursalesResult.rows.forEach(row => {
      console.log(`   - ${row.nombre} (${row.activa ? 'Activa' : 'Inactiva'})`);
    });
    console.log();

    // 3. Verificar empleados
    console.log('👥 Empleados:');
    const empleadosResult = await client.query(`
      SELECT id, email, nombre, apellido, rol, estado 
      FROM empleados
    `);
    empleadosResult.rows.forEach(row => {
      console.log(`   - ${row.nombre} ${row.apellido} | ${row.email} | Rol: ${row.rol} | Estado: ${row.estado}`);
    });
    console.log();

    // 4. Verificar pedidos
    console.log('📦 Pedidos:');
    const pedidosResult = await client.query(`
      SELECT id, numero_pedido, nombre_cliente, estado 
      FROM pedidos
    `);
    pedidosResult.rows.forEach(row => {
      console.log(`   - Pedido #${row.numero_pedido} | Cliente: ${row.nombre_cliente} | Estado: ${row.estado}`);
    });
    console.log();

    // 5. Verificar inventario
    console.log('📦 Inventario:');
    const inventarioResult = await client.query(`
      SELECT nombre, categoria, cantidad_actual, unidad 
      FROM inventario
    `);
    inventarioResult.rows.forEach(row => {
      console.log(`   - ${row.nombre} (${row.categoria}): ${row.cantidad_actual} ${row.unidad}`);
    });
    console.log();

    // 6. Verificar equipos
    console.log('🔧 Equipos:');
    const equiposResult = await client.query(`
      SELECT nombre, tipo, estado 
      FROM equipos
    `);
    equiposResult.rows.forEach(row => {
      console.log(`   - ${row.nombre} (${row.tipo}) | Estado: ${row.estado}`);
    });
    console.log();

    // 7. Verificar ENUMs
    console.log('📋 Tipos ENUM creados:');
    const enumsResult = await client.query(`
      SELECT t.typname AS enum_name, 
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    enumsResult.rows.forEach(row => {
      console.log(`   - ${row.enum_name}: ${row.enum_values.join(', ')}`);
    });
    console.log();

    // 8. Verificar índices
    console.log('📇 Índices principales:');
    const indicesResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    indicesResult.rows.forEach(row => {
      console.log(`   - ${row.indexname} (Tabla: ${row.tablename})`);
    });
    console.log();

    console.log('✅✅✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE ✅✅✅');
    console.log(`\n📊 Resumen: ${tablesResult.rows.length} tablas, ${empleadosResult.rows.length} empleados, ${pedidosResult.rows.length} pedidos creados`);
    
    client.release();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verifica que el proyecto de Supabase esté activo');
    console.log('   2. Verifica que la contraseña sea correcta');
    console.log('   3. Verifica que tengas conexión a internet');
    console.log('   4. Si el proyecto se pausó, reactivalo desde el dashboard de Supabase');
  } finally {
    await pool.end();
  }
}

verifyDatabase();
