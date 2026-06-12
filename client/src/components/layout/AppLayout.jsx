import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
            {/* Elementos decorativos globales */}
            {/* Pilar de luz oscuro exclusivo para darle presencia al Sidebar */}
            <div className="absolute top-[-10%] left-[-5%] w-[350px] h-[120%] bg-violet-700/35 blur-[140px] pointer-events-none"></div>
            
            <div className="absolute top-[-10%] right-[5%] w-[500px] h-[500px] bg-orange-400/30 rounded-full blur-[100px] pointer-events-none animate-blob-subtle"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/25 rounded-full blur-[120px] pointer-events-none animate-blob-subtle animation-delay-4000"></div>
            <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-teal-400/25 rounded-full blur-[90px] pointer-events-none animate-blob-subtle animation-delay-2000"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none animate-blob-subtle animation-delay-6000"></div>

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