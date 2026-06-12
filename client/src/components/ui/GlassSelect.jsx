import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function GlassSelect({ options, value, onChange, name, label }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-800 mb-1.5 drop-shadow-sm">{label}</label>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full bg-white/40 hover:bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 rounded-xl p-3 text-sm flex justify-between items-center cursor-pointer transition-all text-gray-800"
      >
        <span className="font-medium">{selected?.label || 'Seleccionar...'}</span>
        <ChevronDown size={16} className={`text-gray-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </div>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white/80 backdrop-blur-3xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="max-h-60 overflow-y-auto">
              {options.map(o => (
                <div 
                  key={o.value}
                  onClick={() => {
                    onChange({ target: { name, value: o.value } })
                    setOpen(false)
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${value === o.value ? 'bg-orange-500 text-white font-bold' : 'text-gray-800 font-medium hover:bg-orange-50 hover:text-orange-700'}`}
                >
                  {o.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
