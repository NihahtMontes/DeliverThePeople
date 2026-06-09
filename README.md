# DeliverThePeople

Sistema Integral de Gestión de Restaurante: Cocina, Delivery y Recursos Humanos.

---

## ¿Qué es este proyecto?

Una plataforma web que fusiona dos módulos de software desarrollados por dos equipos distintos para crear un sistema unificado de gestión de restaurante. Centraliza la operación de cocina y delivery con la administración de personal, turnos y tareas.

**Valor principal:** los cocineros, despachadores y demás personal que operan en cocina son los mismos empleados creados y gestionados por Recursos Humanos. Un solo sistema, una sola fuente de verdad.

---

## Los Dos Equipos

### Equipo A: "Los Herederos de Epstein"

Responsables del **Módulo A: Control de Actividades de Cocina y Delivery**.

| Integrante | Responsabilidad |
|------------|----------------|
| **Nihaht** | Despacho de pedidos, visualización de cola de producción, reporte de incidencias en cocina |
| **Sandro** | Abastecimiento de insumos, gestión de personal de cocina, registro de pedidos, supervisión de progreso |
| **Danilo** | Coordinación de despacho con delivery, comunicación con cliente, registro de pagos, cancelación de pedidos |

### Equipo B: "Rocket"

Responsables del **Módulo B: Administración de Personal**.

| Integrante | Responsabilidad |
|------------|----------------|
| **Camila** | Registro de personal, actualización de datos, asignación de horarios, consulta por sucursal |
| **Fernando** | Verificación de cumplimiento de horarios, modificación de horarios, dar de baja personal, asignación de tareas |
| **Santiago** | Consulta de tareas asignadas, consulta de áreas, reporte de cumplimiento de tareas, reporte de incidentes del personal |

---

## Stack Tecnológico

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

## Lo que NO desarrollamos (Datos Estáticos)

Estas tablas existen en la base de datos pero se llenan mediante scripts de inserción manual. No se programan CRUDs para ellas. Simulan los módulos externos del restaurante (app del cliente, facturación, pasarela de pagos).

| Tabla | Contenido | Ejemplo |
|-------|-----------|---------|
| `pedidos` | Órdenes que entran al restaurante | Pedido #1042 de María Gómez: 2 pizzas |
| `items_pedido` | Platos dentro de cada pedido | Pizza Margherita x2 |
| `ingredientes_item` | Ingredientes de cada plato (para filtros) | Harina, tomate, mozzarella, albahaca |
| `pagos` | Pagos recibidos | $25.000 - Transferencia |

---

## Modelos de la Base de Datos (PostgreSQL en Supabase)

Todas las tablas, columnas y relaciones están en español.

---

### Modelos Compartidos

#### `sucursales` — Locales del restaurante

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `nombre` | TEXT | Nombre del local |
| `direccion` | TEXT | Dirección física |
| `telefono` | TEXT | Teléfono de contacto |
| `activa` | BOOLEAN | Si está operativa |

---

### Modelos del Módulo A — Cocina y Delivery (Equipo Herederos de Epstein)

#### `inventario` — Ingredientes en la despensa

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `nombre` | TEXT | Nombre del ingrediente |
| `categoria` | ENUM | `lacteo`, `carnico`, `verdura`, `seco`, `bebida`, `limpieza` |
| `cantidad_actual` | NUMERIC(10,2) | Stock actual |
| `unidad` | TEXT | `kg`, `litros`, `unidades`, `g` |
| `stock_minimo` | NUMERIC(10,2) | Umbral de alerta |
| `costo_unitario` | NUMERIC(10,2) | Precio por unidad |
| `proveedor` | TEXT | Nombre del proveedor |
| `sucursal_id` | UUID → sucursales | Sucursal a la que pertenece |
| `ultima_actualizacion` | TIMESTAMPTZ | Último cambio |

#### `solicitudes_abastecimiento` — Pedidos de más/menos stock

