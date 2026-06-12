import { useState } from 'react'
import { LogOut, User, MapPin, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logoDTP from '../../assets/logoDTP.png'

export default function Navbar() {
    const { logout, user } = useAuth()
    const [isBranchOpen, setIsBranchOpen] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState("Sucursal Cochabamba Centro")
    return (
        <nav className="bg-white/40 backdrop-blur-xl border-b border-white/60 px-6 h-16 shrink-0 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-2 font-bold text-xl text-orange-600">
                <img src={logoDTP} alt="DeliverThePeople Logo" className="h-12 w-auto object-contain" />
                DeliverThePeople
            </div>
            <div className="hidden md:block relative">
                <button 
                    onClick={() => setIsBranchOpen(!isBranchOpen)}
                    onBlur={() => setTimeout(() => setIsBranchOpen(false), 200)}
                    className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-white/60 shadow-sm px-3 py-1.5 rounded-lg transition-all hover:bg-white/70 focus:outline-none"
                >
                    <MapPin size={16} strokeWidth={2} className="text-orange-600" />
                    <span className="text-sm font-semibold text-gray-800">{selectedBranch}</span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBranchOpen && (
                    <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-xl overflow-hidden z-50">
                        <ul className="py-1">
                            {["Sucursal Cochabamba Centro", "Sucursal Norte"].map(branch => (
                                <li 
                                    key={branch}
                                    onClick={() => { setSelectedBranch(branch); setIsBranchOpen(false); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedBranch === branch ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-800 hover:bg-gray-100 hover:text-orange-600'}`}
                                >
                                    {branch}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-white/50 backdrop-blur-md border border-white/60 shadow-sm p-2 rounded-full">
                        <User size={18} strokeWidth={2} className="text-orange-600" />
                    </div>
                    <div className="hidden md:block text-sm">
                        <p className="font-semibold text-gray-800">{user?.nombre ? `${user.nombre} ${user.apellido}` : 'Cargando...'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.rol || 'Personal'}</p>
                    </div>
                </div>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <LogOut size={20} strokeWidth={2} />
                </button>
            </div>
        </nav>
    )
}