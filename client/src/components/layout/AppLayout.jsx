import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf6f0 50%, #f5f0ff 100%)' }}>

            {/* ── Orbes de fondo ── */}

            {/* Pilar violeta izquierda (sidebar) — más intenso */}
            <div className="absolute top-[-15%] left-[-8%] w-[380px] h-[130%] bg-violet-600/50 blur-[130px] pointer-events-none" />

            {/* Orbe naranja — derecha arriba, muy presente */}
            <div className="absolute top-[-8%] right-[2%] w-[600px] h-[600px] bg-orange-500/45 rounded-full blur-[90px] pointer-events-none orb-a" />

            {/* Orbe indigo — abajo izquierda */}
            <div className="absolute bottom-[-15%] left-[18%] w-[650px] h-[650px] bg-indigo-500/40 rounded-full blur-[110px] pointer-events-none orb-b animation-delay-4000" />

            {/* Orbe teal — centro */}
            <div className="absolute top-[25%] left-[38%] w-[500px] h-[500px] bg-teal-400/35 rounded-full blur-[80px] pointer-events-none orb-c animation-delay-2000" />

            {/* Orbe azul — abajo derecha */}
            <div className="absolute bottom-[5%] right-[8%] w-[520px] h-[520px] bg-blue-500/35 rounded-full blur-[100px] pointer-events-none orb-d animation-delay-6000" />

            {/* Orbe rosa — centro arriba (nuevo) */}
            <div className="absolute top-[5%] left-[30%] w-[350px] h-[350px] bg-rose-400/30 rounded-full blur-[100px] pointer-events-none orb-e animation-delay-8000" />

            <Sidebar />
            <div className="flex flex-col flex-1 w-full z-10">
                <Navbar />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}