-- =============================================================================
-- DeliverThePeople — Seeds: Datos de Prueba
-- =============================================================================
-- Ejecutar este archivo después de haber creado las tablas (00001_esquema_inicial.sql)
-- =============================================================================

-- =============================================================================
-- 1. SUCURSALES
-- =============================================================================
INSERT INTO sucursales (nombre, direccion, telefono, activa) VALUES
('Sucursal Centro', 'Av. Principal 123, Centro', '555-0101', true),
('Sucursal Norte', 'Calle Norte 456, Zona Norte', '555-0102', true),
('Sucursal Sur', 'Av. Sur 789, Zona Sur', '555-0103', true);

-- =============================================================================
-- 2. EMPLEADOS (Incluyendo a Danilo como despachador)
-- =============================================================================
-- Nota: Las contraseñas están hasheadas con bcrypt. 
-- Password por defecto para todos: 'password123'
-- Hash bcrypt: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO empleados (email, nombre, apellido, rol, sucursal_id, telefono, estado) VALUES
('admin@deliver.com', 'Administrador', 'Sistema', 'admin', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1001', 'activo'),
('gerente@deliver.com', 'Gerente', 'Principal', 'gerente', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1002', 'activo'),
('danilo@deliver.com', 'Danilo', 'Rojas', 'despachador', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1003', 'activo'),
('nihaht@deliver.com', 'Nihaht', 'Montes', 'cocinero', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1004', 'activo'),
('sandro@deliver.com', 'Sandro', 'Gomez', 'cocinero', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), '555-1005', 'activo'),
('camila@deliver.com', 'Camila', 'Diaz', 'gerente', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), '555-1006', 'activo'),
('fernando@deliver.com', 'Fernando', 'Lopez', 'cajero', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), '555-1007', 'activo'),
('santiago@deliver.com', 'Santiago', 'Ruiz', 'mantenimiento', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), '555-1008', 'activo'),
('cocinero2@deliver.com', 'Pedro', 'Martinez', 'cocinero', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), '555-1009', 'activo'),
('despachador2@deliver.com', 'Laura', 'Sanchez', 'despachador', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), '555-1010', 'activo'),
('aseo@deliver.com', 'Maria', 'Garcia', 'aseo', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1011', 'activo'),
('inactivo@deliver.com', 'Usuario', 'Inactivo', 'cajero', (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), '555-1012', 'inactivo');

-- =============================================================================
-- 3. EQUIPOS
-- =============================================================================
INSERT INTO equipos (sucursal_id, nombre, tipo, numero_serie, estado, fecha_compra) VALUES
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Horno Industrial 1', 'horno', 'HOR-2023-001', 'operativo', '2023-01-15'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Refrigerador Principal', 'refrigerador', 'REF-2023-002', 'operativo', '2023-02-20'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Freidora Doble', 'freidora', 'FRE-2023-003', 'operativo', '2023-03-10'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Horno Industrial 2', 'horno', 'HOR-2023-004', 'operativo', '2023-04-05'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Congelador Horizontal', 'congelador', 'CON-2023-005', 'requiere_mantenimiento', '2023-05-12'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Estufa 4 Quemadores', 'estufa', 'EST-2023-006', 'operativo', '2023-06-18'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Lavavajillas Industrial', 'lavavajillas', 'LAV-2023-007', 'fuera_de_servicio', '2023-07-22'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Batidora Planetaria', 'batidora', 'BAT-2023-008', 'operativo', '2023-08-30');

-- =============================================================================
-- 4. AREAS
-- =============================================================================
INSERT INTO areas (sucursal_id, nombre) VALUES
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Cocina Principal'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Zona de Delivery'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Almacén'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Cocina Norte'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Área de Limpieza'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Cocina Sur'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Mantenimiento');

