import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute({ children, roles }) {
    const { user, loading } = useAuth()

    if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
    if (!user) return <Navigate to="/login" replace />
    if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />

    return children
}