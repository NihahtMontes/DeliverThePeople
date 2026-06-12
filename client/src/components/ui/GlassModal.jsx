import { X } from 'lucide-react'

export default function GlassModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[4px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-[2rem] max-w-xl w-full overflow-hidden flex flex-col transform transition-all relative">
        
        {/* Brillo decorativo superior */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

        {/* Header del Modal */}
        <div className="px-8 py-6 flex justify-between items-center relative z-10">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm flex items-center gap-3">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/40 text-gray-600 hover:text-gray-900 hover:bg-white/80 backdrop-blur-md rounded-full transition-all focus:outline-none shadow-sm shadow-black/5"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Contenido (Cuerpo del Formulario) */}
        <div className="px-8 pb-8 relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}