> **CU5 (Sandro):** El Administrador de Cocina no solo revisa el inventario. Crea una solicitud de aumento o disminución y el sistema actualiza el stock automáticamente al procesarla.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `inventario_id` | UUID → inventario | Ingrediente afectado |
| `tipo` | ENUM | `aumento` o `disminucion` |
| `cantidad_solicitada` | NUMERIC(10,2) | Cuánto se pide |
| `motivo` | TEXT | Razón del ajuste |
| `estado` | ENUM | `pendiente` → `procesada` → `rechazada` |
| `solicitado_por` | UUID → empleados | **Sinergia:** Admin de Cocina que solicita |
| `fecha_solicitud` | TIMESTAMPTZ | Cuándo se creó |
| `fecha_procesamiento` | TIMESTAMPTZ | Cuándo se aplicó |

#### `historial_pedido` — Trazabilidad de cada pedido

> **CU43 (Nihaht), CU44 (Nihaht), CU8 (Sandro):** Cada vez que un cocinero o despachador cambia el estado de un pedido, queda registrado aquí.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido afectado |
| `estado_anterior` | ENUM | `pendiente`, `en_preparacion`, `terminado`, `en_delivery`, `entregado`, `cancelado` |
| `estado_nuevo` | ENUM | El nuevo estado |
| `cambiado_por` | UUID → empleados | **Sinergia:** Cocinero o despachador que hizo el cambio |
| `fecha_cambio` | TIMESTAMPTZ | Cuándo ocurrió |

#### `mensajes_cliente` — Chat con el cliente

> **CU10 (Danilo):** El despachador se comunica con el cliente.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido relacionado |
| `mensaje` | TEXT | Contenido del mensaje |
| `direccion` | ENUM | `hacia_cliente` o `desde_cliente` |
| `enviado_por` | UUID → empleados | **Sinergia:** Despachador que escribe |
| `fecha` | TIMESTAMPTZ | Cuándo se envió |

#### `equipos` — Equipos de cocina

> **CU45 (Nihaht) y mantenimiento general:** Activos físicos del restaurante.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `nombre` | TEXT | Nombre del equipo |
| `tipo` | ENUM | `horno`, `refrigerador`, `estufa`, `lavavajillas`, `batidora`, `otro` |
| `numero_serie` | TEXT | Número de serie |
| `estado` | ENUM | `operativo` → `requiere_mantenimiento` → `fuera_de_servicio` |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `fecha_compra` | DATE | Fecha de adquisición |

#### `mantenimientos` — Historial de reparaciones

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `equipo_id` | UUID → equipos | Equipo reparado |
| `descripcion` | TEXT | Qué se hizo |
| `tecnico_id` | UUID → empleados | **Sinergia:** Técnico que realizó la reparación |
| `costo` | NUMERIC(10,2) | Costo de la reparación |
| `fecha` | TIMESTAMPTZ | Cuándo se hizo |

#### `incidentes_cocina` — Problemas en cocina

> **CU45 (Nihaht):** El cocinero reporta fallas de equipo, falta de insumos u otros problemas. **Diferente** a los incidentes de personal del Módulo B.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `tipo` | ENUM | `falla_equipo`, `falta_insumo`, `otro` |
| `titulo` | TEXT | Título del incidente |
| `descripcion` | TEXT | Descripción detallada |
| `severidad` | ENUM | `baja`, `media`, `alta`, `critica` |
| `estado` | ENUM | `reportado`, `en_revision`, `en_progreso`, `resuelto`, `descartado` |
| `reportado_por` | UUID → empleados | **Sinergia:** Cocinero que reporta |
| `equipo_id` | UUID → equipos | **Sinergia:** Equipo afectado (si aplica) |
| `fecha_reporte` | TIMESTAMPTZ | Cuándo se reportó |
| `notas_resolucion` | TEXT | Cómo se resolvió |

---

### Modelos del Módulo B — Personal (Equipo Rocket)

#### `empleados` — Toda la gente del restaurante

