-- =============================================================================
-- DeliverThePeople — Esquema Inicial
-- 16 tablas con ENUMs, FKs, índices y Sinergias entre módulos
-- =============================================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMs
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE enum_rol AS ENUM ('admin', 'gerente', 'cocinero', 'despachador', 'cajero', 'aseo', 'mantenimiento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_empleado AS ENUM ('activo', 'inactivo', 'suspendido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_categoria_inventario AS ENUM ('lacteo', 'carnico', 'verdura', 'seco', 'bebida', 'limpieza');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_tipo_solicitud AS ENUM ('aumento', 'disminucion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_solicitud AS ENUM ('pendiente', 'aprobada', 'rechazada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_tipo_equipo AS ENUM ('horno', 'refrigerador', 'congelador', 'estufa', 'freidora', 'lavavajillas', 'batidora', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_equipo AS ENUM ('operativo', 'requiere_mantenimiento', 'fuera_de_servicio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_pedido AS ENUM ('pendiente', 'en_preparacion', 'terminado', 'en_delivery', 'entregado', 'cancelado', 'retrasado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_tipo_incidencia AS ENUM ('falta_insumo', 'falla_equipo', 'accidente_personal', 'conflicto', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_severidad_incidencia AS ENUM ('baja', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_incidencia AS ENUM ('reportado', 'en_revision', 'en_progreso', 'resuelto', 'descartado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_tipo_tarea AS ENUM ('mantenimiento', 'limpieza', 'reparacion', 'inventario', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_prioridad_tarea AS ENUM ('baja', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_tarea AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_estado_horario AS ENUM ('programado', 'presente', 'atrasado', 'ausente', 'justificado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_direccion_mensaje AS ENUM ('hacia_cliente', 'desde_cliente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 1. sucursales
-- =============================================================================

CREATE TABLE IF NOT EXISTS sucursales (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  telefono    TEXT,
  activa      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. empleados (Núcleo del sistema — Centro de todas las Sinergias)
-- =============================================================================

CREATE TABLE IF NOT EXISTS empleados (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE,
  email       TEXT UNIQUE NOT NULL,
  nombre      TEXT NOT NULL,
  apellido    TEXT NOT NULL,
  rol         enum_rol NOT NULL,
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  telefono    TEXT,
  estado      enum_estado_empleado DEFAULT 'activo',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empleados_email ON empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_sucursal ON empleados(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_empleados_rol ON empleados(rol);

-- =============================================================================
-- 3. equipos
-- =============================================================================

CREATE TABLE IF NOT EXISTS equipos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id   UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  nombre        TEXT NOT NULL,
  tipo          enum_tipo_equipo NOT NULL,
  numero_serie  TEXT,
  estado        enum_estado_equipo DEFAULT 'operativo',
  fecha_compra  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipos_sucursal ON equipos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);

-- =============================================================================
-- 4. areas
-- =============================================================================

CREATE TABLE IF NOT EXISTS areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_areas_sucursal ON areas(sucursal_id);

-- =============================================================================
-- 5. pedidos (Datos estáticos iniciales, operados en runtime)
-- =============================================================================

CREATE TABLE IF NOT EXISTS pedidos (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido             INT NOT NULL,
  sucursal_id               UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  nombre_cliente            TEXT NOT NULL,
  telefono_cliente          TEXT,
  direccion_cliente         TEXT,
  estado                    enum_estado_pedido DEFAULT 'pendiente',
  cocinero_asignado_id      UUID REFERENCES empleados(id) ON DELETE SET NULL,
  despachador_asignado_id   UUID REFERENCES empleados(id) ON DELETE SET NULL,
  tiempo_estimado_entrega   TIMESTAMPTZ,
  tiempo_real_entrega       TIMESTAMPTZ,
  motivo_cancelacion        TEXT,
  notas                     TEXT,
  fecha_creacion            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_sucursal ON pedidos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cocinero ON pedidos(cocinero_asignado_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_despachador ON pedidos(despachador_asignado_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);

-- =============================================================================
-- 6. inventario
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventario (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id       UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  nombre            TEXT NOT NULL,
  categoria         enum_categoria_inventario,
  cantidad_actual   NUMERIC(10,2) DEFAULT 0,
  unidad            TEXT,
  stock_minimo      NUMERIC(10,2) DEFAULT 0,
  costo_unitario    NUMERIC(10,2),
  proveedor         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_sucursal ON inventario(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);

-- =============================================================================
-- 7. solicitudes_abastecimiento
-- =============================================================================

CREATE TABLE IF NOT EXISTS solicitudes_abastecimiento (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id        UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  tipo                 enum_tipo_solicitud NOT NULL,
  cantidad_solicitada  NUMERIC(10,2) NOT NULL,
  motivo               TEXT,
  estado               enum_estado_solicitud DEFAULT 'pendiente',
  solicitado_por       UUID REFERENCES empleados(id) ON DELETE SET NULL,
  procesado_por        UUID REFERENCES empleados(id) ON DELETE SET NULL,
  fecha_solicitud      TIMESTAMPTZ DEFAULT NOW(),
  fecha_procesamiento  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_inventario ON solicitudes_abastecimiento(inventario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_abastecimiento(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_solicitante ON solicitudes_abastecimiento(solicitado_por);

-- =============================================================================
-- 8. items_pedido
-- =============================================================================

CREATE TABLE IF NOT EXISTS items_pedido (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  nombre    TEXT NOT NULL,
  cantidad  INT DEFAULT 1,
  notas     TEXT
);

CREATE INDEX IF NOT EXISTS idx_items_pedido ON items_pedido(pedido_id);

-- =============================================================================
-- 9. ingredientes_item
-- =============================================================================

CREATE TABLE IF NOT EXISTS ingredientes_item (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id             UUID NOT NULL REFERENCES items_pedido(id) ON DELETE CASCADE,
  nombre_ingrediente  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingredientes_item ON ingredientes_item(item_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes_nombre ON ingredientes_item(nombre_ingrediente);

-- =============================================================================
-- 10. historial_pedido (Trazabilidad — Cada cambio de estado queda registrado)
-- =============================================================================

CREATE TABLE IF NOT EXISTS historial_pedido (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior enum_estado_pedido NOT NULL,
  estado_nuevo    enum_estado_pedido NOT NULL,
  cambiado_por    UUID REFERENCES empleados(id) ON DELETE SET NULL,
  fecha_cambio    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_pedido ON historial_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historial_cambiado ON historial_pedido(cambiado_por);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_pedido(fecha_cambio);

-- =============================================================================
-- 11. mensajes_cliente
-- =============================================================================

CREATE TABLE IF NOT EXISTS mensajes_cliente (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  mensaje     TEXT NOT NULL,
  direccion   enum_direccion_mensaje NOT NULL,
  enviado_por UUID REFERENCES empleados(id) ON DELETE SET NULL,
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_pedido ON mensajes_cliente(pedido_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha ON mensajes_cliente(fecha);

-- =============================================================================
-- 12. pagos
-- =============================================================================

CREATE TABLE IF NOT EXISTS pagos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  monto           NUMERIC(10,2) NOT NULL,
  metodo          TEXT,
  fecha_pago      TIMESTAMPTZ DEFAULT NOW(),
  registrado_por  UUID REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos(pedido_id);

-- =============================================================================
-- 13. horarios_asistencias (Fusión de turnos + asistencias)
-- =============================================================================

CREATE TABLE IF NOT EXISTS horarios_asistencias (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id           UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  sucursal_id           UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  fecha                 DATE NOT NULL,
  hora_inicio_programada TIME,
  hora_fin_programada   TIME,
  hora_entrada_real     TIMESTAMPTZ,
  hora_salida_real      TIMESTAMPTZ,
  estado                enum_estado_horario DEFAULT 'programado',
  minutos_atraso        INT DEFAULT 0,
  observaciones         TEXT
);

CREATE INDEX IF NOT EXISTS idx_horarios_empleado ON horarios_asistencias(empleado_id);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON horarios_asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_horarios_sucursal ON horarios_asistencias(sucursal_id);

-- =============================================================================
-- 14. tareas (Absorbe evidencias_tarea)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tareas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id           UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  titulo                TEXT NOT NULL,
  descripcion           TEXT,
  tipo                  enum_tipo_tarea DEFAULT 'otro',
  prioridad             enum_prioridad_tarea DEFAULT 'media',
  estado                enum_estado_tarea DEFAULT 'pendiente',
  asignado_a            UUID REFERENCES empleados(id) ON DELETE SET NULL,
  asignado_por          UUID REFERENCES empleados(id) ON DELETE SET NULL,
  area_id               UUID REFERENCES areas(id) ON DELETE SET NULL,
  equipo_relacionado_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  fecha_limite          TIMESTAMPTZ,
  completada_en         TIMESTAMPTZ,
  url_foto_evidencia    TEXT,
  notas                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tareas_asignado ON tareas(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_sucursal ON tareas(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_tareas_area ON tareas(area_id);

-- =============================================================================
-- 15. mantenimientos
-- =============================================================================

CREATE TABLE IF NOT EXISTS mantenimientos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_id   UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  descripcion TEXT,
  tecnico_id  UUID REFERENCES empleados(id) ON DELETE SET NULL,
  costo       NUMERIC(10,2),
  fecha       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo ON mantenimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_tecnico ON mantenimientos(tecnico_id);

-- =============================================================================
-- 16. incidencias (Fusión de incidentes_cocina + incidentes_personal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS incidencias (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id           UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  tipo                  enum_tipo_incidencia NOT NULL,
  titulo                TEXT,
  descripcion           TEXT,
  severidad             enum_severidad_incidencia DEFAULT 'baja',
  estado                enum_estado_incidencia DEFAULT 'reportado',
  reportado_por         UUID REFERENCES empleados(id) ON DELETE SET NULL,
  empleado_afectado_id  UUID REFERENCES empleados(id) ON DELETE SET NULL,
  equipo_id             UUID REFERENCES equipos(id) ON DELETE SET NULL,
  lugar                 TEXT,
  testigos              TEXT,
  notas_resolucion      TEXT,
  fecha_reporte         TIMESTAMPTZ DEFAULT NOW(),
  fecha_resolucion      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_tipo ON incidencias(tipo);
CREATE INDEX IF NOT EXISTS idx_incidencias_sucursal ON incidencias(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_reportador ON incidencias(reportado_por);

-- =============================================================================
-- Habilitar Row Level Security (opcional, para Supabase)
-- =============================================================================

-- ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Comentarios de documentación
-- =============================================================================

COMMENT ON TABLE empleados IS 'Centro del sistema. Todos los actores están aquí.';
COMMENT ON TABLE pedidos IS 'Datos inicialmente estáticos (app del cliente). Operados en runtime por cocineros y despachadores.';
COMMENT ON TABLE historial_pedido IS 'Trazabilidad: cada cambio de estado de un pedido queda registrado con quién y cuándo.';
COMMENT ON TABLE incidencias IS 'Unifica incidentes de cocina y de personal, tipificados por ENUM.';
COMMENT ON TABLE horarios_asistencias IS 'Fusión de turnos programados y asistencias reales en una sola tabla.';
COMMENT ON TABLE tareas IS 'Absorbe evidencias_tarea con url_foto_evidencia directo.';
COMMENT ON TABLE solicitudes_abastecimiento IS 'Flujo de aumento/disminución de stock con aprobación.';
