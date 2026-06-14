
Sistema Integral de Gestion de Restaurante: Cocina, Delivery y Recursos Humanos.

---

## Indice

| # | Seccion | Descripcion |
|---|---------|-------------|
| 1 | [Que es este proyecto?](#1-que-es-este-proyecto) | Idea central y valor principal |
| 2 | [Orden de Construccion](#2-orden-de-construccion) | Secuencia obligatoria de ejecucion |
| 3 | [Los Dos Equipos](#3-los-dos-equipos) | Integrantes y responsabilidades |
| 4 | [Stack Tecnologico](#4-stack-tecnologico) | Tecnologias por capa |
| 5 | [Modelo de Datos Definitivo](#5-modelo-de-datos-definitivo) | 16 tablas del sistema |
| 6 | [Maquina de Estados de Pedidos](#6-maquina-de-estados-de-pedidos) | Las 7 transiciones con actor y CU |
| 7 | [Puntos de Sinergia](#7-puntos-de-sinergia) | 13 FKs que cruzan modulos |
| 8 | [Casos de Uso](#8-casos-de-uso) | Todos los CUs con tablas involucradas |
| 9 | [Navegacion de la Aplicacion](#9-navegacion-de-la-aplicacion) | Sidebar, rutas, guia rapida |
| 10 | [Roles del Sistema](#10-roles-del-sistema) | Permisos por rol |
| 11 | [Estructura del Proyecto](#11-estructura-del-proyecto) | Arbol de carpetas y archivos |
| 12 | [Configuracion Inicial](#12-configuracion-inicial) | Requisitos, .env, instalacion y ejecucion |
| 13 | [Plan de Desarrollo](#13-plan-de-desarrollo) | Cronograma dia por dia |
| 14 | [Guias del Equipo](#14-guias-del-equipo) | Documentos para Danilo y Sandro |
| 15 | [Licencia y Equipos](#15-licencia-y-equipos) | |
| 16 | [API Endpoints](#16-api-endpoints) | Tabla completa de endpoints |
| 17 | [Seguridad](#17-seguridad) | JWT, rate limiting, CORS, roleGuard |
| 18 | [DB - ALTERs necesarios](#18-db---alters-necesarios) | Cambios requeridos en la DB |
| 19 | [Usuarios de Prueba](#19-usuarios-de-prueba) | Credenciales y como generar hashes |
| 20 | [Ejecucion (Bun)](#20-ejecucion-bun) | Como arrancar con Bun |
| 21 | [Ejecucion (Node.js)](#21-ejecucion-nodejs) | Como arrancar con Node.js |

---

## 1. Que es este proyecto?

Una plataforma web que fusiona dos modulos de software en un solo sistema de gestion de restaurante. Centraliza la operacion de cocina y delivery con la administracion de personal, turnos y tareas.

**Valor principal:** los cocineros, despachadores, tecnicos y demas personal que operan en cocina son los mismes empleados creados y gestionados por Recursos Humanos. Un solo sistema, una sola fuente de verdad.

---

## 2. Orden de Construccion

| Paso | Responsable | Entregable | Depende de |
|------|-------------|------------|------------|
| **1. Base de Datos** | **Danilo** | Crear proyecto en Supabase, ejecutar DDL, ejecutar seeds, compartir credenciales | Nadie |
| **2. Backend** | **Nihaht** | Servidor Express con controllers y rutas | Paso 1 |
| **3. Frontend Base** | **Sandro** | Layout (Navbar + Sidebar + Router), auth, Dashboard, placeholders | Paso 2 |
| **4. CUs de Cocina** | **Nihaht** | CU43, CU44, CU45 (Ordenes, Cola de Produccion, Incidencias) | Paso 3 |
| **5. CUs de Operaciones** | **Sandro** | CU5, CU6, CU7, CU8 (Inventario, Solicitudes, Registrar Pedido, Dashboard) | Paso 3 |
| **6. CUs de Delivery** | **Danilo** | CU9, CU10, CU11, CU12 (Despacho, Chat, Pagos, Cancelacion) | Paso 3 |
| **7. CUs de Personal** | **Rocket** | CU1-CU12 del Modulo B (Empleados, Turnos, Tareas, Areas, Incidencias) | Paso 3 |

**Regla:** Nadie avanza sin que el paso anterior este completado y verificado.

---

## 3. Los Dos Equipos

### Equipo A: "Los Herederos de Epstein"

| Integrante | Responsabilidad |
|------------|----------------|
| **Nihaht** | Despacho de pedidos, cola de produccion, reporte de incidencias |
| **Sandro** | Frontend base, abastecimiento, gestion de personal de cocina, registro de pedidos |
| **Danilo** | Supabase, coordinacion delivery, comunicacion con cliente, pagos, cancelacion |

### Equipo B: "Rocket"

| Integrante | Responsabilidad |
|------------|----------------|
| **Camila** | Registro de personal, actualizacion de datos, horarios |
| **Fernando** | Verificacion de horarios, modificacion, baja personal, asignacion de tareas |
| **Santiago** | Consulta de tareas, areas, reporte de cumplimiento, incidencias |

---

## 4. Stack Tecnologico

| Capa | Tecnologia | Proposito |
|------|-----------|-----------|
| Frontend | React + Vite | SPA con navegacion del lado cliente |
| Estilos | Tailwind CSS | Utility-first CSS |
| Iconos | Lucide React | Iconografia del sidebar y UI |
| Backend | Express | API RESTful |
| Runtime | **Bun** (recomendado) o Node.js 18+ | Ejecucion del backend |
| Base de Datos | PostgreSQL (Supabase) | Almacenamiento relacional |
| Conexion BD | pg (node-postgres) | Queries SQL desde Express |
| Autenticacion | JWT + bcryptjs | Login, roles y proteccion de rutas |
| Monorepo | concurrently | Ejecutar frontend + backend en paralelo |

---

## 5. Modelo de Datos Definitivo

### Tablas existentes (creadas por Danilo)

```
sucursales
empleados         (con password_hash para auth bcrypt)
areas
equipos           (con marca, modelo, capacidad, descripcion, activo)
mantenimientos    (con solicitante_id, tecnico_id, numero_ticket, urgencia, estado_ticket)
inventario
movimiento_inventario  (tipo_movimiento: INGRESO, MERMA)
pedidos           (sucursal_id, empleado_id, estado, total)
historial_pedido  (pedido_id, empleado_id, estado_anterior, estado_nuevo)
items_pedido      (pedido_id, item_id, cantidad, precio_unitario, subtotal)
ingredientes_item (item_id, ingrediente_id, cantidad_requerida)
pagos
horarios_asistencias
incidencias
tareas
mensajes_cliente
```

### ENUMs

```sql
enum_rol: admin, gerente, cocinero, despachador, cajero, aseo, mantenimiento, tecnico
enum_estado_equipo: OPERATIVO, REQUIERE_MANTENIMIENTO, FUERA_DE_SERVICIO, INACTIVO
enum_urgencia: BAJA, MEDIA, ALTA, CRITICA
enum_estado_ticket: PENDIENTE, EN_PROCESO, RETRASADO, COMPLETADO
enum_estado_pedido: PENDIENTE, EN_PREPARACION, LISTO, ENTREGADO, CANCELADO, RETRASADO
enum_tipo_movimiento: INGRESO, MERMA
```

---

## 6. Maquina de Estados de Pedidos

```
PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO
    │            │                         ↑
    └→ CANCELADO └→ CANCELADO    CANCELADO─┘
    │            │
    └→ RETRASADO ←┘ (por incidencia o timeout)
```

---

## 7. Casos de Uso

### Modulo A — Herederos de Epstein

| CU | Responsable | Descripcion | Estado |
|----|-------------|-------------|--------|
| **CU43** | Nihaht | Despachar pedido: PENDIENTE → EN_PREPARACION → LISTO | **COMPLETADO** |
| **CU44** | Nihaht | Cola de produccion con filtros (ingrediente, tiempo, estado) | **COMPLETADO** |
| **CU45** | Nihaht | Reportar incidencia en cocina (falta ingrediente, cambio) | **COMPLETADO** |
| CU5 | Sandro | Gestionar inventario via movimientos | **COMPLETADO** |
| CU6 | Sandro | Gestionar turnos del personal | Pendiente |
| CU7 | Sandro | Registrar pedido al flujo de cocina | Pendiente |
| CU8 | Sandro | Supervisar progreso + alertas de retraso | Pendiente |
| CU9a | Danilo | Enviar a delivery: LISTO → EN_DELIVERY | Pendiente |
| CU9b | Danilo | Confirmar entrega: EN_DELIVERY → ENTREGADO | Pendiente |
| CU10 | Danilo | Comunicacion con cliente | Pendiente |
| CU11 | Danilo | Registrar pago | Pendiente |
| CU12 | Danilo | Cancelar pedido | **COMPLETADO** (endpoint listo) |

### Modulo B — Rocket

| CU | Responsable | Descripcion |
|----|-------------|-------------|
| CU1 | Camila | Registrar personal con credenciales |
| CU2 | Camila | Actualizar datos del personal |
| CU3 | Camila | Asignar horarios |
| CU4 | Camila | Consultar personal por sucursal |
| CU5 | Fernando | Verificar cumplimiento de horarios |
| CU6 | Fernando | Modificar horario |
| CU7 | Fernando | Dar de baja al personal |
| CU8 | Fernando | Asignar tareas |
| CU9 | Santiago | Consultar tareas asignadas |
| CU10 | Santiago | Consultar areas asignadas |
| CU11 | Santiago | Reportar cumplimiento de tarea |
| CU12 | Santiago | Reportar incidentes del personal |

---

## 8. Roles del Sistema

| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `gerente` | Personal, turnos, tareas, incidencias, dashboard |
| `cocinero` | Ordenes (solo las asignadas), cola de produccion, incidencias de cocina |
| `despachador` | Ordenes, delivery, mensajes a cliente, pagos |
| `cajero` | Pagos, consulta de pedidos |
| `aseo` | Tareas asignadas, areas, reportar cumplimiento, incidencias personales |
| `mantenimiento` | Equipos, mantenimientos, tareas de reparacion |
| `tecnico` | Mantenimiento (iniciar, diagnosticar, finalizar) |

---

## 9. Navegacion de la Aplicacion

### Guia rapida de inicio

1. Abrir http://localhost:5173
2. Login con `admin@dtp.com` / `contra123`
3. Sidebar izquierdo:

```
Dashboard           → /
Ordenes             → /ordenes          (CU43)
Cola Produccion     → /cola-produccion  (CU44)
Inventario          → /inventario       (CU5)
Equipos             → /equipos          (CU45 parte)
Pagos               → /pagos            (CU11)
Empleados           → /empleados        (CU1-CU4)
Horarios            → /horarios         (CU5-CU7)
Tareas              → /tareas           (CU8-CU12)
Areas               → /areas
Incidencias         → /incidencias      (CU45)
Mantenimiento       → /mantenimientos   (CU45 parte)
```

---

## 10. Estructura del Proyecto

```
DeliverThePeople/
├── client/
│   ├── src/
│   │   ├── assets/            (logoDTP.png, logoIcono.png, hero.png)
│   │   ├── components/
│   │   │   ├── layout/        (AppLayout.jsx, Navbar.jsx, Sidebar.jsx)
│   │   │   ├── ui/            (GlassModal.jsx, GlassInput.jsx, GlassSelect.jsx)
│   │   │   └── PlaceholderPage.jsx
│   │   ├── context/           (AuthContext.jsx, ToastContext.jsx)
│   │   ├── hooks/             (useAuth.js, useToast.js, useNow.js)
│   │   ├── pages/
│   │   │   ├── auth/          (Login.jsx)
│   │   │   ├── dashboard/     (Dashboard.jsx)
│   │   │   ├── ordenes/       (OrdenesPage.jsx, ColaProduccionPage.jsx)
│   │   │   ├── inventario/    (InventarioPage.jsx, SolicitudesPage.jsx)
│   │   │   ├── equipos/       (EquiposPage.jsx)
│   │   │   ├── mantenimiento/ (MantenimientoPage.jsx)
│   │   │   ├── incidencias/   (IncidenciasPage.jsx)
│   │   │   ├── delivery/      (DeliveryPage.jsx, ChatClientePage.jsx)
│   │   │   ├── pagos/         (PagosPage.jsx)
│   │   │   ├── empleados/     (EmpleadosPage.jsx)
│   │   │   ├── horarios/      (HorariosPage.jsx)
│   │   │   ├── tareas/        (TareasPage.jsx)
│   │   │   └── areas/         (AreasPage.jsx)
│   │   ├── router/            (AppRouter.jsx, PrivateRoute.jsx)
│   │   ├── services/          (api.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js
│
├── server/
│   ├── config/                (db.js)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── equipoController.js
│   │   ├── inventarioController.js
│   │   ├── mantenimientoController.js
│   │   ├── pedidoController.js       ← NUEVO (CU43, CU44)
│   │   └── incidenciaController.js   ← NUEVO (CU45)
│   ├── middleware/             (auth.js, roleGuard.js, errorHandler.js)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── equipoRoutes.js
│   │   ├── inventarioRoutes.js
│   │   ├── mantenimientoRoutes.js
│   │   ├── pedidoRoutes.js           ← NUEVO
│   │   └── incidenciaRoutes.js       ← NUEVO
│   ├── utils/                 (jwt.js)
│   ├── app.js
│   ├── server.js
│   └── test-db.js
│
├── .env
├── .env.example
├── package.json               (concurrently)
└── README.md
```

---

## 11. Configuracion Inicial

### Requisitos

- **Bun 1.0+** (recomendado) o Node.js 18+
- Cuenta gratuita en [Supabase](https://supabase.com)
- Git

### Variables de Entorno (.env)

Crear `.env` en la raiz del proyecto (copiar de `.env.example`):

```env
PORT=3001

# Supabase PostgreSQL (conexion directa)
PGHOST=db.xxxxxxxxxxxx.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=tu_password_de_supabase

# JWT (OBLIGATORIO — sin esto el server NO arranca)
JWT_SECRET=clave_segura_de_32_caracteres_o_mas_aqui
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001/api
```

**NOTA:** `JWT_SECRET` NO tiene valor por defecto. Si no lo configuras, el servidor tira error al iniciar.

---

## 12. DB — ALTERs necesarios

Si tu DB ya existe pero no tiene estos cambios, ejecuta en Supabase SQL Editor:

```sql
-- Agregar RETRASADO al enum de pedidos
ALTER TYPE enum_estado_pedido ADD VALUE 'RETRASADO';

-- Agregar estado_anterior a historial_pedido
ALTER TABLE historial_pedido ADD COLUMN estado_anterior enum_estado_pedido;
```

---

## 13. Usuarios de Prueba

Todos los usuarios de prueba usan la contraseña: **`contra123`**

| Email | Rol | Nombre |
|-------|-----|--------|
| `admin@dtp.com` | admin | Admin Sistema |
| `gerente@dtp.com` | gerente | Maria Lopez |
| `cocinero@dtp.com` | cocinero | Carlos Perez |
| `tecnico@dtp.com` | tecnico | Luis Garcia |

### Generar hash para nuevos usuarios

```bash
# Con Bun
cd server && bun -e "const b=require('bcryptjs');console.log(b.hashSync('contra123',10))"

# Con Node.js
cd server && node -e "const b=require('bcryptjs');console.log(b.hashSync('contra123',10))"
```

Luego insertar:

```sql
INSERT INTO empleados (email, password_hash, nombre, apellido, rol, sucursal_id)
SELECT 'nuevo@dtp.com', 'HASH_GENERADO_AQUI', 'Nombre', 'Apellido', 'cocinero', id
FROM sucursales LIMIT 1;
```

---

## 14. Ejecucion (Bun)

```bash
# Instalar dependencias
bun install                # raiz (concurrently)
cd server && bun install   # backend
cd ../client && bun install # frontend

# Arrancar — 2 terminales separadas
# Terminal 1:
cd server && bun run dev
# → http://localhost:3001

# Terminal 2:
cd client && bun run dev
# → http://localhost:5173
```

Abrir http://localhost:5173 → login con `admin@dtp.com` / `contra123`

---

## 15. Ejecucion (Node.js)

```bash
# Instalar dependencias
npm install                # raiz
cd server && npm install
cd ../client && npm install

# Arrancar — 2 terminales separadas
# Terminal 1:
cd server && npm run dev
# → http://localhost:3001

# Terminal 2:
cd client && npm run dev
# → http://localhost:5173
```

Abrir http://localhost:5173 → login con `admin@dtp.com` / `contra123`

---

## 16. API Endpoints

### Auth

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login con email/password | No |
| GET | `/api/auth/me` | Obtener usuario actual | Si |

### Equipos

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/equipos` | Listar equipos | Cualquiera |
| POST | `/api/equipos` | Crear equipo | admin, gerente |
| PUT | `/api/equipos/:id` | Editar equipo | admin, gerente |
| DELETE | `/api/equipos/:id` | Baja logica | admin, gerente |
| POST | `/api/equipos/:id/reactivar` | Reactivar | admin, gerente |
| PATCH | `/api/equipos/:id/estado` | Cambiar estado | admin, gerente |
| POST | `/api/equipos/:id/mantenimiento` | Solicitar mantenimiento | admin, gerente |

### Inventario

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/inventario` | Listar insumos | Cualquiera |
| POST | `/api/inventario` | Crear insumo | admin, gerente |
| PUT | `/api/inventario/:id` | Editar insumo | admin, gerente |
| PUT | `/api/inventario/:id/estado` | Inactivar | admin, gerente |
| PUT | `/api/inventario/:id/reactivar` | Reactivar | admin, gerente |
| POST | `/api/inventario/:id/movimiento` | Registrar movimiento | admin, gerente |
| GET | `/api/inventario/:id/movimientos` | Bitacora de movimientos | Cualquiera |

### Mantenimientos

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/mantenimientos` | Listar tickets | Cualquiera |
| POST | `/api/mantenimientos/:id/iniciar` | PENDIENTE → EN_PROCESO | admin, gerente, tecnico |
| PATCH | `/api/mantenimientos/:id/diagnostico` | Actualizar diagnostico | admin, gerente, tecnico |
| POST | `/api/mantenimientos/:id/finalizar` | EN_PROCESO → COMPLETADO | admin, gerente, tecnico |

### Pedidos

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/pedidos` | Listar pedidos | Cualquiera |
| GET | `/api/pedidos/cola` | Cola de produccion con filtros | Cualquiera |
| POST | `/api/pedidos` | Crear pedido | admin, gerente, cocinero |
| POST | `/api/pedidos/:id/tomar` | PENDIENTE → EN_PREPARACION | admin, gerente, cocinero |
| PATCH | `/api/pedidos/:id/terminar` | EN_PREPARACION → LISTO | admin, gerente, cocinero |
| PATCH | `/api/pedidos/:id/cancelar` | ANY → CANCELADO | admin, gerente, cocinero |

### Incidencias

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/incidencias` | Listar incidencias | Cualquiera |
| POST | `/api/incidencias` | Reportar incidencia | admin, gerente, cocinero |
| PATCH | `/api/incidencias/:id/cerrar` | Cerrar incidencia | admin, gerente, cocinero |

---

## 17. Seguridad

| Cambio | Detalle |
|--------|---------|
| JWT sin fallback | `JWT_SECRET` es obligatorio. Sin el, el server no arranca. |
| Auth real | Login compara contra `password_hash` con bcrypt. Sin bypass. |
| Rate limiting | 5 intentos de login por minuto. |
| CORS restrictivo | Solo acepta requests de `FRONTEND_URL`. |
| roleGuard | Rutas de escritura requieren roles especificos. |
| Token verificado | El client verifica sesion contra `GET /auth/me` al cargar. |

---

## 18. Plan de Desarrollo

| Dia | Fecha | Objetivo | Estado |
|-----|-------|----------|--------|
| **1** | Lun 9 Jun | Modelo de datos + README + DDL | **COMPLETADO** |
| **2** | Mar 10 Jun | Supabase + Backend base Express | **COMPLETADO** |
| **3** | Mie 11 Jun | Frontend base: Layout + Router + Auth + Dashboard | **COMPLETADO** |
| **4** | Jue 12 Jun | CUs de Cocina (CU43, CU44, CU45) + Inventario (CU5) | **COMPLETADO** |
| **5** | Vie 13 Jun | CUs de Delivery (CU9-CU12) | Pendiente |
| — | Sab 14 Jun | Modulo B completo (CU1-CU12) | Pendiente |
| — | Dom 15 Jun | Integracion final, testing, correcciones | Pendiente |
| — | Lun 16 Jun | Entrega | — |

---

## 19. Guias del Equipo

| Guia | Para | Contenido |
|------|------|-----------|
| `GUIA_SUPABASE_DANILO.md` | Danilo | Crear proyecto Supabase, ejecutar DDL, seeds, compartir acceso |
| `GUIA_FRONTEND_SANDRO.md` | Sandro | Setup de Vite + React + Tailwind, layout, router, auth, CUs |

---

## 20. Licencia y Equipos

| Equipo | Integrantes | Modulo |
|--------|-------------|--------|
| Los Herederos de Epstein | Nihaht, Sandro, Danilo | Cocina y Delivery |
| Rocket | Camila, Fernando, Santiago | Administracion de Personal |
