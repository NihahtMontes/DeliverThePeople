import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const response = await api.get('/auth/me')
                setUser(response.data.user)
            } catch {
                localStorage.removeItem('token')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        verifySession()
    }, [])

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { token, user: userData } = response.data

            localStorage.setItem('token', token)
            setUser(userData)
            return { success: true }
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Credenciales inválidas o error de servidor')
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
        window.location.replace('/login')
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}