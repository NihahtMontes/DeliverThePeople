# Guía de Frontend — Sandro

Tu responsabilidad es construir el cascarón del frontend donde todos los demás van a enchufar sus páginas. Tú pones la base, el layout, la navegación y el login. Después programas tus 4 casos de uso y dejas placeholders para el resto.

---

## Índice

| Sección | Contenido |
|---------|-----------|
| A | [Setup del proyecto](#a-setup-del-proyecto) |
| B | [Estructura de carpetas](#b-estructura-de-carpetas) |
| C | [Layout: Navbar + Sidebar](#c-layout-navbar--sidebar) |
| D | [Router y rutas protegidas](#d-router-y-rutas-protegidas) |
| E | [Autenticación y Login](#e-autenticación-y-login) |
| F | [Tus casos de uso](#f-tus-casos-de-uso) |
| G | [Placeholders para los demás](#g-placeholders-para-los-demás) |
| H | [Servicio API](#h-servicio-api) |
| I | [Cómo probar](#i-cómo-probar) |
| J | [Checklist de entrega](#j-checklist-de-entrega) |

---

## A. Setup del proyecto

Ejecuta estos comandos desde la raíz del proyecto:

```bash
# Crear proyecto Vite + React
npm create vite@latest client -- --template react

# Entrar a la carpeta client
cd client

# Instalar dependencias
npm install
npm install react-router-dom axios lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

### Configurar Tailwind

En `client/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

En `client/src/index.css`, reemplaza TODO el contenido con:

```css
@import "tailwindcss";
```

### Elimina lo que no sirve

Borra los archivos que Vite genera por defecto:
- `client/src/App.css`
- `client/src/assets/react.svg`
- Todo lo que esté dentro de `client/public/` excepto `vite.svg` (si quieres)

---

## B. Estructura de carpetas

Crea esta estructura dentro de `client/src/`:

```
src/
├── components/
│   └── layout/
│       ├── AppLayout.jsx       # Navbar + Sidebar + <Outlet />
│       ├── Navbar.jsx          # Barra superior: logo, sucursal, avatar
│       └── Sidebar.jsx         # Menú lateral con 2 módulos
├── pages/
│   ├── auth/
│   │   └── Login.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx       # KPIs + tabla de pedidos (TU CU8)
│   ├── ordenes/
│   │   ├── OrdenesPage.jsx     # Placeholder (Nihaht CU43)
│   │   └── ColaProduccionPage.jsx  # Placeholder (Nihaht CU44)
│   ├── delivery/
│   │   ├── DeliveryPage.jsx        # Placeholder (Danilo CU9)
│   │   └── ChatClientePage.jsx     # Placeholder (Danilo CU10)
│   ├── inventario/
│   │   ├── InventarioPage.jsx      # TU CU5 (Sandro)
│   │   └── SolicitudesPage.jsx     # TU CU5 (Sandro)
│   ├── equipos/
│   │   └── EquiposPage.jsx         # Placeholder (Nihaht CU45)
│   ├── pagos/
│   │   └── PagosPage.jsx           # Placeholder (Danilo CU11)
│   ├── empleados/
│   │   └── EmpleadosPage.jsx       # Placeholder (Rocket)
│   ├── horarios/
│   │   └── HorariosPage.jsx        # TU CU6 + Placeholder (Rocket)
│   ├── tareas/
│   │   └── TareasPage.jsx          # Placeholder (Rocket)
│   ├── areas/
│   │   └── AreasPage.jsx           # Placeholder (Rocket)
│   ├── incidencias/
│   │   └── IncidenciasPage.jsx     # Placeholder (Ambos equipos)
│   └── NotFound.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   └── api.js
├── hooks/
│   └── useAuth.js
├── router/
│   ├── AppRouter.jsx
│   └── PrivateRoute.jsx
├── App.jsx
├── main.jsx
└── index.css
```

---

## C. Layout: Navbar + Sidebar

### Sidebar.jsx

El sidebar tiene **dos grupos de navegación**, como está definido en el README:

```
🏠 Dashboard

🍳 Actividades de Cocina y Delivery
   ├── Órdenes           (/ordenes)
   ├── Cola Producción   (/cola-produccion)
   ├── Delivery          (/delivery)
   ├── Inventario        (/inventario)
   ├── Equipos           (/equipos)
   └── Pagos             (/pagos)

👥 Gestión de Personal
   ├── Empleados         (/empleados)
   ├── Turnos y Asist.   (/horarios)
   ├── Tareas            (/tareas)
   └── Áreas             (/areas)

⚠️ Incidencias           (/incidencias)
```

**Requisitos técnicos del Sidebar:**
- Colapsable: cuando está colapsado solo muestra íconos
- Responsive: en móvil se oculta con un botón toggle (hamburguesa)
- Resaltado automático: usa `useLocation()` de react-router-dom + `NavLink`
- Íconos de Lucide React: cada ítem tiene su ícono (Home, ChefHat, Truck, Package, Wrench, CreditCard, Users, Clock, ClipboardList, MapPin, AlertTriangle)

### Navbar.jsx

Barra superior con:
- Logo "DeliverThePeople" a la izquierda
- Selector de sucursal activa al centro
- Avatar del usuario + nombre + botón de cerrar sesión a la derecha

### AppLayout.jsx

```jsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

## D. Router y rutas protegidas

### AppRouter.jsx

Estructura de rutas con protección por rol:

```jsx
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
// ... importa todas las páginas

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'ordenes', element: <PrivateRoute roles={['admin','cocinero','gerente']}><OrdenesPage /></PrivateRoute> },
      { path: 'cola-produccion', element: <PrivateRoute roles={['admin','cocinero']}><ColaProduccionPage /></PrivateRoute> },
      { path: 'delivery', element: <PrivateRoute roles={['admin','despachador','gerente']}><DeliveryPage /></PrivateRoute> },
      { path: 'inventario', element: <PrivateRoute roles={['admin','gerente']}><InventarioPage /></PrivateRoute> },
      { path: 'equipos', element: <PrivateRoute roles={['admin','gerente','mantenimiento']}><EquiposPage /></PrivateRoute> },
      { path: 'pagos', element: <PrivateRoute roles={['admin','cajero','despachador']}><PagosPage /></PrivateRoute> },
      { path: 'empleados', element: <PrivateRoute roles={['admin','gerente']}><EmpleadosPage /></PrivateRoute> },
      { path: 'horarios', element: <PrivateRoute roles={['admin','gerente']}><HorariosPage /></PrivateRoute> },
      { path: 'tareas', element: <PrivateRoute roles={['admin','gerente','cocinero','aseo','mantenimiento']}><TareasPage /></PrivateRoute> },
      { path: 'areas', element: <PrivateRoute roles={['admin','gerente','aseo']}><AreasPage /></PrivateRoute> },
      { path: 'incidencias', element: <PrivateRoute roles={['admin','gerente','cocinero','aseo']}><IncidenciasPage /></PrivateRoute> },
      { path: '*', element: <NotFound /> }
    ]
  }
])
```

### PrivateRoute.jsx

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />

  return children
}
```

---

## E. Autenticación y Login

### AuthContext.jsx

Provee `user`, `login()`, `logout()`, `loading` a toda la app.

- `login(email, password)` → POST a `/api/auth/login` → guarda token en localStorage
- Al montar el contexto, verifica si hay token en localStorage y decodifica el usuario
- `logout()` → limpia localStorage y redirige a /login

### Login.jsx

Formulario con:
- Campo email
- Campo contraseña
- Botón "Iniciar Sesión"
- Manejo de errores (credenciales inválidas, servidor caído)
- Redirección automática al dashboard si ya hay sesión

### useAuth.js

Hook que consume `AuthContext`:

```jsx
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
```

---

## F. Tus casos de uso

### CU8 — Dashboard con KPIs y Supervisar Progreso

**Archivo:** `pages/dashboard/Dashboard.jsx`

**Qué mostrar:**
- KPIs en cards: Total de pedidos del día, Pedidos pendientes, Pedidos retrasados, Entregados
- Tabla de pedidos con columnas:
  - Número de pedido
  - Cliente
  - Estado (con badge de color: verde=entregado, amarillo=en_preparacion, rojo=retrasado, etc.)
  - Cocinero asignado
  - Tiempo estimado
  - Tiempo restante (en minutos)
- Los pedidos `retrasados` deben resaltarse en rojo
- Filtro por sucursal activa

**Endpoint:** `GET /api/pedidos?estado=pendiente,en_preparacion,retrasado`

---

### CU5 — Inventario y Solicitudes de Abastecimiento

**Archivos:** `pages/inventario/InventarioPage.jsx` y `pages/inventario/SolicitudesPage.jsx`

**InventarioPage:**
- Tabla con todos los insumos: nombre, categoría, cantidad actual, stock mínimo, proveedor
- Resaltar en rojo los que están en o bajo `stock_minimo`
- Botón "Solicitar ajuste" que abre modal/formulario

**SolicitudesPage:**
- Tabla de solicitudes: insumo, tipo (aumento/disminución), cantidad, estado
- Botón "Aprobar" / "Rechazar" en pendientes
- Al aprobar: cambia estado a `aprobada`, actualiza `inventario.cantidad_actual`

**Endpoints:**
- `GET /api/inventario`
- `POST /api/solicitudes-abastecimiento`
- `GET /api/solicitudes-abastecimiento`
- `PUT /api/solicitudes-abastecimiento/:id` (aprobar/rechazar)

---

### CU7 — Registrar Pedido

**Archivo:** `pages/ordenes/RegistrarPedido.jsx` (puede ser parte de la página de Órdenes o un botón que abre modal)

**Flujo:**
- Sandro ve pedidos que entraron como datos estáticos (estado `pendiente`)
- Selecciona uno y lo "registra" → cambia estado a `pendiente` (ya está, pero registra en historial)
- También puede crear un pedido manual desde cero (formulario con datos del cliente)

**Endpoint:** `POST /api/pedidos` (crear nuevo) o `PUT /api/pedidos/:id/registrar`

---

### CU6 — Gestionar Horarios del Personal de Cocina

**Archivo:** `pages/horarios/HorariosPage.jsx`

**Qué mostrar:**
- Tabla con filtro por empleado (solo rol `cocinero` y `despachador`)
- Columnas: empleado, fecha, hora inicio, hora fin, hora entrada real, estado
- Botón para crear nuevo horario (asignar día y horas a un empleado)
- Botón para editar horario existente

**Endpoints:**
- `GET /api/horarios-asistencias`
- `POST /api/horarios-asistencias`
- `PUT /api/horarios-asistencias/:id`

---

## G. Placeholders para los demás

Cada página que no programas tú debe tener un placeholder funcional. Crea un componente reutilizable:

```jsx
// components/PlaceholderPage.jsx
export default function PlaceholderPage({ titulo, descripcion, responsable }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <h2 className="text-2xl font-bold mb-2">{titulo}</h2>
      <p className="text-lg mb-1">{descripcion}</p>
      <p className="text-sm">Responsable: {responsable}</p>
      <span className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm">
        En desarrollo
      </span>
    </div>
  )
}
```

Páginas que necesitan placeholder:

| Ruta | Título | Descripción | Responsable |
|------|--------|-------------|-------------|
| `/ordenes` | Órdenes | Gestión de pedidos en cocina | Nihaht |
| `/cola-produccion` | Cola de Producción | Filtros por ingrediente, cantidad y tiempo | Nihaht |
| `/delivery` | Delivery | Coordinar despacho y entregas | Danilo |
| `/equipos` | Equipos | Catálogo de equipos y mantenimientos | Nihaht |
| `/pagos` | Pagos | Registro de pagos por pedido | Danilo |
| `/empleados` | Empleados | Registro y gestión del personal | Equipo Rocket |
| `/tareas` | Tareas | Asignación y seguimiento de tareas | Equipo Rocket |
| `/areas` | Áreas | Zonas del local | Equipo Rocket |
| `/incidencias` | Incidencias | Reporte de fallas, accidentes y conflictos | Ambos equipos |

---

## H. Servicio API

### services/api.js

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: agrega token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: si recibe 401, limpia sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## I. Cómo probar

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto levanta:
- Frontend en `http://localhost:5173`
- Backend en `http://localhost:3001`

### Datos de login de prueba

El backend expone estos usuarios (verifica con Nihaht los datos exactos del seed):

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@deliver.com | admin123 | admin |
| cocinero@deliver.com | cocina123 | cocinero |
| despachador@deliver.com | despacho123 | despachador |
| gerente@deliver.com | gerente123 | gerente |

---

## J. Checklist de entrega

- [ ] Proyecto Vite + React creado en `client/`
- [ ] Tailwind CSS configurado y funcionando
- [ ] Estructura de carpetas creada
- [ ] `Navbar.jsx` funcional (logo, sucursal, avatar, logout)
- [ ] `Sidebar.jsx` funcional (2 módulos, colapsable, responsive, íconos Lucide)
- [ ] `AppLayout.jsx` integrando Navbar + Sidebar + Outlet
- [ ] `AppRouter.jsx` con 11 rutas protegidas por rol
- [ ] `PrivateRoute.jsx` con verificación de token y rol
- [ ] `AuthContext.jsx` con login, logout y persistencia
- [ ] `Login.jsx` con formulario, validación y redirección
- [ ] `Dashboard.jsx` con KPIs y tabla de pedidos (TU CU8)
- [ ] `InventarioPage.jsx` con tabla de insumos (TU CU5)
- [ ] `SolicitudesPage.jsx` con aprobar/rechazar (TU CU5)
- [ ] Formulario "Registrar Pedido" (TU CU7)
- [ ] `HorariosPage.jsx` con tabla de horarios de cocina (TU CU6)
- [ ] `PlaceholderPage.jsx` reutilizable creado
- [ ] 9 páginas placeholder creadas
- [ ] `api.js` con interceptores JWT
- [ ] El proyecto corre con `npm run dev` sin errores
- [ ] Navegar entre todas las rutas del sidebar funciona
