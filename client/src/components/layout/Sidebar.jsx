import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    Home, ChefHat, Truck, Package, Wrench, CreditCard,
    Users, Clock, ClipboardList, MapPin, AlertTriangle, Menu, ChevronLeft, ListOrdered
} from 'lucide-react'

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const location = useLocation()

    const menuGroups = [
        { title: 'Principal', items: [{ name: 'Dashboard', path: '/', icon: Home }] },
        {
            title: 'Cocina y Delivery',
            items: [
                { name: 'Órdenes', path: '/ordenes', icon: ChefHat },
                { name: 'Cola Producción', path: '/cola-produccion', icon: ListOrdered },
                { name: 'Delivery', path: '/delivery', icon: Truck },
                { name: 'Inventario', path: '/inventario', icon: Package },
                { name: 'Equipos', path: '/equipos', icon: Wrench },
                { name: 'Pagos', path: '/pagos', icon: CreditCard },
            ]
        },
        {
            title: 'Gestión de Personal',
            items: [
                { name: 'Empleados', path: '/empleados', icon: Users },
                { name: 'Turnos y Asist.', path: '/horarios', icon: Clock },
                { name: 'Tareas', path: '/tareas', icon: ClipboardList },
                { name: 'Áreas', path: '/areas', icon: MapPin },
            ]
        },
        { 
            title: 'Soporte', 
            items: [
                { name: 'Incidencias', path: '/incidencias', icon: AlertTriangle },
                { name: 'Mantenimiento', path: '/mantenimientos', icon: Wrench }
            ] 
        }
    ]

    return (
        <aside className={`bg-gray-900 border-r border-gray-800 text-white flex flex-col transition-all duration-300 z-20 shadow-2xl ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-800">
                {!isCollapsed && <span className="font-bold text-gray-200 uppercase tracking-wider text-sm">Menú</span>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}>
                    {isCollapsed ? <Menu size={24} strokeWidth={2} /> : <ChevronLeft size={24} strokeWidth={2} />}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                {menuGroups.map((group, index) => (
                    <div key={index} className="mb-6">
                        {!isCollapsed && <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path
                                const Icon = item.icon
                                return (
                                    <li key={item.path}>
                                        <NavLink to={item.path} className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                                            <Icon size={20} strokeWidth={2} />
                                            {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                                        </NavLink>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </aside>
    )
}