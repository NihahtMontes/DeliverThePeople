import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import logoDTP from '../../assets/logoDTP.png'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const { user, login } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true })
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            await login(email, password)
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
            {/* Elementos decorativos / Orbes para Login animados */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/35 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/35 rounded-full blur-[140px] pointer-events-none animate-blob animation-delay-2000"></div>
            <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-emerald-500/30 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] bg-orange-500/35 rounded-full blur-[110px] pointer-events-none animate-blob animation-delay-6000"></div>
            <div className="absolute top-[35%] left-[35%] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[130px] pointer-events-none animate-blob animation-delay-2000"></div>
            
            {/* Nuevos Orbes para mayor densidad y movimiento */}
            <div className="absolute bottom-[30%] right-[30%] w-[350px] h-[350px] bg-pink-500/30 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000"></div>
            <div className="absolute top-[40%] right-[40%] w-[450px] h-[450px] bg-cyan-500/25 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-yellow-400/25 rounded-full blur-[90px] pointer-events-none animate-blob animation-delay-6000"></div>
            <div className="absolute bottom-[20%] left-[40%] w-[400px] h-[400px] bg-teal-500/30 rounded-full blur-[110px] pointer-events-none animate-blob animation-delay-2000"></div>

            {/* Aún más colores explosivos */}
            <div className="absolute top-[50%] left-[10%] w-[350px] h-[350px] bg-fuchsia-500/30 rounded-full blur-[110px] pointer-events-none animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-[40%] right-[10%] w-[300px] h-[300px] bg-lime-400/25 rounded-full blur-[90px] pointer-events-none animate-blob"></div>
            <div className="absolute top-[20%] right-[25%] w-[400px] h-[400px] bg-indigo-500/35 rounded-full blur-[130px] pointer-events-none animate-blob animation-delay-6000"></div>
            <div className="absolute bottom-[10%] left-[30%] w-[450px] h-[450px] bg-amber-400/30 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000"></div>

            <div className="max-w-md w-full bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <img src={logoDTP} alt="DeliverThePeople Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">DeliverThePeople</h2>
                    <p className="mt-2 text-sm text-gray-600">Ingresa a tu cuenta de personal</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} strokeWidth={2} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-white/50 rounded-lg bg-white/50 backdrop-blur-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-white/80 text-sm transition-all"
                                placeholder="ejemplo@deliver.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} strokeWidth={2} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-white/50 rounded-lg bg-white/50 backdrop-blur-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-white/80 text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    )
}