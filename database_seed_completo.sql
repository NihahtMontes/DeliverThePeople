-- =============================================================================
-- DeliverThePeople — Seed Completo (Datos de Prueba para todo el equipo)
-- =============================================================================
-- Ejecutar TODO este archivo en el SQL Editor de Supabase DESPUES del esquema
-- =============================================================================

-- =============================================================================
-- 1. SUCURSALES
-- =============================================================================
INSERT INTO public.sucursales (nombre, direccion, telefono, estado) VALUES
('Sucursal Centro', 'Av. Principal 123, Centro', '555-0101', 'activo'),
('Sucursal Norte', 'Calle Norte 456, Zona Norte', '555-0102', 'activo'),
('Sucursal Sur', 'Av. Sur 789, Zona Sur', '555-0103', 'activo')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. EMPLEADOS (con hash bcrypt de 'contra123')
-- Hash: $2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi
-- =============================================================================
INSERT INTO public.empleados (email, password_hash, nombre, apellido, rol, sucursal_id, estado) VALUES
('admin@dtp.com', '$2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi', 'Admin', 'Sistema', 'admin', (SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'activo'),
('gerente@dtp.com', '$2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi', 'Maria', 'Lopez', 'gerente', (SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'activo'),
('cocinero@dtp.com', '$2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi', 'Carlos', 'Perez', 'cocinero', (SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'activo'),
('tecnico@dtp.com', '$2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi', 'Luis', 'Garcia', 'tecnico', (SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'activo'),
('despachador@dtp.com', '$2a$10$WL/e1nQGYrB59rUKTd9o2eFK5g9u2GKYSmkKGCt1Xavs1JeswaIBi', 'Carlos', 'Martinez', 'despachador', (SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'activo')
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 3. EQUIPOS
-- =============================================================================
INSERT INTO public.equipos (sucursal_id, nombre, tipo, marca, modelo, numero_serie, estado, fecha_compra) VALUES
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Horno Industrial 1', 'horno', 'HornoPro', 'H-2000', 'HOR-2023-001', 'OPERATIVO', '2023-01-15'),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Refrigerador Principal', 'refrigerador', 'CoolMax', 'R-500', 'REF-2023-002', 'OPERATIVO', '2023-02-20'),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Freidora Doble', 'freidora', 'FryMaster', 'F-100', 'FRE-2023-003', 'OPERATIVO', '2023-03-10')
ON CONFLICT (numero_serie) DO NOTHING;

-- =============================================================================
-- 4. AREAS
-- =============================================================================
INSERT INTO public.areas (sucursal_id, nombre, descripcion) VALUES
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Cocina Principal', 'Area principal de preparacion'),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Zona de Delivery', 'Area de despacho y entregas'),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Almacen', 'Area de almacenamiento');

-- =============================================================================
-- 5. INVENTARIO
-- =============================================================================
INSERT INTO public.inventario (sucursal_id, nombre, categoria, cantidad_actual, unidad, stock_minimo, costo_unitario, activo) VALUES
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Harina de Trigo', 'seco', 150.00, 'kg', 50.00, 1.50, true),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Queso Mozzarella', 'lacteo', 45.00, 'kg', 20.00, 8.90, true),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Tomate Fresco', 'verdura', 80.00, 'kg', 30.00, 2.50, true),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Pollo Entero', 'carnico', 60.00, 'kg', 25.00, 6.50, true),
((SELECT id FROM public.sucursales WHERE nombre = 'Sucursal Centro'), 'Coca-Cola 2L', 'bebida', 120.00, 'unidades', 40.00, 2.80, true);

-- =============================================================================
-- 6. PEDIDOS (en diferentes estados para probar todos los CUs)
-- =============================================================================
-- Pedido 1: PENDIENTE
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'admin@dtp.com'), 'Mesa 1', 'PENDIENTE', 45.00, 20
FROM public.sucursales LIMIT 1;

-- Pedido 2: PENDIENTE
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'admin@dtp.com'), 'Mesa 2', 'PENDIENTE', 32.50, 25
FROM public.sucursales LIMIT 1;

-- Pedido 3: EN_PREPARACION
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'), 'Mesa 3', 'EN_PREPARACION', 28.00, 15
FROM public.sucursales LIMIT 1;

-- Pedido 4: EN_PREPARACION
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'), 'Mesa 4', 'EN_PREPARACION', 55.00, 30
FROM public.sucursales LIMIT 1;

-- Pedido 5: TERMINADO (listo para entregar)
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'), 'Mesa 5', 'TERMINADO', 40.00, 20
FROM public.sucursales LIMIT 1;

-- Pedido 6: TERMINADO (listo para entregar)
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'), 'Mesa 6', 'TERMINADO', 22.00, 15
FROM public.sucursales LIMIT 1;

