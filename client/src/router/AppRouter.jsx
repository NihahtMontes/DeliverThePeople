import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import OrdenesPage from '../pages/ordenes/OrdenesPage'
import ColaProduccionPage from '../pages/ordenes/ColaProduccionPage'
import DeliveryPage from '../pages/delivery/DeliveryPage'
import ChatClientePage from '../pages/delivery/ChatClientePage'
import EquiposPage from '../pages/equipos/EquiposPage'
import PagosPage from '../pages/pagos/PagosPage'
import EmpleadosPage from '../pages/empleados/EmpleadosPage'
import TareasPage from '../pages/tareas/TareasPage'
import AreasPage from '../pages/areas/AreasPage'
import IncidenciasPage from '../pages/incidencias/IncidenciasPage'
import MantenimientoPage from '../pages/mantenimiento/MantenimientoPage'
import NotFound from '../pages/NotFound'
import InventarioPage from '../pages/inventario/InventarioPage'
import HorariosPage from '../pages/horarios/HorariosPage'

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
            { path: 'ordenes', element: <PrivateRoute roles={['admin', 'cocinero', 'gerente']}><OrdenesPage /></PrivateRoute> },
            { path: 'cola-produccion', element: <PrivateRoute roles={['admin', 'cocinero']}><ColaProduccionPage /></PrivateRoute> },
            { path: 'delivery', element: <PrivateRoute roles={['admin', 'despachador', 'gerente']}><DeliveryPage /></PrivateRoute> },
            { path: 'chat-cliente', element: <PrivateRoute roles={['admin', 'despachador', 'gerente']}><ChatClientePage /></PrivateRoute> },
            { path: 'inventario', element: <PrivateRoute roles={['admin', 'gerente']}><InventarioPage /></PrivateRoute> },
            { path: 'equipos', element: <PrivateRoute roles={['admin', 'gerente', 'mantenimiento']}><EquiposPage /></PrivateRoute> },
            { path: 'pagos', element: <PrivateRoute roles={['admin', 'cajero', 'despachador']}><PagosPage /></PrivateRoute> },
            { path: 'empleados', element: <PrivateRoute roles={['admin', 'gerente']}><EmpleadosPage /></PrivateRoute> },
            { path: 'horarios', element: <PrivateRoute roles={['admin', 'gerente']}><HorariosPage /></PrivateRoute> },
            { path: 'tareas', element: <PrivateRoute roles={['admin', 'gerente', 'cocinero', 'aseo', 'mantenimiento']}><TareasPage /></PrivateRoute> },
            { path: 'areas', element: <PrivateRoute roles={['admin', 'gerente', 'aseo']}><AreasPage /></PrivateRoute> },
            { path: 'incidencias', element: <PrivateRoute roles={['admin', 'gerente', 'cocinero', 'aseo']}><IncidenciasPage /></PrivateRoute> },
            { path: 'mantenimientos', element: <PrivateRoute roles={['admin', 'gerente', 'mantenimiento']}><MantenimientoPage /></PrivateRoute> },
        ]
    },
    {
        path: '*',
        element: <NotFound />
    }
])