> **CU1, CU2, CU4, CU7 (Camila) y CU7 (Fernando):** Es el centro del sistema. Todo el que interactúa con la plataforma está aquí.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `email` | TEXT | Correo para login (único) |
| `contraseña` | TEXT | Hash bcrypt |
| `nombre` | TEXT | Nombre |
| `apellido` | TEXT | Apellido |
| `rol` | ENUM | `admin`, `gerente`, `cocinero`, `cajero`, `despachador`, `aseo`, `mantenimiento` |
| `sucursal_id` | UUID → sucursales | Sucursal asignada |
| `telefono` | TEXT | Teléfono de contacto |
| `estado` | ENUM | `activo`, `inactivo`, `suspendido` |
| `fecha_creacion` | TIMESTAMPTZ | Fecha de alta |
| `ultima_actualizacion` | TIMESTAMPTZ | Última modificación |

#### `turnos` — Horarios de trabajo

> **CU3, CU6 (Camila y Fernando):** Define cuándo trabaja cada empleado.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `empleado_id` | UUID → empleados | Empleado |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `dia_semana` | INTEGER | 0=Domingo ... 6=Sábado |
| `hora_inicio` | TIME | Hora de entrada |
| `hora_fin` | TIME | Hora de salida |
| `vigencia_desde` | DATE | Desde cuándo aplica |
| `vigencia_hasta` | DATE | Hasta cuándo (vacío = indefinido) |
| `activo` | BOOLEAN | Si está vigente |

#### `asistencias` — Quién llegó y a qué hora

> **CU5 (Fernando):** Verifica cumplimiento de horarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `empleado_id` | UUID → empleados | Empleado |
| `turno_id` | UUID → turnos | Turno programado |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `fecha` | DATE | Día |
| `hora_programada_inicio` | TIME | Hora de entrada programada |
| `hora_programada_fin` | TIME | Hora de salida programada |
| `hora_entrada` | TIMESTAMPTZ | Marcaje real de entrada |
| `hora_salida` | TIMESTAMPTZ | Marcaje real de salida |
| `estado` | ENUM | `presente`, `atrasado`, `ausente`, `justificado` |
| `minutos_atraso` | INTEGER | Minutos de retraso (calculado) |
| `observaciones` | TEXT | Notas |

#### `tareas` — Trabajos asignados al personal

> **CU8 (Fernando), CU9 (Santiago), CU11 (Santiago):** El gerente asigna tareas, el empleado las ve y las marca como cumplidas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `titulo` | TEXT | Título de la tarea |
| `descripcion` | TEXT | Descripción detallada |
| `tipo` | ENUM | `mantenimiento`, `limpieza`, `reparacion`, `inventario`, `otro` |
| `prioridad` | ENUM | `baja`, `media`, `alta`, `critica` |
| `estado` | ENUM | `pendiente`, `en_progreso`, `completada`, `cancelada` |
| `asignado_a` | UUID → empleados | Empleado responsable |
| `asignado_por` | UUID → empleados | Gerente/Supervisor que la asignó |
| `area` | TEXT | Zona de trabajo |
| `equipo_relacionado_id` | UUID → equipos | **Sinergia:** Si la tarea es reparar un equipo |
| `fecha_limite` | TIMESTAMPTZ | Fecha máxima de cumplimiento |
| `completada_en` | TIMESTAMPTZ | Cuándo se marcó como cumplida |
| `notas` | TEXT | Observaciones |

#### `evidencias_tarea` — Fotos de tarea cumplida

> **CU11 (Santiago):** El empleado adjunta evidencia al reportar cumplimiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `tarea_id` | UUID → tareas | Tarea |
| `foto_url` | TEXT | URL de la imagen |
| `descripcion` | TEXT | Descripción de la evidencia |
| `subido_por` | UUID → empleados | Quién subió la foto |
| `fecha` | TIMESTAMPTZ | Cuándo se subió |

#### `areas` — Zonas del local

