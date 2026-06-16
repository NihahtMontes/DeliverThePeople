-- =============================================================================
-- DeliverThePeople — Esquema Inicial Completo
-- 16 tablas con ENUMs, FKs, indices y sinergias entre modulos
-- Ejecutar TODO este archivo en el SQL Editor de Supabase
-- =============================================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMs
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE enum_rol AS ENUM ('admin', 'gerente', 'cocinero', 'despachador', 'cajero', 'aseo', 'mantenimiento', 'tecnico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_equipo AS ENUM ('OPERATIVO', 'REQUIERE_MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'INACTIVO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_urgencia AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_ticket AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RETRASADO', 'COMPLETADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_pedido AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'TERMINADO', 'ENTREGADO', 'CANCELADO', 'RETRASADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_tipo_movimiento AS ENUM ('INGRESO', 'MERMA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 1. sucursales
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text,
  telefono text,
  estado text DEFAULT 'activo'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sucursales_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- 2. empleados (Nucleo del sistema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.empleados (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  rol enum_rol NOT NULL DEFAULT 'cocinero'::enum_rol,
  sucursal_id uuid,
  estado text DEFAULT 'activo'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

CREATE INDEX IF NOT EXISTS idx_empleados_email ON empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_sucursal ON empleados(sucursal_id);

-- =============================================================================
-- 3. areas
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  nombre text NOT NULL,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT areas_pkey PRIMARY KEY (id),
  CONSTRAINT areas_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

-- =============================================================================
-- 4. equipos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sucursal_id uuid NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  numero_serie text NOT NULL UNIQUE,
  capacidad text,
  descripcion text,
  estado enum_estado_equipo NOT NULL DEFAULT 'OPERATIVO'::enum_estado_equipo,
  fecha_compra date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT equipos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_equipo_sucursal FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

CREATE INDEX IF NOT EXISTS idx_equipos_sucursal ON equipos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);

-- =============================================================================
-- 5. mantenimientos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mantenimientos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  equipo_id uuid NOT NULL,
  solicitante_id uuid NOT NULL,
  tecnico_id uuid,
  numero_ticket integer NOT NULL DEFAULT nextval('mantenimientos_numero_ticket_seq'::regclass),
  descripcion_falla text NOT NULL,
  observaciones_inicio text,
  diagnostico text,
  observaciones_cierre text,
  urgencia enum_urgencia NOT NULL DEFAULT 'MEDIA'::enum_urgencia,
  estado_ticket enum_estado_ticket NOT NULL DEFAULT 'PENDIENTE'::enum_estado_ticket,
  costo numeric,
  fecha_solicitud timestamp with time zone NOT NULL DEFAULT now(),
  fecha_estimada timestamp with time zone,
  fecha_cierre timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mantenimientos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_mantenimiento_equipo FOREIGN KEY (equipo_id) REFERENCES public.equipos(id),
  CONSTRAINT fk_mantenimiento_solicitante FOREIGN KEY (solicitante_id) REFERENCES public.empleados(id),
  CONSTRAINT fk_mantenimiento_tecnico FOREIGN KEY (tecnico_id) REFERENCES public.empleados(id)
);

-- =============================================================================
-- 6. horarios_asistencias
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.horarios_asistencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empleado_id uuid,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada timestamp with time zone,
  hora_salida timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT horarios_asistencias_pkey PRIMARY KEY (id),
  CONSTRAINT horarios_asistencias_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

-- =============================================================================
-- 7. incidencias
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.incidencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  empleado_id uuid,
  descripcion text NOT NULL,
  estado text DEFAULT 'ABIERTA'::text,
  created_at timestamp with time zone DEFAULT now(),
  tipo text,
  prioridad text DEFAULT 'ALTA'::text,
  pedido_id uuid,
  ingrediente_faltante text,
  ingrediente_alternativo text,
  CONSTRAINT incidencias_pkey PRIMARY KEY (id),
  CONSTRAINT incidencias_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT incidencias_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

-- =============================================================================
-- 8. tareas
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tareas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  empleado_id uuid,
  titulo text NOT NULL,
  estado text DEFAULT 'PENDIENTE'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tareas_pkey PRIMARY KEY (id),
  CONSTRAINT tareas_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT tareas_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

-- =============================================================================
-- 9. mensajes_cliente
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mensajes_cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  mensaje text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mensajes_cliente_pkey PRIMARY KEY (id),
  CONSTRAINT mensajes_cliente_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

CREATE INDEX IF NOT EXISTS idx_mensajes_pedido_id ON public.mensajes_cliente(pedido_id);

-- =============================================================================
-- 10. inventario
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  nombre text NOT NULL,
  categoria text NOT NULL,
  cantidad_actual numeric DEFAULT 0,
  unidad text NOT NULL,
  stock_minimo numeric NOT NULL,
  costo_unitario numeric,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventario_pkey PRIMARY KEY (id),
  CONSTRAINT inventario_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_sucursal ON public.inventario(sucursal_id);

-- =============================================================================
-- 11. movimiento_inventario
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.movimiento_inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventario_id uuid NOT NULL,
  empleado_id uuid NOT NULL,
  tipo_movimiento enum_tipo_movimiento NOT NULL,
  cantidad numeric NOT NULL,
  stock_anterior numeric NOT NULL,
  stock_nuevo numeric NOT NULL,
  motivo text,
  observaciones text,
  costo_unitario numeric,
  costo_total numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT movimiento_inventario_pkey PRIMARY KEY (id),
  CONSTRAINT movimiento_inventario_inventario_id_fkey FOREIGN KEY (inventario_id) REFERENCES public.inventario(id),
  CONSTRAINT movimiento_inventario_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

-- =============================================================================
-- 12. pedidos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_orden integer NOT NULL DEFAULT nextval('pedidos_numero_orden_seq'::regclass),
  sucursal_id uuid,
  empleado_id uuid,
  mesa text,
  estado enum_estado_pedido DEFAULT 'PENDIENTE'::enum_estado_pedido,
  total numeric NOT NULL DEFAULT 0,
  tiempo_estimado_min integer DEFAULT 20,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT pedidos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_sucursal ON public.pedidos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON public.pedidos(numero_orden);

-- =============================================================================
-- 13. items_pedido
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.items_pedido (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  item_id uuid,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric DEFAULT ((cantidad)::numeric * precio_unitario),
  CONSTRAINT items_pedido_pkey PRIMARY KEY (id),
  CONSTRAINT items_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT items_pedido_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventario(id)
);

CREATE INDEX IF NOT EXISTS idx_items_pedido ON public.items_pedido(pedido_id);

-- =============================================================================
-- 14. ingredientes_item
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ingredientes_item (
  item_id uuid NOT NULL,
  ingrediente_id uuid NOT NULL,
  cantidad_requerida numeric NOT NULL DEFAULT 0,
  CONSTRAINT ingredientes_item_pkey PRIMARY KEY (item_id, ingrediente_id),
  CONSTRAINT ingredientes_item_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventario(id),
  CONSTRAINT ingredientes_item_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.inventario(id)
);

-- =============================================================================
-- 15. historial_pedido
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.historial_pedido (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  empleado_id uuid,
  estado_anterior enum_estado_pedido,
  estado_nuevo enum_estado_pedido NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT historial_pedido_pkey PRIMARY KEY (id),
  CONSTRAINT historial_pedido_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);

CREATE INDEX IF NOT EXISTS idx_historial_pedido ON public.historial_pedido(pedido_id);

-- =============================================================================
-- 16. pagos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  metodo text NOT NULL DEFAULT 'efectivo'::text,
  estado text DEFAULT 'completado'::text,
  registrado_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT pagos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.empleados(id)
);

CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON public.pagos(pedido_id);

-- =============================================================================
-- Secuencias
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS pedidos_numero_orden_seq;
CREATE SEQUENCE IF NOT EXISTS mantenimientos_numero_ticket_seq;

-- =============================================================================
-- Verificacion
-- =============================================================================
SELECT 'Esquema creado exitosamente' as resultado;
