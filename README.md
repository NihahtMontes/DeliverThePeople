# DeliverThePeople

Sistema Integral de Gestión de Restaurante: Cocina, Delivery y Recursos Humanos.

---

## Índice

| # | Sección | Descripción |
|---|---------|-------------|
| 1 | [¿Qué es este proyecto?](#1-qué-es-este-proyecto) | Idea central y valor principal |
| 2 | [Orden de Construcción](#2-orden-de-construcción) | Secuencia obligatoria de ejecución |
| 3 | [Los Dos Equipos](#3-los-dos-equipos) | Integrantes y responsabilidades |
| 4 | [Stack Tecnológico](#4-stack-tecnológico) | Tecnologías por capa |
| 5 | [Modelo de Datos Definitivo](#5-modelo-de-datos-definitivo) | 16 tablas del sistema |
| 5.0 | └ [Diagrama de Navegación de Tablas](#50-diagrama-de-navegación-de-tablas) | Mapa rápido de relaciones |
| 5.1 | └ [Núcleo Compartido](#51-núcleo-compartido) | sucursales, empleados |
| 5.2 | └ [Módulo A: Cocina y Delivery](#52-módulo-a-cocina-y-delivery) | inventario, movimientos, pedidos, historial, mensajes, equipos, mantenimientos, pagos, items, ingredientes |
| 5.3 | └ [Módulo B: Personal](#53-módulo-b-personal) | horarios_asistencias, areas, tareas |
| 5.4 | └ [Tabla Unificada de Incidencias](#54-tabla-unificada-de-incidencias) | incidencias (cocina + personal) |
| 5.5 | └ [Datos Estáticos](#55-datos-estáticos) | pedidos, items_pedido, ingredientes_item, pagos |
| 6 | [Máquina de Estados de Pedidos](#6-máquina-de-estados-de-pedidos) | Las 7 transiciones con actor y CU |
| 7 | [Puntos de Sinergia](#7-puntos-de-sinergia) | 13 FKs que cruzan módulos |
| 8 | [Casos de Uso](#8-casos-de-uso) | Todos los CUs con tablas involucradas |
| 9 | [Navegación de la Aplicación](#9-navegación-de-la-aplicación) | Sidebar, rutas y agrupaciones |
| 10 | [Roles del Sistema](#10-roles-del-sistema) | Permisos por rol |
| 11 | [Estructura del Proyecto](#11-estructura-del-proyecto) | Árbol de carpetas y archivos |
| 12 | [Configuración Inicial](#12-configuración-inicial) | Requisitos, .env, instalación y ejecución |
| 13 | [Plan de Desarrollo](#13-plan-de-desarrollo) | Cronograma día por día |
| 14 | [Guías del Equipo](#14-guías-del-equipo) | Documentos para Danilo y Sandro |
| 15 | [Licencia y Equipos](#15-licencia-y-equipos) | |

---
<img width="697" height="306" alt="image" src="https://github.com/user-attachments/assets/739ce12b-c7a4-46dd-b9c3-27951cabee10" />

## 1. ¿Qué es este proyecto?

Una plataforma web que fusiona dos módulos de software en un solo sistema de gestión de restaurante. Centraliza la operación de cocina y delivery con la administración de personal, turnos y tareas.

**Valor principal:** los cocineros, despachadores, técnicos y demás personal que operan en cocina son los mismos empleados creados y gestionados por Recursos Humanos. Un solo sistema, una sola fuente de verdad.

---

## 2. Orden de Construcción

La construcción del proyecto sigue un orden obligatorio para evitar bloqueos:

| Paso | Responsable | Entregable | Depende de |
|------|-------------|------------|------------|
| **1. Base de Datos** | **Danilo** | Crear proyecto en Supabase, ejecutar DDL, ejecutar seeds, compartir credenciales con los 6 | Nadie |
| **2. Backend** | **Nihaht** | Servidor Express con modelos, controllers y rutas para todas las tablas | Paso 1 |
| **3. Frontend Base** | **Sandro** | Layout (Navbar + Sidebar + Router), sistema de login, Dashboard, placeholders para todas las rutas | Paso 2 |
| **4. CUs de Cocina** | **Nihaht** | CU43, CU44, CU45 (Órdenes, Cola de Producción, Incidencias) | Paso 3 |
| **5. CUs de Operaciones** | **Sandro** | CU5, CU6, CU7, CU8 (Inventario, Solicitudes, Registrar Pedido, Dashboard) | Paso 3 |
| **6. CUs de Delivery** | **Danilo** | CU9, CU10, CU11, CU12 (Despacho, Chat, Pagos, Cancelación) | Paso 3 |
| **7. CUs de Personal** | **Rocket** | CU1-CU12 del Módulo B (Empleados, Turnos, Tareas, Áreas, Incidencias) | Paso 3 |

**Regla:** Nadie avanza sin que el paso anterior esté completado y verificado.

---

## 3. Los Dos Equipos

### Equipo A: "Los Herederos de Epstein"

Responsables del **Módulo A: Control de Actividades de Cocina y Delivery**.

| Integrante | Responsabilidad |
|------------|----------------|
| **Nihaht** | Despacho de pedidos, visualización de cola de producción, reporte de incidencias en cocina |
| **Sandro** | Frontend base, abastecimiento de insumos, gestión de personal de cocina, registro de pedidos, supervisión de progreso |
| **Danilo** | Configuración de Supabase, coordinación de despacho con delivery, comunicación con cliente, registro de pagos, cancelación de pedidos |

### Equipo B: "Rocket"

Responsables del **Módulo B: Administración de Personal**.

| Integrante | Responsabilidad |
|------------|----------------|
| **Camila** | Registro de personal, actualización de datos, asignación de horarios, consulta por sucursal |
| **Fernando** | Verificación de cumplimiento de horarios, modificación de horarios, dar de baja personal, asignación de tareas |
| **Santiago** | Consulta de tareas asignadas, consulta de áreas, reporte de cumplimiento de tareas, reporte de incidentes del personal |

---

## 4. Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React + Vite | SPA con navegación del lado cliente |
| Estilos | Tailwind CSS | Utility-first CSS |
| Íconos | Lucide React | Iconografía del sidebar y UI |
| Backend | Node.js + Express | API RESTful |
| Base de Datos | PostgreSQL (Supabase) | Almacenamiento relacional |
| Conexión BD | pg (node-postgres) | Queries SQL desde Express |
| Autenticación | JWT + bcryptjs | Login, roles y protección de rutas |
| Monorepo | concurrently | Ejecutar frontend + backend en paralelo |

---

## 5. Modelo de Datos Definitivo

**16 tablas.** Versión híbrida que fusiona los mejores aspectos de los dos diseños originales. Todas las columnas y relaciones están en español.

**Fusiones aplicadas:**
- `turnos` + `asistencias` → `horarios_asistencias`
- `incidentes_cocina` + `incidentes_personal` → `incidencias` (tipificada por ENUM)
- `evidencias_tarea` absorbida en `tareas.url_foto_evidencia`

---

### 5.0 Diagrama de Navegación de Tablas

```
sucursales ──┬── empleados ──┬── horarios_asistencias
             │               ├── tareas ─── areas
             │               ├── incidencias (reportado_por, afectado)
             │               ├── pedidos (cocinero, despachador)
             │               ├── historial_pedido (cambiado_por)
             │               ├── mensajes_cliente (enviado_por)
             │               ├── movimiento_inventario (empleado_id)
             │               ├── mantenimientos (solicitante_id)
             │               └── pagos (registrado_por)
             │
             ├── inventario ─── movimiento_inventario
             ├── equipos ─── mantenimientos
             ├── equipos ─── incidencias (equipo_id)
             ├── equipos ─── tareas (equipo_relacionado_id)
             ├── areas
             ├── pedidos ─── items_pedido ─── ingredientes_item
             ├── pedidos ─── historial_pedido
             ├── pedidos ─── mensajes_cliente
             └── pedidos ─── pagos
```

---

### 5.1 Núcleo Compartido

#### `sucursales` — Locales del restaurante

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `nombre` | TEXT | Nombre del local, NOT NULL |
| `direccion` | TEXT | Dirección física |
| `telefono` | TEXT | Teléfono de contacto |
| `activa` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

#### `empleados` — Toda la gente del restaurante (tabla central del sistema)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `auth_id` | UUID | Supabase Auth UID (reemplaza bcrypt manual) |
| `email` | TEXT | Correo para login, UNIQUE, NOT NULL |
| `nombre` | TEXT | Nombre, NOT NULL |
| `apellido` | TEXT | Apellido, NOT NULL |
| `rol` | ENUM | `admin`, `gerente`, `cocinero`, `despachador`, `cajero`, `aseo`, `mantenimiento` |
| `sucursal_id` | UUID → sucursales | Sucursal asignada |
| `telefono` | TEXT | Teléfono de contacto |
| `estado` | ENUM | `activo`, `inactivo`, `suspendido` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

### 5.2 Módulo A: Cocina y Delivery

#### `inventario` — Ingredientes en la despensa

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre` | TEXT | Nombre del ingrediente, NOT NULL |
| `categoria` | ENUM | `categoria_inventario`, NOT NULL |
| `unidad` | TEXT | Unidad de medida, NOT NULL |
| `cantidad_actual` | NUMERIC(10,2) | Stock actual, DEFAULT 0 |
| `stock_minimo` | NUMERIC(10,2) | Umbral de alerta, DEFAULT 0 |
| `costo_unitario` | NUMERIC(10,2) | Costo por unidad |
| `activo` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

#### `movimiento_inventario` — Movimientos de entrada y salida

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `inventario_id` | UUID → inventario | Producto afectado |
| `empleado_id` | UUID → empleados | **Sinergia** |
| `tipo_movimiento` | ENUM | `tipo_movimiento`, NOT NULL |
| `cantidad` | NUMERIC(10,2) | Cantidad movida, NOT NULL |
| `stock_anterior` | NUMERIC(10,2) | Stock antes del movimiento, NOT NULL |
| `stock_nuevo` | NUMERIC(10,2) | Stock después del movimiento, NOT NULL |
| `motivo` | TEXT | Motivo del movimiento |
| `observaciones` | TEXT | Observaciones adicionales |
| `costo_unitario` | NUMERIC(10,2) | Costo por unidad |
| `costo_total` | NUMERIC(10,2) | Costo total del movimiento |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

#### `equipos` — Equipos de cocina

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre` | TEXT | Nombre del equipo, NOT NULL |
| `tipo` | TEXT | Tipo de equipo, NOT NULL |
| `marca` | TEXT | Marca del equipo, NOT NULL |
| `modelo` | TEXT | Modelo del equipo, NOT NULL |
| `numero_serie` | TEXT | Número de serie, NOT NULL |
| `capacidad` | TEXT | Capacidad del equipo |
| `descripcion` | TEXT | Descripción adicional |
| `estado` | ENUM | `estado_equipo`, DEFAULT 'OPERATIVO' |
| `fecha_compra` | DATE | Fecha de adquisición |
| `activo` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

#### `mantenimientos` — Historial de reparaciones

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `equipo_id` | UUID → equipos | Equipo reparado |
| `solicitante_id` | UUID → empleados | **Sinergia** |
| `numero_ticket` | SERIAL | Número de ticket autoincremental |
| `descripcion_falla` | TEXT | Qué falla presenta, NOT NULL |
| `observaciones_inicio` | TEXT | Observaciones al iniciar |
| `diagnostico` | TEXT | Diagnóstico técnico |
| `observaciones_cierre` | TEXT | Observaciones al cerrar |
| `urgencia` | ENUM | `urgencia`, DEFAULT 'MEDIA' |
| `estado_ticket` | ENUM | `estado_ticket`, DEFAULT 'PENDIENTE' |
| `costo` | NUMERIC(10,2) | Costo de la reparación |
| `fecha_solicitud` | TIMESTAMPTZ | DEFAULT NOW() |
| `fecha_estimada` | TIMESTAMPTZ | Fecha estimada de reparación |
| `fecha_cierre` | TIMESTAMPTZ | Fecha en que se cerró |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

### 5.3 Módulo B: Personal

#### `horarios_asistencias` — Fusión de turnos + asistencias

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `empleado_id` | UUID → empleados | Empleado |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `fecha` | DATE | Día laboral |
| `hora_inicio_programada` | TIME | Hora de entrada programada |
| `hora_fin_programada` | TIME | Hora de salida programada |
| `hora_entrada_real` | TIMESTAMPTZ | Marcaje real de entrada (nullable) |
| `hora_salida_real` | TIMESTAMPTZ | Marcaje real de salida (nullable) |
| `estado` | ENUM | `programado`, `presente`, `atrasado`, `ausente`, `justificado` |
| `minutos_atraso` | INT | Calculado al marcar entrada |
| `observaciones` | TEXT | Notas |

#### `areas` — Zonas del local

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre` | TEXT | Nombre del área |

#### `tareas` — Trabajos asignados al personal

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `titulo` | TEXT | Título de la tarea |
| `descripcion` | TEXT | Descripción detallada |
| `tipo` | ENUM | `mantenimiento`, `limpieza`, `reparacion`, `inventario`, `otro` |
| `prioridad` | ENUM | `baja`, `media`, `alta`, `critica` |
| `estado` | ENUM | `pendiente`, `en_progreso`, `completada`, `cancelada` |
| `asignado_a` | UUID → empleados | Empleado responsable |
| `asignado_por` | UUID → empleados | Gerente/Supervisor que la asignó |
| `area_id` | UUID → areas | Zona de trabajo (FK, no texto libre) |
| `equipo_relacionado_id` | UUID → equipos | **Sinergia**, nullable |
| `fecha_limite` | TIMESTAMPTZ | Fecha máxima de cumplimiento |
| `completada_en` | TIMESTAMPTZ | Cuándo se marcó (nullable) |
| `url_foto_evidencia` | TEXT | Evidencia de tarea cumplida (nullable) |
| `notas` | TEXT | Observaciones |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

### 5.4 Tabla Unificada de Incidencias

#### `incidencias` — Fusión de incidentes_cocina + incidentes_personal

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `tipo` | ENUM | `falta_insumo`, `falla_equipo`, `accidente_personal`, `conflicto`, `otro` |
| `titulo` | TEXT | Título de la incidencia |
| `descripcion` | TEXT | Descripción detallada |
| `severidad` | ENUM | `baja`, `media`, `alta`, `critica` |
| `estado` | ENUM | `reportado`, `en_revision`, `en_progreso`, `resuelto`, `descartado` |
| `reportado_por` | UUID → empleados | **Sinergia** |
| `empleado_afectado_id` | UUID → empleados | Nullable, solo accidente/conflicto |
| `equipo_id` | UUID → equipos | Nullable, solo falla_equipo |
| `lugar` | TEXT | Nullable, solo accidente/conflicto |
| `testigos` | TEXT | Nullable |
| `notas_resolucion` | TEXT | Nullable |
| `fecha_reporte` | TIMESTAMPTZ | DEFAULT NOW() |
| `fecha_resolucion` | TIMESTAMPTZ | Nullable |

---

### 5.5 Datos Estáticos

Estas tablas existen en la base de datos pero se llenan mediante seeds. Simulan los módulos externos del restaurante (app del cliente, facturación, pasarela de pagos). Durante la operación, los campos `cocinero_asignado_id`, `despachador_asignado_id`, `estado` y `tiempo_real_entrega` se actualizan en runtime.

#### `pedidos` — Órdenes que entran al restaurante

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `numero_pedido` | INT | Número secuencial |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre_cliente` | TEXT | Nombre del cliente |
| `telefono_cliente` | TEXT | Teléfono |
| `direccion_cliente` | TEXT | Dirección de entrega |
| `estado` | ENUM | `pendiente`, `en_preparacion`, `terminado`, `en_delivery`, `entregado`, `cancelado`, `retrasado` |
| `cocinero_asignado_id` | UUID → empleados | **Sinergia**, se asigna en runtime |
| `despachador_asignado_id` | UUID → empleados | **Sinergia**, se asigna en runtime |
| `tiempo_estimado_entrega` | TIMESTAMPTZ | Hora estimada |
| `tiempo_real_entrega` | TIMESTAMPTZ | Hora real (nullable) |
| `motivo_cancelacion` | TEXT | Si fue cancelado |
| `notas` | TEXT | Notas adicionales |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() |

#### `items_pedido` — Platos comprados

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `pedido_id` | UUID → pedidos | ON DELETE CASCADE |
| `nombre` | TEXT | Nombre del plato |
| `cantidad` | INT | Cuántas unidades |
| `notas` | TEXT | Notas del cliente |

#### `ingredientes_item` — Ingredientes de cada plato

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `item_id` | UUID → items_pedido | ON DELETE CASCADE |
| `nombre_ingrediente` | TEXT | Ej: "harina", "tomate" |

#### `pagos` — Pagos recibidos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido |
| `monto` | NUMERIC(10,2) | Monto pagado |
| `metodo` | TEXT | transferencia, efectivo, tarjeta |
| `fecha_pago` | TIMESTAMPTZ | DEFAULT NOW() |
| `registrado_por` | UUID → empleados | **Sinergia** |

### Tablas de Soporte

#### `historial_pedido` — Trazabilidad de cada pedido

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido afectado |
| `estado_anterior` | ENUM | Estado antes del cambio |
| `estado_nuevo` | ENUM | Estado después del cambio |
| `cambiado_por` | UUID → empleados | **Sinergia** |
| `fecha_cambio` | TIMESTAMPTZ | DEFAULT NOW() |

#### `mensajes_cliente` — Chat con el cliente

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido relacionado |
| `mensaje` | TEXT | Contenido del mensaje |
| `direccion` | ENUM | `hacia_cliente`, `desde_cliente` |
| `enviado_por` | UUID → empleados | **Sinergia** |
| `fecha` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 6. Máquina de Estados de Pedidos

Un pedido no salta mágicamente a "terminado". Tiene un ciclo de vida con 7 transiciones, cada una ejecutada por un actor específico con su caso de uso.

```
                     ┌─── Danilo (CU12) ──→ CANCELADO ←── (desde cualquier estado)
                     │
APP CLIENTE ──→ PENDIENTE ──→ EN_PREPARACION ──→ TERMINADO ──→ EN_DELIVERY ──→ ENTREGADO
 (insert seed) (Sandro CU7)  (Nihaht CU43a)    (Nihaht CU43b)  (Danilo CU9a)  (Danilo CU9b)
                                       │
                                       └──→ RETRASADO (sistema CU8)
                                            cuando NOW() > tiempo_estimado_entrega
                                            y el pedido no está entregado ni cancelado
```

| # | Transición | Actor | CU | Qué se registra |
|---|-----------|-------|-----|-----------------|
| 1 | → `pendiente` | Sandro (lee datos estáticos) | CU7 | `historial_pedido` + `cambiado_por` = Sandro |
| 2 | `pendiente` → `en_preparacion` | Nihaht (bloquea el pedido) | **CU43a** | `historial_pedido` + `cocinero_asignado_id` = Nihaht |
| 3 | `en_preparacion` → `terminado` | Nihaht (comida lista) | **CU43b** | `historial_pedido` + `cambiado_por` = Nihaht |
| 4 | `terminado` → `en_delivery` | Danilo (asigna repartidor) | CU9a | `historial_pedido` + `despachador_asignado_id` |
| 5 | `en_delivery` → `entregado` | Danilo (confirma entrega) | CU9b | `historial_pedido` + `tiempo_real_entrega` |
| 6 | Auto → `retrasado` | Sistema (flag automático) | CU8 | No es transición manual. El dashboard de Sandro lo resalta en rojo. |
| 7 | cualquiera → `cancelado` | Danilo | CU12 | `historial_pedido` + `motivo_cancelacion` |

**Validaciones backend:**
- CU43a: Solo si `estado = 'pendiente'` y el empleado tiene rol `cocinero`
- CU43b: Solo si `estado = 'en_preparacion'` y `cocinero_asignado_id = quien hace la acción`
- CU12: Solo si el pedido no está ya en `entregado` o `cancelado`

---

## 7. Puntos de Sinergia

Las sinergias son las relaciones entre tablas de equipos distintos. Son la razón de ser del sistema unificado.

| # | Situación real | FK | Origen | Destino |
|---|---------------|-----|--------|---------|
| 1 | Cocinero cambia estado de un pedido | `historial_pedido.cambiado_por` → `empleados.id` | Módulo A | Módulo B |
| 2 | Despachador envía mensaje al cliente | `mensajes_cliente.enviado_por` → `empleados.id` | Módulo A | Módulo B |
| 3 | Empleado registra movimiento inventario | `movimiento_inventario.empleado_id` → `empleados.id` | Módulo A | Módulo B |
| 4 | Empleado solicita mantenimiento | `mantenimientos.solicitante_id` → `empleados.id` | Módulo A | Módulo B |
| 5 | Cocinero reporta incidencia | `incidencias.reportado_por` → `empleados.id` | Unificada | Módulo B |
| 6 | Incidencia afecta a empleado | `incidencias.empleado_afectado_id` → `empleados.id` | Unificada | Módulo B |
| 7 | Incidencia vinculada a equipo | `incidencias.equipo_id` → `equipos.id` | Unificada | Módulo A |
| 8 | Gerente asigna tarea a empleado | `tareas.asignado_a` → `empleados.id` | Módulo B | Módulo B |
| 9 | Gerente asigna tarea sobre un equipo | `tareas.equipo_relacionado_id` → `equipos.id` | Módulo B | Módulo A |
| 10 | Pedido asignado a cocinero | `pedidos.cocinero_asignado_id` → `empleados.id` | Datos estáticos | Módulo B |
| 11 | Pedido asignado a despachador | `pedidos.despachador_asignado_id` → `empleados.id` | Datos estáticos | Módulo B |
| 12 | Pago registrado por empleado | `pagos.registrado_por` → `empleados.id` | Módulo A | Módulo B |

---

## 8. Casos de Uso

### Módulo A — Herederos de Epstein

| CU | Responsable | Actor | Descripción | Tablas involucradas |
|----|-------------|-------|-------------|---------------------|
| **CU43a** | Nihaht | Cocinero | Tomar pedido: `pendiente` → `en_preparacion`, bloquea el pedido | pedidos, historial_pedido |
| **CU43b** | Nihaht | Cocinero | Terminar pedido: `en_preparacion` → `terminado` | pedidos, historial_pedido |
| **CU44** | Nihaht | Cocinero | Cola de producción con filtros por ingrediente, cantidad y tiempo | pedidos, items_pedido, ingredientes_item |
| **CU45** | Nihaht | Cocinero | Reportar incidencia (falta_insumo, falla_equipo, otro) | incidencias, equipos, inventario |
| CU5 | Sandro | Admin Cocina | Gestionar inventario vía movimientos de entrada y salida | inventario, movimiento_inventario |
| CU6 | Sandro | Admin Cocina | Gestionar turnos del personal de cocina | horarios_asistencias, empleados |
| CU7 | Sandro | Admin Cocina | Registrar pedido desde datos estáticos al flujo de cocina | pedidos, historial_pedido |
| CU8 | Sandro | Admin Cocina | Supervisar progreso de pedidos + alertas de retraso | pedidos |
| CU9a | Danilo | Despachador | Enviar a delivery: `terminado` → `en_delivery` | pedidos, historial_pedido |
| CU9b | Danilo | Despachador | Confirmar entrega: `en_delivery` → `entregado` | pedidos, historial_pedido |
| CU10 | Danilo | Despachador | Gestionar comunicación con cliente | mensajes_cliente, pedidos |
| CU11 | Danilo | Despachador | Registrar pago de entrega | pagos, pedidos |
| CU12 | Danilo | Despachador | Cancelar pedido (desde cualquier estado no terminal) | pedidos, historial_pedido |

### Módulo B — Rocket

| CU | Responsable | Actor | Descripción |
|----|-------------|-------|-------------|
| CU1 | Camila | Gerente | Registrar personal con credenciales de acceso |
| CU2 | Camila | Gerente | Actualizar datos del personal |
| CU3 | Camila | Gerente | Asignar horarios de trabajo |
| CU4 | Camila | Gerente | Consultar personal por sucursal |
| CU5 | Fernando | Gerente | Verificar cumplimiento de horarios (asistencia y retrasos) |
| CU6 | Fernando | Gerente | Modificar horario del personal |
| CU7 | Fernando | Gerente | Dar de baja al personal |
| CU8 | Fernando | Gerente/Supervisor | Asignar tareas al personal |
| CU9 | Santiago | Empleado | Consultar tareas asignadas |
| CU10 | Santiago | Empleado | Consultar áreas asignadas |
| CU11 | Santiago | Empleado | Reportar cumplimiento de tarea (con evidencia) |
| CU12 | Santiago | Empleado | Reportar incidentes del personal |

---

## 9. Navegación de la Aplicación

El layout tiene un **navbar superior** con logo, sucursal activa y avatar del usuario, y un **sidebar lateral** con navegación agrupada en dos módulos:

```
Sidebar
├── 🏠 Dashboard
│
├── 🍳 Actividades de Cocina y Delivery
│   ├── Órdenes           → pedidos, historial_pedido
│   ├── Cola Producción   → pedidos (filtro), items_pedido, ingredientes_item
│   ├── Delivery          → pedidos en_delivery, mensajes_cliente
│   ├── Inventario        → inventario, movimiento_inventario
│   ├── Equipos           → equipos, mantenimientos
│   └── Pagos             → pagos
│
├── 👥 Gestión de Personal
│   ├── Empleados         → empleados
│   ├── Turnos y Asist.   → horarios_asistencias
│   ├── Tareas            → tareas
│   └── Áreas             → areas
│
└── ⚠️ Incidencias        → incidencias
```

Cada ítem usa `react-router-dom` con resaltado automático al estar activo. El sidebar es colapsable (solo íconos) y responsive (se oculta en móvil con toggle).

---

## 10. Roles del Sistema

| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `gerente` | Personal, turnos, tareas, incidencias, dashboard |
| `cocinero` | Órdenes (solo las asignadas), cola de producción, incidencias de cocina |
| `despachador` | Órdenes, delivery, mensajes a cliente, pagos |
| `cajero` | Pagos, consulta de pedidos |
| `aseo` | Tareas asignadas, áreas, reportar cumplimiento, incidencias personales |
| `mantenimiento` | Equipos, mantenimientos, tareas de reparación |

---

## 11. Estructura del Proyecto

```
DeliverThePeople/
│
├── client/                              # Frontend — React + Vite
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── logoDTP.png
│   │   │   ├── logoIcono.png
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx        # Navbar + Sidebar + Outlet
│   │   │   │   ├── Navbar.jsx           # Barra superior
│   │   │   │   └── Sidebar.jsx          # Navegación en 2 módulos
│   │   │   ├── ui/                      # Componentes reutilizables
│   │   │   │   ├── GlassInput.jsx
│   │   │   │   ├── GlassModal.jsx
│   │   │   │   └── GlassSelect.jsx
│   │   │   └── PlaceholderPage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useToast.js
│   │   ├── pages/                       # Vistas principales por módulo
│   │   │   ├── areas/
│   │   │   │   └── AreasPage.jsx
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── delivery/                # Danilo: CU9, CU10, CU12
│   │   │   │   ├── ChatClientePage.jsx
│   │   │   │   └── DeliveryPage.jsx
│   │   │   ├── empleados/               # Rocket
│   │   │   │   └── EmpleadosPage.jsx
│   │   │   ├── equipos/                 # Nihaht: CU45 (parte)
│   │   │   │   └── EquiposPage.jsx
│   │   │   ├── horarios/                # Rocket
│   │   │   │   └── HorariosPage.jsx
│   │   │   ├── incidencias/             # Ambos equipos
│   │   │   │   └── IncidenciasPage.jsx
│   │   │   ├── inventario/              # Sandro: CU5
│   │   │   │   ├── InventarioPage.jsx
│   │   │   │   └── SolicitudesPage.jsx
│   │   │   ├── mantenimiento/
│   │   │   │   └── MantenimientoPage.jsx
│   │   │   ├── ordenes/                 # Nihaht: CU43, CU44
│   │   │   │   ├── ColaProduccionPage.jsx
│   │   │   │   └── OrdenesPage.jsx
│   │   │   ├── pagos/                   # Danilo: CU11
│   │   │   │   └── PagosPage.jsx
│   │   │   ├── tareas/                  # Rocket
│   │   │   │   └── TareasPage.jsx
│   │   │   └── NotFound.jsx
│   │   ├── router/
│   │   │   ├── AppRouter.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── services/
│   │   │   └── api.js                   # Axios config
│   │   ├── App.jsx
│   │   ├── index.css                    # Tailwind
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
│
├── server/                              # Backend — Express + pg
│   ├── config/
│   │   └── db.js                        # pg Pool → Supabase
│   ├── controllers/                     # Lógica de negocio
│   │   ├── authController.js
│   │   ├── equipoController.js
│   │   ├── inventarioController.js
│   │   └── mantenimientoController.js
│   ├── middleware/
│   │   ├── auth.js                      # JWT verify
│   │   ├── errorHandler.js              # Errores centralizados
│   │   └── roleGuard.js                 # Autorización por rol
│   ├── routes/                          # Endpoints REST
│   │   ├── authRoutes.js
│   │   ├── equipoRoutes.js
│   │   ├── inventarioRoutes.js
│   │   └── mantenimientoRoutes.js
│   ├── utils/
│   │   └── jwt.js                       # sign / verify
│   ├── app.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── test-db.js
│
├── .env
├── .env.example
├── .gitignore
├── GUIA_FRONTEND_SANDRO.md              # Guía paso a paso para Sandro
├── GUIA_SUPABASE_DANILO.md              # Guía paso a paso para Danilo
├── package.json                         # Raíz con concurrently
└── README.md
```

---

## 12. Configuración Inicial

### Requisitos

- Node.js 18+
- Cuenta gratuita en [Supabase](https://supabase.com)
- Git

### Variables de Entorno (.env)

Copiar `.env.example` a `.env` y llenar:

```env
# Servidor
PORT=3001

# Supabase PostgreSQL
PGHOST=db.xxxxxxxxxxxx.supabase.co
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=tu_password_de_supabase

# JWT
JWT_SECRET=cambiar_por_clave_segura
JWT_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Instalación

```bash
# 1. Clonar
git clone https://github.com/NihahtMontes/DeliverThePeople.git
cd DeliverThePeople

# 2. Instalar dependencias raíz
npm install

# 3. Instalar dependencias del servidor
cd server
npm install
cd ..

# 4. Crear base de datos en Supabase y ejecutar la migración
#    (Danilo hace esto una sola vez)
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f database/migrations/00001_esquema_inicial.sql

# 5. Insertar datos de prueba
#    (Danilo hace esto una sola vez)
npm run seed

# 6. Iniciar en desarrollo (frontend + backend en paralelo)
npm run dev
```

---

## 13. Plan de Desarrollo

| Día | Fecha | Objetivo | Responsable |
|-----|-------|----------|-------------|
| **1** | Lun 9 Jun | Definición del modelo de datos + README + DDL | Nihaht |
| **2** | Mar 10 Jun | Supabase configurado + Backend base Express | Danilo + Nihaht |
| **3** | Mié 11 Jun | Frontend base: Layout + Router + Auth + Dashboard | Sandro |
| **4** | Jue 12 Jun | CUs de Cocina (CU43, CU44, CU45) + Inventario (CU5) | Nihaht + Sandro |
| **5** | Vie 13 Jun | CUs de Delivery (CU9-CU12) + Placeholders para Rocket | Danilo |
| — | Sáb 14 Jun | Módulo B completo (CU1-CU12) | Rocket |
| — | Dom 15 Jun | Integración final, testing, correcciones | Todos |
| — | Lun 16 Jun | Entrega | — |

---

## 14. Guías del Equipo

Documentos paso a paso para los responsables de infraestructura:

| Guía | Para | Contenido |
|------|------|-----------|
| [`GUIA_SUPABASE_DANILO.md`](GUIA_SUPABASE_DANILO.md) | Danilo | Crear proyecto Supabase, ejecutar DDL, seeds, compartir acceso con los 6 |
| [`GUIA_FRONTEND_SANDRO.md`](GUIA_FRONTEND_SANDRO.md) | Sandro | Setup de Vite + React + Tailwind, layout, router, auth, sus CUs, placeholders |

---

## 15. Licencia y Equipos

Este proyecto es privado y de uso interno para el restaurante.

| Equipo | Integrantes | Módulo |
|--------|-------------|--------|
| Los Herederos de Epstein | Nihaht, Sandro, Danilo | Cocina y Delivery |
| Rocket | Camila, Fernando, Santiago | Administración de Personal |