-- Pedido 7: ENTREGADO (historial)
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'despachador@dtp.com'), 'Mesa 7', 'ENTREGADO', 60.00, 20
FROM public.sucursales LIMIT 1;

-- Pedido 8: CANCELADO
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'admin@dtp.com'), 'Mesa 8', 'CANCELADO', 18.00, 20
FROM public.sucursales LIMIT 1;

-- Pedido 9: RETRASADO
INSERT INTO public.pedidos (sucursal_id, empleado_id, mesa, estado, total, tiempo_estimado_min)
SELECT id, (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'), 'Mesa 9', 'RETRASADO', 35.00, 10
FROM public.sucursales LIMIT 1;

-- =============================================================================
-- 7. ITEMS DE PEDIDO
-- =============================================================================
-- Items del Pedido 1 (PENDIENTE - Mesa 1)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 1' AND estado = 'PENDIENTE' LIMIT 1),
  (SELECT id FROM public.inventario LIMIT 1),
  2, 15.00;

INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 1' AND estado = 'PENDIENTE' LIMIT 1),
  (SELECT id FROM public.inventario OFFSET 1 LIMIT 1),
  1, 15.00;

-- Items del Pedido 2 (PENDIENTE - Mesa 2)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 2' AND estado = 'PENDIENTE' LIMIT 1),
  (SELECT id FROM public.inventario LIMIT 1),
  1, 22.50;

-- Items del Pedido 3 (EN_PREPARACION - Mesa 3)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 3' AND estado = 'EN_PREPARACION' LIMIT 1),
  (SELECT id FROM public.inventario LIMIT 1),
  1, 28.00;

-- Items del Pedido 5 (TERMINADO - Mesa 5)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 5' AND estado = 'TERMINADO' LIMIT 1),
  (SELECT id FROM public.inventario LIMIT 1),
  2, 20.00;

-- Items del Pedido 6 (TERMINADO - Mesa 6)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 6' AND estado = 'TERMINADO' LIMIT 1),
  (SELECT id FROM public.inventario OFFSET 1 LIMIT 1),
  1, 22.00;

-- Items del Pedido 7 (ENTREGADO - Mesa 7)
INSERT INTO public.items_pedido (pedido_id, item_id, cantidad, precio_unitario)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 7' AND estado = 'ENTREGADO' LIMIT 1),
  (SELECT id FROM public.inventario LIMIT 1),
  3, 20.00;

-- =============================================================================
-- 8. MENSAJES DE PRUEBA (Chat por pedido)
-- =============================================================================
-- Mensaje general (sin pedido)
INSERT INTO public.mensajes_cliente (sucursal_id, mensaje, created_at)
SELECT id, 'Bienvenido a DeliverThePeople! Su pedido esta siendo preparado.', NOW()
FROM public.sucursales LIMIT 1;

-- Mensaje para pedido TERMINADO (Mesa 5)
INSERT INTO public.mensajes_cliente (sucursal_id, pedido_id, mensaje, created_at)
SELECT 
  id,
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 5' AND estado = 'TERMINADO' LIMIT 1),
  'Su pedido de la Mesa 5 esta listo y saldra para delivery en 5 minutos.',
  NOW() - INTERVAL '5 minutes'
FROM public.sucursales LIMIT 1;

-- Mensaje para pedido ENTREGADO (Mesa 7)
INSERT INTO public.mensajes_cliente (sucursal_id, pedido_id, mensaje, created_at)
SELECT 
  id,
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 7' AND estado = 'ENTREGADO' LIMIT 1),
  'El repartidor esta en camino. Tiempo estimado: 15 minutos.',
  NOW() - INTERVAL '10 minutes'
FROM public.sucursales LIMIT 1;

INSERT INTO public.mensajes_cliente (sucursal_id, pedido_id, mensaje, created_at)
SELECT 
  id,
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 7' AND estado = 'ENTREGADO' LIMIT 1),
  'Pedido entregado. Gracias por preferirnos!',
  NOW() - INTERVAL '30 minutes'
FROM public.sucursales LIMIT 1;

-- =============================================================================
-- 9. PAGOS DE PRUEBA
-- =============================================================================
-- Pago del pedido ENTREGADO (Mesa 7)
INSERT INTO public.pagos (pedido_id, monto, metodo, estado, registrado_por)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 7' AND estado = 'ENTREGADO' LIMIT 1),
  60.00, 'efectivo', 'completado',
  (SELECT id FROM public.empleados WHERE email = 'despachador@dtp.com');

-- Pago del pedido TERMINADO (Mesa 5)
INSERT INTO public.pagos (pedido_id, monto, metodo, estado, registrado_por)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 5' AND estado = 'TERMINADO' LIMIT 1),
  20.00, 'tarjeta', 'completado',
  (SELECT id FROM public.empleados WHERE email = 'despachador@dtp.com');

-- Pago del pedido EN_PREPARACION (Mesa 3)
INSERT INTO public.pagos (pedido_id, monto, metodo, estado, registrado_por)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 3' AND estado = 'EN_PREPARACION' LIMIT 1),
  28.00, 'transferencia', 'completado',
  (SELECT id FROM public.empleados WHERE email = 'admin@dtp.com');

-- =============================================================================
-- 10. HISTORIAL DE PEDIDO
-- =============================================================================
INSERT INTO public.historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 3' AND estado = 'EN_PREPARACION' LIMIT 1),
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  'PENDIENTE', 'EN_PREPARACION';

INSERT INTO public.historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 5' AND estado = 'TERMINADO' LIMIT 1),
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  'EN_PREPARACION', 'TERMINADO';

INSERT INTO public.historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 7' AND estado = 'ENTREGADO' LIMIT 1),
  (SELECT id FROM public.empleados WHERE email = 'despachador@dtp.com'),
  'TERMINADO', 'ENTREGADO';

INSERT INTO public.historial_pedido (pedido_id, empleado_id, estado_anterior, estado_nuevo)
SELECT 
  (SELECT id FROM public.pedidos WHERE mesa = 'Mesa 8' AND estado = 'CANCELADO' LIMIT 1),
  (SELECT id FROM public.empleados WHERE email = 'admin@dtp.com'),
  'PENDIENTE', 'CANCELADO';

-- =============================================================================
-- 11. TAREAS DE PRUEBA
-- =============================================================================
INSERT INTO public.tareas (sucursal_id, empleado_id, titulo, estado)
SELECT 
  id,
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  'Preparar ingredientes del dia',
  'PENDIENTE'
FROM public.sucursales LIMIT 1;

INSERT INTO public.tareas (sucursal_id, empleado_id, titulo, estado)
SELECT 
  id,
  (SELECT id FROM public.empleados WHERE email = 'tecnico@dtp.com'),
  'Revisar horno industrial',
  'PENDIENTE'
FROM public.sucursales LIMIT 1;

-- =============================================================================
-- 12. INCIDENCIAS DE PRUEBA
-- =============================================================================
INSERT INTO public.incidencias (sucursal_id, empleado_id, descripcion, estado, tipo, prioridad)
SELECT 
  id,
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  'Falta queso mozzarella en la cocina',
  'ABIERTA',
  'falta_insumo',
  'ALTA'
FROM public.sucursales LIMIT 1;

-- =============================================================================
-- 13. MANTENIMIENTOS DE PRUEBA
-- =============================================================================
INSERT INTO public.mantenimientos (equipo_id, solicitante_id, tecnico_id, descripcion_falla, estado_ticket)
SELECT 
  (SELECT id FROM public.equipos WHERE numero_serie = 'REF-2023-002'),
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  (SELECT id FROM public.empleados WHERE email = 'tecnico@dtp.com'),
  'El refrigerador no enfria correctamente',
  'PENDIENTE';

-- =============================================================================
-- 14. HORARIOS DE PRUEBA
-- =============================================================================
INSERT INTO public.horarios_asistencias (empleado_id, fecha, hora_entrada, hora_salida)
SELECT 
  (SELECT id FROM public.empleados WHERE email = 'despachador@dtp.com'),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '8 hours',
  CURRENT_DATE + INTERVAL '17 hours';

INSERT INTO public.horarios_asistencias (empleado_id, fecha, hora_entrada, hora_salida)
SELECT 
  (SELECT id FROM public.empleados WHERE email = 'cocinero@dtp.com'),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '8 hours 10 minutes',
  CURRENT_DATE + INTERVAL '17 hours';

-- =============================================================================
-- VERIFICACION
-- =============================================================================
SELECT '=== DATOS INSERTADOS ===' as verificacion;
SELECT 'Sucursales: ' || COUNT(*) FROM public.sucursales;
SELECT 'Empleados: ' || COUNT(*) FROM public.empleados;
SELECT 'Equipos: ' || COUNT(*) FROM public.equipos;
SELECT 'Areas: ' || COUNT(*) FROM public.areas;
SELECT 'Inventario: ' || COUNT(*) FROM public.inventario;
SELECT 'Pedidos: ' || COUNT(*) FROM public.pedidos;
SELECT 'Items de Pedido: ' || COUNT(*) FROM public.items_pedido;
SELECT 'Mensajes: ' || COUNT(*) FROM public.mensajes_cliente;
SELECT 'Pagos: ' || COUNT(*) FROM public.pagos;
SELECT 'Historial: ' || COUNT(*) FROM public.historial_pedido;
SELECT 'Tareas: ' || COUNT(*) FROM public.tareas;
SELECT 'Incidencias: ' || COUNT(*) FROM public.incidencias;
SELECT 'Mantenimientos: ' || COUNT(*) FROM public.mantenimientos;
SELECT 'Horarios: ' || COUNT(*) FROM public.horarios_asistencias;
