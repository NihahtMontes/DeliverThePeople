export default function GlassInput({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  required = false, 
  placeholder = "", 
  icon: Icon 
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-800 mb-1.5 drop-shadow-sm flex items-center gap-2">
        {Icon && <Icon size={14} className="text-gray-600"/>}
        {label}
      </label>
      <input 
        required={required}
        type={type} 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full bg-white/40 hover:bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 rounded-xl p-3 text-sm font-medium text-gray-800 focus:bg-white/80 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-gray-500" 
        placeholder={placeholder} 
      />
    </div>
  )
}
