import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import OrdenesPage from '../pages/ordenes/OrdenesPage'
import ColaProduccionPage from '../pages/ordenes/ColaProduccionPage'
import DeliveryPage from '../pages/delivery/DeliveryPage'
import EquiposPage from '../pages/equipos/EquiposPage'
import PagosPage from '../pages/pagos/PagosPage'
import EmpleadosPage from '../pages/empleados/EmpleadosPage'
import TareasPage from '../pages/tareas/TareasPage'
import AreasPage from '../pages/areas/AreasPage'
import IncidenciasPage from '../pages/incidencias/IncidenciasPage'
import NotFound from '../pages/NotFound'

// Componente temporal para tus páginas (Inventario y Horarios) que programarás después
const TempPage = ({ nombre }) => <div className="p-6 text-gray-500 font-medium">Página de {nombre} (En desarrollo)</div>

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
            { path: 'inventario', element: <PrivateRoute roles={['admin', 'gerente']}><TempPage nombre="Inventario" /></PrivateRoute> },
            { path: 'equipos', element: <PrivateRoute roles={['admin', 'gerente', 'mantenimiento']}><EquiposPage /></PrivateRoute> },
            { path: 'pagos', element: <PrivateRoute roles={['admin', 'cajero', 'despachador']}><PagosPage /></PrivateRoute> },
            { path: 'empleados', element: <PrivateRoute roles={['admin', 'gerente']}><EmpleadosPage /></PrivateRoute> },
            { path: 'horarios', element: <PrivateRoute roles={['admin', 'gerente']}><TempPage nombre="Horarios" /></PrivateRoute> },
            { path: 'tareas', element: <PrivateRoute roles={['admin', 'gerente', 'cocinero', 'aseo', 'mantenimiento']}><TareasPage /></PrivateRoute> },
            { path: 'areas', element: <PrivateRoute roles={['admin', 'gerente', 'aseo']}><AreasPage /></PrivateRoute> },
            { path: 'incidencias', element: <PrivateRoute roles={['admin', 'gerente', 'cocinero', 'aseo']}><IncidenciasPage /></PrivateRoute> },
            { path: '*', element: <NotFound /> }
        ]
    }
])