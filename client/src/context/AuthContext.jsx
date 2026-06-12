import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Función auxiliar para decodificar la información del usuario del JWT
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
                window.atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            return JSON.parse(jsonPayload)
        } catch (error) {
            return null
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            const decoded = decodeToken(token)
            if (decoded) {
                setUser(decoded)
            } else {
                localStorage.removeItem('token')
            }
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { token } = response.data

            localStorage.setItem('token', token)
            const decoded = decodeToken(token)
            setUser(decoded)
            return { success: true }
        } catch (error) {
            console.error(error)
            throw new Error(error.response?.data?.message || 'Credenciales inválidas o error de servidor')
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}