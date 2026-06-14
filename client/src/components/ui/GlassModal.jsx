import { X } from 'lucide-react'

export default function GlassModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(6px)' }}>
      <div
        className="max-w-xl w-full overflow-hidden flex flex-col relative rounded-[1.75rem]"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.82)',
          boxShadow: `
            0 24px 64px rgba(31, 38, 135, 0.20),
            0 8px 24px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1px 0 rgba(0, 0, 0, 0.04)
          `
        }}
      >
        {/* Brillo decorativo superior — más pronunciado */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-[1.75rem]" />

        {/* Ribete de luz lateral izquierdo */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-white/80 via-white/30 to-transparent pointer-events-none" />

        {/* Header del Modal */}
        <div className="px-8 py-6 flex justify-between items-center relative z-10">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl transition-all focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Separador sutil */}
        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-gray-200/80 to-transparent" />

        {/* Cuerpo */}
        <div className="px-8 py-6 relative z-10 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