-- =============================================================================
-- 5. INVENTARIO
-- =============================================================================
INSERT INTO inventario (sucursal_id, nombre, categoria, cantidad_actual, unidad, stock_minimo, costo_unitario, proveedor) VALUES
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Harina de Trigo', 'seco', 150.00, 'kg', 50.00, 1.50, 'Molinos del Valle'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Queso Mozzarella', 'lacteo', 45.00, 'kg', 20.00, 8.90, 'Lácteos La Granja'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Tomate Fresco', 'verdura', 80.00, 'kg', 30.00, 2.50, 'Hortalizas del Norte'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Pollo Entero', 'carnico', 60.00, 'kg', 25.00, 6.50, 'Avícola San Juan'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Coca-Cola 2L', 'bebida', 120.00, 'unidades', 40.00, 2.80, 'Coca-Cola Ecuador'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Jabón Industrial', 'limpieza', 25.00, 'litros', 10.00, 5.20, 'Químicos Limpieza'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Harina de Trigo', 'seco', 100.00, 'kg', 40.00, 1.50, 'Molinos del Valle'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Queso Mozzarella', 'lacteo', 30.00, 'kg', 15.00, 8.90, 'Lácteos La Granja'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Carne de Res', 'carnico', 40.00, 'kg', 20.00, 9.00, 'Carnicería El Toro'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Harina de Trigo', 'seco', 80.00, 'kg', 35.00, 1.50, 'Molinos del Valle'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Papas Frescas', 'verdura', 100.00, 'kg', 40.00, 1.20, 'Hortalizas del Norte'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Coca-Cola 2L', 'bebida', 90.00, 'unidades', 35.00, 2.80, 'Coca-Cola Ecuador');

-- =============================================================================
-- 6. PEDIDOS (Datos de prueba para delivery)
-- =============================================================================
-- Pedidos en diferentes estados para probar los CUs de Danilo

INSERT INTO pedidos (numero_pedido, sucursal_id, nombre_cliente, telefono_cliente, direccion_cliente, estado, cocinero_asignado_id, tiempo_estimado_entrega, notas) VALUES
(1001, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Juan Pérez', '099-123-4567', 'Calle A 123', 'pendiente', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), NOW() + INTERVAL '30 minutes', 'Sin cebolla'),
(1002, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'María González', '099-234-5678', 'Calle B 456', 'pendiente', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), NOW() + INTERVAL '45 minutes', 'Extra queso'),
(1003, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Carlos López', '099-345-6789', 'Av. Central 789', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), NOW() + INTERVAL '20 minutes', 'Llamar al llegar'),
(1004, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Ana Rodríguez', '099-456-7890', 'Calle C 321', 'terminado', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), NOW() + INTERVAL '15 minutes', 'Entregar en recepción'),
(1005, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Luis Martínez', '099-567-8901', 'Av. Norte 555', 'terminado', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), NOW() + INTERVAL '10 minutes', 'Cliente frecuente'),
(1006, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Pedro Sánchez', '099-678-9012', 'Calle D 999', 'en_delivery', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com'), NOW() + INTERVAL '5 minutes', NULL),
(1007, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Laura Díaz', '099-789-0123', 'Av. Sur 111', 'entregado', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com'), NOW() - INTERVAL '2 hours', 'Entregado rápido'),
(1008, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Roberto Ruiz', '099-890-1234', 'Calle E 777', 'cancelado', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), NULL, 'Cliente no contestó'),
(1009, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Diana Torres', '099-901-2345', 'Av. Oeste 444', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com'), NOW() + INTERVAL '25 minutes', 'Con salsa extra'),
(1010, (SELECT id FROM sucursales WHERE nombre = 'Sucursal Sur'), 'Miguel Castro', '099-012-3456', 'Calle F 888', 'terminado', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), NOW() + INTERVAL '12 minutes', 'Pedido urgente');

-- =============================================================================
-- 7. ITEMS DE PEDIDO
-- =============================================================================
INSERT INTO items_pedido (pedido_id, nombre, cantidad, notas) VALUES
((SELECT id FROM pedidos WHERE numero_pedido = 1001), 'Pizza Margarita', 2, 'Sin cebolla'),
((SELECT id FROM pedidos WHERE numero_pedido = 1001), 'Coca-Cola 2L', 1, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1002), 'Hamburguesa Especial', 3, 'Extra queso'),
((SELECT id FROM pedidos WHERE numero_pedido = 1002), 'Papas Fritas', 2, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1003), 'Pasta Alfredo', 1, 'Llamar al llegar'),
((SELECT id FROM pedidos WHERE numero_pedido = 1003), 'Pan de Ajo', 2, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1004), 'Pizza Pepperoni', 1, 'Entregar en recepción'),
((SELECT id FROM pedidos WHERE numero_pedido = 1004), 'Ensalada César', 1, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1005), 'Pollo a la Plancha', 2, 'Cliente frecuente'),
((SELECT id FROM pedidos WHERE numero_pedido = 1005), 'Arroz Chaufa', 2, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'Tacos Mexicanos', 4, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'Nachos', 2, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'Sushi Variado', 3, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'Té Verde', 3, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1009), 'Pizza Hawaiana', 2, 'Con salsa extra'),
((SELECT id FROM pedidos WHERE numero_pedido = 1009), 'Coca-Cola 2L', 2, NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1010), 'Filete de Res', 2, 'Pedido urgente'),
((SELECT id FROM pedidos WHERE numero_pedido = 1010), 'Puré de Papas', 2, NULL);