> **CU10 (Santiago):** El empleado consulta qué zonas le tocan.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre` | TEXT | Nombre del área (ej. "Cocina Zona Caliente") |

#### `incidentes_personal` — Accidentes o problemas del empleado

> **CU12 (Santiago):** El empleado reporta accidentes laborales. **Diferente** a `incidentes_cocina` (Módulo A), que es para fallas de equipo/insumos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `tipo` | ENUM | `accidente_laboral`, `enfermedad`, `conflicto`, `otro` |
| `descripcion` | TEXT | Descripción de lo ocurrido |
| `severidad` | ENUM | `leve`, `moderada`, `grave` |
| `estado` | ENUM | `reportado`, `investigando`, `resuelto` |
| `reportado_por` | UUID → empleados | Quién lo reportó |
| `empleado_afectado_id` | UUID → empleados | Quién sufrió el incidente |
| `fecha_incidente` | TIMESTAMPTZ | Cuándo ocurrió |
| `lugar` | TEXT | Dónde ocurrió |
| `testigos` | TEXT | Nombres de testigos |
| `acciones_tomadas` | TEXT | Qué se hizo al respecto |

---

### Datos Estáticos (Solo Lectura, Inserción Manual)

#### `pedidos` — Órdenes que entran al restaurante

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `numero_pedido` | INTEGER | Número secuencial |
| `sucursal_id` | UUID → sucursales | Sucursal |
| `nombre_cliente` | TEXT | Nombre del cliente |
| `telefono_cliente` | TEXT | Teléfono |
| `direccion_cliente` | TEXT | Dirección de entrega |
| `estado` | ENUM | `pendiente`, `en_preparacion`, `terminado`, `en_delivery`, `entregado`, `cancelado` |
| `cocinero_asignado_id` | UUID → empleados | **Sinergia:** Cocinero que prepara |
| `despachador_asignado_id` | UUID → empleados | **Sinergia:** Despachador que entrega |
| `tiempo_estimado_entrega` | TIMESTAMPTZ | Hora estimada |
| `tiempo_real_entrega` | TIMESTAMPTZ | Hora real |
| `motivo_cancelacion` | TEXT | Si fue cancelado |
| `notas` | TEXT | Notas adicionales |
| `fecha_creacion` | TIMESTAMPTZ | Cuándo entró |

#### `items_pedido` — Platos comprados

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido padre |
| `nombre` | TEXT | Nombre del plato |
| `cantidad` | INTEGER | Cuántas unidades |
| `notas` | TEXT | Notas del cliente |

#### `ingredientes_item` — Ingredientes de cada plato

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `item_id` | UUID → items_pedido | Plato |
| `nombre_ingrediente` | TEXT | Ingrediente |

#### `pagos` — Pagos recibidos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Clave primaria |
| `pedido_id` | UUID → pedidos | Pedido |
| `monto` | NUMERIC(10,2) | Monto pagado |
| `metodo` | TEXT | `transferencia`, `efectivo`, `tarjeta` |
| `fecha_pago` | TIMESTAMPTZ | Cuándo se pagó |

---

## Puntos de Sinergia (FKs que cruzan los módulos)

Las sinergias son las relaciones entre tablas de equipos distintos. Son la razón de ser del sistema unificado.

| # | Situación real | FK | Tabla A | Tabla B |
|---|---------------|-----|---------|---------|
| 1 | Cocinero cambia estado de un pedido | `historial_pedido.cambiado_por` → `empleados.id` | Módulo A | Módulo B |
| 2 | Despachador envía mensaje al cliente | `mensajes_cliente.enviado_por` → `empleados.id` | Módulo A | Módulo B |
| 3 | Admin de Cocina solicita abastecimiento | `solicitudes_abastecimiento.solicitado_por` → `empleados.id` | Módulo A | Módulo B |
| 4 | Técnico repara equipo | `mantenimientos.tecnico_id` → `empleados.id` | Módulo A | Módulo B |
| 5 | Cocinero reporta incidente de cocina | `incidentes_cocina.reportado_por` → `empleados.id` | Módulo A | Módulo B |
| 6 | Incidente de cocina asociado a equipo | `incidentes_cocina.equipo_id` → `equipos.id` | Módulo A | Módulo A |
| 7 | Gerente asigna tarea a empleado | `tareas.asignado_a` → `empleados.id` | Módulo B | Módulo B |
| 8 | Gerente asigna tarea sobre un equipo | `tareas.equipo_relacionado_id` → `equipos.id` | Módulo B | Módulo A |
| 9 | Empleado reporta incidente personal | `incidentes_personal.reportado_por` → `empleados.id` | Módulo B | Módulo B |
| 10 | Incidente personal identifica afectado | `incidentes_personal.empleado_afectado_id` → `empleados.id` | Módulo B | Módulo B |
| 11 | Pedido asignado a cocinero | `pedidos.cocinero_asignado_id` → `empleados.id` | Datos estáticos | Módulo B |
| 12 | Pedido asignado a despachador | `pedidos.despachador_asignado_id` → `empleados.id` | Datos estáticos | Módulo B |

---

## Casos de Uso por Responsable

### Módulo A — Herederos de Epstein

| CU | Responsable | Actor | Descripción |
|----|-------------|-------|-------------|
| CU43 | Nihaht | Personal de Cocina | Despachar pedido: cambiar estado de "en preparación" a "terminado" |
| CU44 | Nihaht | Personal de Cocina | Visualizar cola de producción con filtros (ingrediente, cantidad, tiempo) |
| CU45 | Nihaht | Personal de Cocina | Reportar incidencia en cocina (falta insumo, falla equipo) |
| CU5 | Sandro | Admin de Cocina | Gestionar abastecimiento de insumos vía solicitudes automáticas |
| CU6 | Sandro | Admin de Cocina | Gestionar personal de cocina (turnos y roles) |
| CU7 | Sandro | Despachador | Registrar pedido para cocina (recibe de la app estática) |
| CU8 | Sandro | Despachador | Supervisar progreso de pedidos |
| CU9 | Danilo | Despachador | Coordinar despacho con delivery |
| CU10 | Danilo | Despachador | Gestionar comunicación con cliente |
| CU11 | Danilo | Despachador | Registrar pago de entrega |
| CU12 | Danilo | Despachador | Cancelar pedido de cliente |

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

## Estructura del Proyecto

```
DeliverThePeople/
│
├── client/                              # Frontend — React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx        # Navbar + Sidebar + Outlet
│   │   │       ├── Navbar.jsx           # Barra superior
│   │   │       └── Sidebar.jsx          # 9 ítems de navegación
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── Dashboard.jsx            # KPIs del sistema
│   │   │   ├── PlaceholderPage.jsx      # "Módulo en desarrollo"
│   │   │   └── NotFound.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Autenticación JWT
│   │   ├── services/
│   │   │   └── api.js                   # Axios config
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── router/
│   │   │   ├── AppRouter.jsx            # Rutas de la app
│   │   │   └── PrivateRoute.jsx         # Protección por rol
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                    # Tailwind
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                              # Backend — Express + pg
│   ├── config/
│   │   └── db.js                        # pg Pool → Supabase
│   ├── models/                          # Queries SQL por tabla
│   │   ├── empleado.js
│   │   ├── pedido.js
│   │   ├── inventario.js
│   │   ├── equipo.js
│   │   ├── tarea.js
│   │   ├── incidenteCocina.js
│   │   ├── incidentePersonal.js
│   │   ├── turno.js
│   │   └── asistencia.js
│   ├── controllers/                     # Lógica de negocio
│   │   ├── authController.js
│   │   ├── empleadoController.js
│   │   ├── pedidoController.js
│   │   ├── inventarioController.js
│   │   ├── equipoController.js
│   │   ├── tareaController.js
│   │   ├── incidenteCocinaController.js
│   │   ├── incidentePersonalController.js
│   │   ├── turnoController.js
│   │   └── asistenciaController.js
│   ├── routes/                          # Endpoints REST
│   │   ├── authRoutes.js
│   │   ├── empleadoRoutes.js
│   │   ├── pedidoRoutes.js
│   │   ├── inventarioRoutes.js
│   │   ├── equipoRoutes.js
│   │   ├── tareaRoutes.js
│   │   ├── incidenteCocinaRoutes.js
│   │   ├── incidentePersonalRoutes.js
│   │   ├── turnoRoutes.js
│   │   └── asistenciaRoutes.js
│   ├── middleware/
│   │   ├── auth.js                      # JWT verify
│   │   ├── roleGuard.js                 # Autorización por rol
│   │   ├── validate.js                  # Validación de body
│   │   └── errorHandler.js              # Errores centralizados
│   ├── utils/
│   │   └── jwt.js                       # sign / verify
│   ├── seeds/                           # Datos de prueba
│   │   ├── sucursales.js
│   │   ├── empleados.js
│   │   ├── pedidos.js
│   │   └── index.js
│   ├── app.js
│   └── server.js
│
├── database/
│   └── migrations/
│       └── 00001_esquema_inicial.sql    # DDL completo del sistema
│
├── .env
├── .env.example
├── .gitignore
├── README.md
└── package.json                         # concurrently
```

---

## Configuración Inicial

### Requisitos

- Node.js 18+
- PostgreSQL (Supabase)
- Git

### Variables de Entorno (.env)

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
# Clonar
git clone https://github.com/NihahtMontes/DeliverThePeople.git
cd DeliverThePeople

# Instalar dependencias
npm install
npm install --prefix client
npm install --prefix server

# Crear base de datos en Supabase y ejecutar la migración
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f database/migrations/00001_esquema_inicial.sql

# Insertar datos de prueba
npm run seed

# Iniciar en desarrollo (frontend + backend)
npm run dev
```

