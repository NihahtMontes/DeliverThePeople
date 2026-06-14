import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Wrench, Loader, Eye, Archive,
  Hash, Calendar, AlertTriangle, CheckCircle, RotateCcw
} from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'

const TIPOS = ['horno', 'refrigerador', 'congelador', 'estufa', 'lavavajillas', 'batidora', 'freidora', 'otro']
const URGENCIAS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' }
]

const ESTADO_CONFIG = {
  OPERATIVO:              { label: 'Operativo',              cls: 'bg-green-100 text-green-700' },
  REQUIERE_MANTENIMIENTO: { label: 'Req. Mantenimiento',     cls: 'bg-yellow-100 text-yellow-700' },
  FUERA_DE_SERVICIO:      { label: 'Fuera de Servicio',      cls: 'bg-red-100 text-red-700' },
  INACTIVO:               { label: 'Inactivo',               cls: 'bg-gray-200 text-gray-600' }
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

const FORM_INICIAL = {
  nombre: '', tipo: 'horno', marca: '', modelo: '',
  numero_serie: '', capacidad: '', descripcion: '', fecha_compra: ''
}
const FORM_MOV_INICIAL = { descripcion_falla: '', urgencia: 'MEDIA', observaciones_inicio: '' }

export default function EquiposPage() {
  const [equipos, setEquipos]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  // Filtros
  const [busqueda, setBusqueda]           = useState('')
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [verInactivos, setVerInactivos]   = useState(false)

  // Modales
  const [modalForm, setModalForm]         = useState(false)   // Alta / Edición
  const [modalDetalle, setModalDetalle]   = useState(false)
  const [modalMant, setModalMant]         = useState(false)   // Solicitar Mantenimiento
  const [modalBaja, setModalBaja]         = useState(false)   // Confirmar baja

  const [equipoActivo, setEquipoActivo]   = useState(null)    // equipo seleccionado
  const [esEdicion, setEsEdicion]         = useState(false)

  const [formData, setFormData]           = useState(FORM_INICIAL)
  const [formMant, setFormMant]           = useState(FORM_MOV_INICIAL)
  const [submitting, setSubmitting]       = useState(false)

  const fetchEquipos = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/equipos')
      setEquipos(data.equipos)
      setError(null)
    } catch (err) {
      setError('No se pudieron cargar los equipos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEquipos() }, [])

  // ── Apertura de Modales ────────────────────────────────────────────────────

  const openNuevo = () => {
    setEsEdicion(false)
    setFormData(FORM_INICIAL)
    setModalForm(true)
  }

  const openEditar = (eq) => {
    setEsEdicion(true)
    setEquipoActivo(eq)
    setFormData({
      nombre: eq.nombre, tipo: eq.tipo, marca: eq.marca, modelo: eq.modelo,
      numero_serie: eq.numero_serie, capacidad: eq.capacidad || '',
      descripcion: eq.descripcion || '', fecha_compra: eq.fecha_compra || ''
    })
    setModalForm(true)
  }

  const openDetalle = (eq) => { setEquipoActivo(eq); setModalDetalle(true) }

  const openMant = (eq) => {
    setEquipoActivo(eq)
    setFormMant(FORM_MOV_INICIAL)
    setModalMant(true)
  }

  const openBaja = (eq) => { setEquipoActivo(eq); setModalBaja(true) }

  // ── Handlers API ──────────────────────────────────────────────────────────

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleChangeMant = (e) => setFormMant({ ...formMant, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (esEdicion) {
        await api.put(`/equipos/${equipoActivo.id}`, formData)
      } else {
        await api.post('/equipos', formData)
      }
      setModalForm(false)
      fetchEquipos()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el equipo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBaja = async () => {
    try {
      await api.delete(`/equipos/${equipoActivo.id}`)
      setModalBaja(false)
      fetchEquipos()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al dar de baja el equipo.')
    }
  }

  const handleReactivar = async (eq) => {
    try {
      await api.post(`/equipos/${eq.id}/reactivar`)
      fetchEquipos()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reactivar el equipo.')
    }
  }


  const handleSolicitarMant = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/equipos/${equipoActivo.id}/mantenimiento`, formMant)
      setModalMant(false)
      fetchEquipos()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al solicitar mantenimiento.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const equiposFiltrados = equipos.filter(eq => {
    const coincideNombre = eq.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           eq.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
                           eq.numero_serie.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado ? eq.estado === filtroEstado : true
    const coincideActivo = verInactivos ? true : eq.activo
    return coincideNombre && coincideEstado && coincideActivo
  })

  const equiposConProblemas = equipos.filter(
    eq => eq.activo && (eq.estado === 'REQUIERE_MANTENIMIENTO' || eq.estado === 'FUERA_DE_SERVICIO')
  )

  // ── Helpers UI ─────────────────────────────────────────────────────────────

  const puedesolicitarMant = (eq) =>
    eq.activo && eq.estado === 'OPERATIVO'

  const labelMantBtn = (eq) => {
    if (!eq.activo) return null
    if (eq.estado === 'REQUIERE_MANTENIMIENTO') return 'Ticket pendiente'
    if (eq.estado === 'FUERA_DE_SERVICIO')      return 'En reparación'
    return null
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Gestión de Equipos</h1>
          <p className="text-sm text-gray-500 font-medium">Catálogo físico de la sucursal</p>
        </div>
        <button
          onClick={openNuevo}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 font-semibold text-sm active:scale-[0.98]"
        >
          <Plus size={18} /> Registrar nuevo equipo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, marca o serie..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={verInactivos}
            onChange={e => setVerInactivos(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 w-4 h-4"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader className="animate-spin text-orange-600" size={32} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-600">
                <th className="p-5 font-bold">Equipo</th>
                <th className="p-5 font-bold">Tipo</th>
                <th className="p-5 font-bold">N° Serie</th>
                <th className="p-5 font-bold">Estado</th>
                <th className="p-5 font-bold">Fecha Compra</th>
                <th className="p-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {equiposFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 font-medium">
                    No hay equipos que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                equiposFiltrados.map(eq => (
                  <tr
                    key={eq.id}
                    className={`border-b border-gray-50 transition-colors ${
                      !eq.activo ? 'opacity-50 bg-gray-50/30' : 'hover:bg-orange-50/20'
                    }`}
                  >
                    <td className="p-5">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        <Wrench size={14} className="text-orange-400 flex-shrink-0" />
                        {eq.nombre}
                        {!eq.activo && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wider">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {eq.marca} · {eq.modelo}
                      </div>
                    </td>
                    <td className="p-5 capitalize font-medium">{eq.tipo}</td>
                    <td className="p-5">
                      <span className="font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded text-xs">
                        {eq.numero_serie}
                      </span>
                    </td>
                    <td className="p-5">
                      <EstadoBadge estado={eq.estado} />
                    </td>
                    <td className="p-5 text-gray-500 text-xs">{eq.fecha_compra || '—'}</td>
                    <td className="p-5">
                      <div className="flex justify-end items-center gap-1">
                        {/* Solicitar Mantenimiento */}
                        {eq.activo && (
                          puedesolicitarMant(eq) ? (
                            <button
                              onClick={() => openMant(eq)}
                              className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                              title="Solicitar Mantenimiento"
                            >
                              <Wrench size={17} />
                            </button>
                          ) : (
                            <span
                              className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                              title={labelMantBtn(eq)}
                            >
                              <Wrench size={17} />
                            </span>
                          )
                        )}
                        <button onClick={() => openDetalle(eq)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Ver detalle">
                          <Eye size={17} />
                        </button>
                        {eq.activo && (
                          <button onClick={() => openEditar(eq)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar">
                            <Edit2 size={17} />
                          </button>
                        )}
                        {eq.activo && (
                          <button onClick={() => openBaja(eq)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Dar de baja">
                            <Archive size={17} />
                          </button>
                        )}
                        {!eq.activo && (
                          <button onClick={() => handleReactivar(eq)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Reactivar equipo">
                            <RotateCcw size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Alta / Edición ── */}
      <GlassModal
        isOpen={modalForm}
        onClose={() => setModalForm(false)}
        title={esEdicion ? `Editar: ${equipoActivo?.nombre}` : 'Registrar Nuevo Equipo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input required name="nombre" value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
                placeholder="Ej. Batidora Industrial KitchenAid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo <span className="text-red-500">*</span></label>
              <select required name="tipo" value={formData.tipo} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm capitalize">
                {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
              <input required name="marca" value={formData.marca} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
                placeholder="Ej. KitchenAid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
              <input required name="modelo" value={formData.modelo} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
                placeholder="Ej. KSM150PSER" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de Serie <span className="text-red-500">*</span></label>
              <input required name="numero_serie" value={formData.numero_serie} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm font-mono"
                placeholder="SN-00001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input name="capacidad" value={formData.capacidad} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
                placeholder="Ej. 5L, 80kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra</label>
              <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={2}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm resize-none"
                placeholder="Notas adicionales del equipo..." />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalForm(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl text-sm font-semibold shadow-md transition active:scale-[0.98] disabled:opacity-60">
              {submitting ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Registrar Equipo')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── Modal Detalle ── */}
      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title="Detalle del Equipo">
        {equipoActivo && (
          <div className="space-y-4 text-gray-800 text-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <Wrench size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900">{equipoActivo.nombre}</div>
                <div className="text-gray-500 text-xs">{equipoActivo.marca} · {equipoActivo.modelo}</div>
              </div>
              <div className="ml-auto">
                <EstadoBadge estado={equipoActivo.estado} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-500 block">Tipo</span><span className="font-semibold capitalize">{equipoActivo.tipo}</span></div>
              <div><span className="text-xs text-gray-500 block">N° de Serie</span><span className="font-mono font-semibold">{equipoActivo.numero_serie}</span></div>
              <div><span className="text-xs text-gray-500 block">Capacidad</span><span className="font-semibold">{equipoActivo.capacidad || '—'}</span></div>
              <div><span className="text-xs text-gray-500 block">Fecha de Compra</span><span className="font-semibold">{equipoActivo.fecha_compra || '—'}</span></div>
              <div><span className="text-xs text-gray-500 block">Activo</span>
                <span className={`font-bold ${equipoActivo.activo ? 'text-green-600' : 'text-red-600'}`}>
                  {equipoActivo.activo ? 'Sí' : 'No'}
                </span>
              </div>
              <div><span className="text-xs text-gray-500 block">Registrado</span><span className="font-semibold">{new Date(equipoActivo.created_at).toLocaleDateString()}</span></div>
            </div>
            {equipoActivo.descripcion && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Descripción</span>
                <p className="text-gray-700">{equipoActivo.descripcion}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setModalDetalle(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm">Cerrar</button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* ── Modal Solicitar Mantenimiento ── */}
      <GlassModal isOpen={modalMant} onClose={() => setModalMant(false)} title="Solicitar Mantenimiento">
        <form onSubmit={handleSolicitarMant} className="space-y-4">
          <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-sm">
            <div className="font-bold text-orange-800">{equipoActivo?.nombre}</div>
            <div className="text-orange-600 text-xs">{equipoActivo?.marca} · {equipoActivo?.modelo} · {equipoActivo?.numero_serie}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la falla <span className="text-red-500">*</span></label>
            <textarea required name="descripcion_falla" value={formMant.descripcion_falla} onChange={handleChangeMant}
              rows={3} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm resize-none"
              placeholder="Describe detalladamente el problema observado..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia <span className="text-red-500">*</span></label>
            <select required name="urgencia" value={formMant.urgencia} onChange={handleChangeMant}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm">
              {URGENCIAS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones iniciales</label>
            <input name="observaciones_inicio" value={formMant.observaciones_inicio} onChange={handleChangeMant}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
              placeholder="Contexto adicional (opcional)" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalMant(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-white bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-60">
              {submitting ? 'Enviando...' : 'Emitir Ticket'}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── Modal Confirmar Baja ── */}
      <GlassModal isOpen={modalBaja} onClose={() => setModalBaja(false)} title="Confirmar Baja Lógica">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">
            ¿Estás seguro de dar de baja el equipo{' '}
            <span className="font-bold text-gray-900">{equipoActivo?.nombre}</span>?
          </p>
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            El equipo pasará a estado <strong>INACTIVO</strong> y dejará de aparecer en las operaciones.
            El registro histórico se conservará.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button onClick={() => setModalBaja(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
            <button onClick={handleBaja}
              className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold shadow-md transition">
              Sí, dar de baja
            </button>
          </div>
        </div>
      </GlassModal>

    </div>
  )
}