-- =============================================================================
-- 8. INGREDIENTES DE ITEMS
-- =============================================================================
INSERT INTO ingredientes_item (item_id, nombre_ingrediente) VALUES
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Margarita' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1001)), 'Harina'),
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Margarita' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1001)), 'Queso Mozzarella'),
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Margarita' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1001)), 'Tomate'),
((SELECT id FROM items_pedido WHERE nombre = 'Hamburguesa Especial' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1002)), 'Carne de Res'),
((SELECT id FROM items_pedido WHERE nombre = 'Hamburguesa Especial' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1002)), 'Queso Cheddar'),
((SELECT id FROM items_pedido WHERE nombre = 'Hamburguesa Especial' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1002)), 'Pan de Hamburguesa'),
((SELECT id FROM items_pedido WHERE nombre = 'Pasta Alfredo' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1003)), 'Pasta'),
((SELECT id FROM items_pedido WHERE nombre = 'Pasta Alfredo' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1003)), 'Salsa Alfredo'),
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Pepperoni' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1004)), 'Harina'),
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Pepperoni' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1004)), 'Queso Mozzarella'),
((SELECT id FROM items_pedido WHERE nombre = 'Pizza Pepperoni' AND pedido_id = (SELECT id FROM pedidos WHERE numero_pedido = 1004)), 'Pepperoni');

-- =============================================================================
-- 9. HISTORIAL DE PEDIDOS (Algunos registros de cambios de estado)
-- =============================================================================
INSERT INTO historial_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por) VALUES
((SELECT id FROM pedidos WHERE numero_pedido = 1003), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1004), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1004), 'en_preparacion', 'terminado', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'en_preparacion', 'terminado', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'terminado', 'en_delivery', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'en_preparacion', 'terminado', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'terminado', 'en_delivery', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'en_delivery', 'entregado', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1008), 'pendiente', 'cancelado', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1009), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'cocinero2@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1010), 'pendiente', 'en_preparacion', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1010), 'en_preparacion', 'terminado', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'));

-- =============================================================================
-- 10. MENSAJES AL CLIENTE (CU10)
-- =============================================================================
INSERT INTO mensajes_cliente (pedido_id, mensaje, direccion, enviado_por) VALUES
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'Su pedido está en camino! Llegaremos en 15 minutos.', 'hacia_cliente', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 'Gracias! Estoy esperando.', 'desde_cliente', NULL),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 'Su pedido ha sido entregado. Gracias por preferirnos!', 'hacia_cliente', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1004), 'Su pedido está listo. Lo enviaremos pronto.', 'hacia_cliente', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com'));

-- =============================================================================
-- 11. PAGOS (CU11)
-- =============================================================================
INSERT INTO pagos (pedido_id, monto, metodo, registrado_por) VALUES
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 45.50, 'efectivo', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1007), 10.00, 'transferencia', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com')),
((SELECT id FROM pedidos WHERE numero_pedido = 1006), 32.00, 'tarjeta', (SELECT id FROM empleados WHERE email = 'danilo@deliver.com'));

