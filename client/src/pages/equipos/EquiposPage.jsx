import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Wrench, Loader, Calendar, Hash } from 'lucide-react'
import api from '../../services/api' 
import GlassModal from '../../components/ui/GlassModal'
import GlassSelect from '../../components/ui/GlassSelect'
import GlassInput from '../../components/ui/GlassInput'

export default function EquiposPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [equipoEnEdicion, setEquipoEnEdicion] = useState(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'horno',
    numero_serie: '',
    estado: 'operativo',
    fecha_compra: ''
  })

  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Opciones para los combos
  const opcionesTipo = [
    { value: 'horno', label: 'Horno' },
    { value: 'refrigerador', label: 'Refrigerador' },
    { value: 'congelador', label: 'Congelador' },
    { value: 'estufa', label: 'Estufa' },
    { value: 'lavavajillas', label: 'Lavavajillas' },
    { value: 'batidora', label: 'Batidora' },
    { value: 'freidora', label: 'Freidora' }
  ];

  const opcionesEstado = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'requiere_mantenimiento', label: 'Req. Mantenimiento' },
    { value: 'fuera_de_servicio', label: 'Fuera de Servicio' }
  ];

  const fetchEquipos = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/equipos')
      setEquipos(data.equipos)
      setError(null)
    } catch (err) {
      console.error('Error al cargar equipos:', err)
      setError('No se pudieron cargar los equipos. Intenta de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipos()
  }, [])

  const handleOpenNuevo = () => {
    setEquipoEnEdicion(null)
    setFormData({ nombre: '', tipo: 'horno', numero_serie: '', estado: 'operativo', fecha_compra: '' })
    setIsModalOpen(true)
  }

  const handleOpenEditar = (equipo) => {
    setEquipoEnEdicion(equipo.id)
    setFormData({ ...equipo, numero_serie: equipo.numero_serie || '', fecha_compra: equipo.fecha_compra || '' })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      if (equipoEnEdicion) {
        const { data } = await api.put(`/equipos/${equipoEnEdicion}`, formData)
        setEquipos(equipos.map(eq => eq.id === equipoEnEdicion ? data.equipo : eq))
      } else {
        const { data } = await api.post('/equipos', formData)
        setEquipos([data.equipo, ...equipos])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error al guardar el equipo:', err)
      alert('Ocurrió un error al intentar guardar el equipo.')
    }
  }

  const handleDarDeBaja = async (id) => {
    if(window.confirm('¿Estás seguro de dar de baja este equipo? Pasará a Fuera de Servicio.')) {
      try {
        const { data } = await api.delete(`/equipos/${id}`)
        setEquipos(equipos.map(eq => eq.id === id ? data.equipo : eq))
      } catch (err) {
         console.error('Error al dar de baja el equipo:', err)
         alert('Ocurrió un error al intentar dar de baja el equipo.')
      }
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'operativo': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Operativo</span>
      case 'requiere_mantenimiento': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">Req. Mantenimiento</span>
      case 'fuera_de_servicio': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">Fuera de Servicio</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold capitalize">{estado?.replace('_', ' ')}</span>
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Gestión de Equipos</h1>
          <p className="text-sm text-gray-500 font-medium">Catálogo físico de la sucursal</p>
        </div>
        <button onClick={handleOpenNuevo} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 font-semibold text-sm active:scale-[0.98]">
          <Plus size={18} /> Registrar nuevo equipo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100 shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader className="animate-spin text-orange-600" size={32} />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-600">
                <th className="p-5 font-bold">Nombre del Equipo</th>
                <th className="p-5 font-bold">Tipo</th>
                <th className="p-5 font-bold">N° de Serie</th>
                <th className="p-5 font-bold">Fecha Compra</th>
                <th className="p-5 font-bold">Estado</th>
                <th className="p-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {equipos.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 font-medium">
                    No hay equipos registrados en esta sucursal.
                  </td>
                </tr>
              ) : (
                equipos.map((equipo) => (
                  <tr key={equipo.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="p-5 font-bold flex items-center gap-3"><Wrench size={16} className="text-orange-400" />{equipo.nombre}</td>
                    <td className="p-5 capitalize font-medium">{equipo.tipo}</td>
                    <td className="p-5 font-mono text-gray-500 bg-gray-50/50 rounded inline-block mt-3 mb-3 ml-5 px-2 py-1">{equipo.numero_serie || 'N/A'}</td>
                    <td className="p-5 font-medium">{equipo.fecha_compra || 'N/A'}</td>
                    <td className="p-5">{getEstadoBadge(equipo.estado)}</td>
                    <td className="p-5 flex justify-end gap-2">
                      <button onClick={() => handleOpenEditar(equipo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                      <button onClick={() => handleDarDeBaja(equipo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Dar de baja"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reutilizable */}
      <GlassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={equipoEnEdicion ? 'Editar Equipo' : 'Registrar Equipo'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <GlassInput 
            label="Nombre del Equipo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Batidora Industrial KitchenAid"
            required
          />
          
          <div className="grid grid-cols-2 gap-6">
            <GlassSelect 
              label="Tipo de Equipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              options={opcionesTipo}
            />
            <GlassSelect 
              label="Estado Actual"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              options={opcionesEstado}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <GlassInput 
              label="N° de Serie"
              name="numero_serie"
              value={formData.numero_serie}
              onChange={handleChange}
              placeholder="S/N Opcional"
              icon={Hash}
            />
            <GlassInput 
              label="Fecha de Compra"
              name="fecha_compra"
              type="date"
              value={formData.fecha_compra}
              onChange={handleChange}
              icon={Calendar}
            />
          </div>

          <div className="pt-4 flex justify-end gap-4 mt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} 
              className="px-6 py-3 text-sm font-bold text-gray-700 bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm shadow-black/5 hover:bg-white/80 hover:text-gray-900 rounded-xl transition-all">
              Cancelar
            </button>
            <button type="submit" 
              className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-600/90 to-orange-500/90 backdrop-blur-xl hover:from-orange-600 hover:to-orange-500 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2">
              {equipoEnEdicion ? 'Guardar Cambios' : 'Registrar Equipo'}
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  )
}