---

## Navegación de la Aplicación

El layout tiene un **navbar superior** con logo, sucursal activa y avatar del usuario, y un **sidebar lateral** con 9 ítems de navegación agrupados:

| Grupo | Ítems |
|-------|-------|
| Principal | Dashboard |
| Operaciones | Órdenes, Delivery, Inventario, Equipos |
| Personal | Empleados, Turnos, Tareas |
| Sistema | Incidencias |

Cada ítem usa `react-router-dom` con resaltado automático al estar activo. El sidebar es colapsable (solo íconos) y responsive (se oculta en móvil con toggle).

---

## Roles del Sistema

| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `gerente` | Personal, turnos, tareas, incidencias, dashboard |
| `cocinero` | Órdenes (solo las asignadas), historial de pedidos, reportar incidencias de cocina |
| `despachador` | Órdenes, delivery, mensajes a cliente, pagos |
| `cajero` | Pagos, consulta de pedidos |
| `aseo` | Tareas asignadas, áreas, reportar cumplimiento, incidentes personales |
| `mantenimiento` | Equipos, mantenimientos, tareas de reparación |

---

## Plan de Desarrollo (5 Días)

| Día | Fecha | Objetivo |
|-----|-------|----------|
| **1** | Lun 9 Jun | Schema SQL completo + Setup del proyecto (Vite, Express, pg, Tailwind, concurrently) |
| **2** | Mar 10 Jun | Layout (Navbar + Sidebar + Router con 9 rutas) + Auth (JWT login/registro) |
| **3** | Mié 11 Jun | Dashboard con KPIs + Seeds de prueba + PlaceholderPages |
| **4** | Jue 12 Jun | CRUDs esenciales (empleados, inventario, equipos, tareas) + Sidebar responsive |
| **5** | Vie 13 Jun | Integración: conectar frontend a datos reales, pulir interacción, testing |
| — | Sáb 14 Jun | Buffer: correcciones finales, demo |

---

## Licencia

Este proyecto es privado y de uso interno para el restaurante.

---

## Equipos

| Equipo | Integrantes | Módulo |
|--------|-------------|--------|
| Los Herederos de Epstein | Nihaht, Sandro, Danilo | Cocina y Delivery |
| Rocket | Camila, Fernando, Santiago | Administración de Personal |