-- =============================================================================
-- 12. TAREAS
-- =============================================================================
INSERT INTO tareas (sucursal_id, titulo, descripcion, tipo, prioridad, estado, asignado_a, asignado_por, area_id, fecha_limite) VALUES
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Limpiar horno industrial', 'Limpieza profunda del horno principal', 'limpieza', 'media', 'pendiente', (SELECT id FROM empleados WHERE email = 'aseo@deliver.com'), (SELECT id FROM empleados WHERE email = 'gerente@deliver.com'), (SELECT id FROM areas WHERE nombre = 'Cocina Principal'), NOW() + INTERVAL '2 days'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'Reparar refrigerador', 'El refrigerador no enfriaba correctamente', 'reparacion', 'alta', 'en_progreso', (SELECT id FROM empleados WHERE email = 'santiago@deliver.com'), (SELECT id FROM empleados WHERE email = 'gerente@deliver.com'), (SELECT id FROM areas WHERE nombre = 'Cocina Principal'), NOW() + INTERVAL '1 day'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'Inventario mensual', 'Realizar conteo de inventario completo', 'inventario', 'media', 'pendiente', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), (SELECT id FROM empleados WHERE email = 'camila@deliver.com'), (SELECT id FROM areas WHERE nombre = 'Cocina Norte'), NOW() + INTERVAL '5 days');

-- =============================================================================
-- 13. HORARIOS Y ASISTENCIAS
-- =============================================================================
INSERT INTO horarios_asistencias (empleado_id, sucursal_id, fecha, hora_inicio_programada, hora_fin_programada, hora_entrada_real, estado, minutos_atraso) VALUES
((SELECT id FROM empleados WHERE email = 'danilo@deliver.com'), (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), CURRENT_DATE, '08:00', '17:00', CURRENT_DATE + INTERVAL '8 hours', 'presente', 0),
((SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), (SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), CURRENT_DATE, '08:00', '17:00', CURRENT_DATE + INTERVAL '8 hours 10 minutes', 'atrasado', 10),
((SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), CURRENT_DATE, '09:00', '18:00', CURRENT_DATE + INTERVAL '9 hours', 'presente', 0),
((SELECT id FROM empleados WHERE email = 'camila@deliver.com'), (SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), CURRENT_DATE, '09:00', '18:00', NULL, 'ausente', 0);

-- =============================================================================
-- 14. MANTENIMIENTOS
-- =============================================================================
INSERT INTO mantenimientos (equipo_id, descripcion, tecnico_id, costo) VALUES
((SELECT id FROM equipos WHERE numero_serie = 'REF-2023-002'), 'Cambio de filtro y limpieza de condensador', (SELECT id FROM empleados WHERE email = 'santiago@deliver.com'), 85.00),
((SELECT id FROM equipos WHERE numero_serie = 'CON-2023-005'), 'Revisión de compresor y recarga de gas', (SELECT id FROM empleados WHERE email = 'santiago@deliver.com'), 150.00);

-- =============================================================================
-- 15. INCIDENCIAS
-- =============================================================================
INSERT INTO incidencias (sucursal_id, tipo, titulo, descripcion, severidad, estado, reportado_por, equipo_id, lugar) VALUES
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'falla_equipo', 'Horno no calienta', 'El horno industrial no llega a la temperatura adecuada', 'alta', 'en_revision', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), (SELECT id FROM equipos WHERE numero_serie = 'HOR-2023-001'), 'Cocina Principal'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Norte'), 'falta_insumo', 'Falta harina', 'Quedan menos de 10kg de harina en inventario', 'media', 'reportado', (SELECT id FROM empleados WHERE email = 'sandro@deliver.com'), NULL, 'Almacén'),
((SELECT id FROM sucursales WHERE nombre = 'Sucursal Centro'), 'accidente_personal', 'Corte leve', 'Empleado se cortó con cuchillo, atención primeros auxilios', 'baja', 'resuelto', (SELECT id FROM empleados WHERE email = 'nihaht@deliver.com'), NULL, 'Cocina Principal');

-- =============================================================================
-- Verificación de datos insertados
-- =============================================================================
-- Descomenta estas líneas si quieres verificar en el SQL Editor:
-- SELECT 'Sucursales: ' || COUNT(*) FROM sucursales;
-- SELECT 'Empleados: ' || COUNT(*) FROM empleados;
-- SELECT 'Pedidos: ' || COUNT(*) FROM pedidos;
-- SELECT 'Items: ' || COUNT(*) FROM items_pedido;
-- SELECT 'Pagos: ' || COUNT(*) FROM pagos;
-- SELECT 'Mensajes: ' || COUNT(*) FROM mensajes_cliente;
