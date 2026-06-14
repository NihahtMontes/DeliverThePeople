import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AlertTriangle, Loader, Plus, Eye, Send, Clock, ChefHat,
  Package, Wrench, AlertCircle, CheckCircle2
} from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { useToast } from '../../hooks/useToast'

// ── Tipos de incidencia ──
const TIPOS = [
  { value: 'RETRASO_INGREDIENTE',   label: 'Retraso por Ingrediente',  icon: Package,     color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'CAMBIO_INGREDIENTE',   label: 'Cambio de Ingrediente',    icon: Package,     color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'FALLA_EQUIPO',          label: 'Falla de Equipo',          icon: Wrench,      color: 'text-red-600',    bg: 'bg-red-50' },
  { value: 'RETRASO_GENERAL',       label: 'Retraso General',          icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
  { value: 'OTRO',                  label: 'Otra Incidencia',          icon: AlertCircle, color: 'text-gray-600',   bg: 'bg-gray-50' }
]

// ── Prioridad ──
const PRIORIDADES = [
  { value: 'BAJA',     label: 'Baja',     cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
  { value: 'MEDIA',    label: 'Media',    cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
  { value: 'ALTA',     label: 'Alta',     cls: 'bg-red-100 text-red-700 border border-red-200' },
  { value: 'CRITICA',  label: 'Crítica',  cls: 'bg-red-200 text-red-900 border border-red-400 animate-pulse' }
]

// ── Estado de incidencia ──
const ESTADO_INC = {
  ABIERTA:   { label: 'Abierta',    cls: 'bg-yellow-100 text-yellow-700' },
  EN_REVISION: { label: 'En Revisión', cls: 'bg-blue-100 text-blue-700' },
  CERRADA:   { label: 'Cerrada',    cls: 'bg-green-100 text-green-700' },
  RECHAZADA: { label: 'Rechazada',  cls: 'bg-red-100 text-red-700' }
}

function TipoBadge({ tipo }) {
  const cfg = TIPOS.find(t => t.value === tipo) || TIPOS[4]
  const Icon = cfg.icon
  return (
    <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

function PrioridadBadge({ prioridad }) {
  const cfg = PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[0]
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
}

function EstadoIncBadge({ estado }) {
  const cfg = ESTADO_INC[estado] || { label: estado, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-1 rounded-md text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
}

const FORM_INICIAL = {
  tipo: 'RETRASO_INGREDIENTE',
  pedido_id: '',
  ingrediente_faltante: '',
  ingrediente_alternativo: '',
  descripcion: '',
  prioridad: 'ALTA'
}

export default function IncidenciasPage() {
  const toast = useToast()
  const [incidencias, setIncidencias] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Modales
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [incidenciaActiva, setIncidenciaActiva] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})

  const pollRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      const [resInc, resPed, resInv] = await Promise.all([
        api.get('/incidencias').catch(() => ({ data: { incidencias: [] } })),
        api.get('/pedidos').catch(() => ({ data: { pedidos: [] } })),
        api.get('/inventario').catch(() => ({ data: { productos: [] } }))
      ])
      setIncidencias(resInc.data.incidencias || [])
      // Solo pedidos activos para vinculación
      setPedidos((resPed.data.pedidos || []).filter(p => p.estado !== 'TERMINADO' && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'))
      const productos = resInv.data.productos || []
      setIngredientes(productos)
      setError(null)
    } catch {
      setError('No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = () => fetchData()
    init()
    // Polling cada 20s
    pollRef.current = setInterval(fetchData, 20000)
    return () => clearInterval(pollRef.current)
  }, [fetchData])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.pedido_id) errs.pedido_id = 'Selecciona un pedido.'
    if (!formData.ingrediente_faltante && formData.tipo === 'RETRASO_INGREDIENTE') errs.ingrediente_faltante = 'Selecciona el ingrediente faltante.'
    if (!formData.ingrediente_alternativo && formData.tipo === 'CAMBIO_INGREDIENTE') errs.ingrediente_alternativo = 'Selecciona la alternativa.'
    if (!formData.descripcion.trim()) errs.descripcion = 'Describe la incidencia.'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Completa los campos obligatorios marcados en rojo.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/incidencias', formData)
      toast.success('Incidencia reportada. El despachador ha sido notificado.')
      setModalForm(false)
      setFormData(FORM_INICIAL)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reportar la incidencia.')
    } finally {
      setSubmitting(false)
    }
  }

  const openDetalle = (inc) => { setIncidenciaActiva(inc); setModalDetalle(true) }

  const handleCerrar = async (inc) => {
    try {
      await api.patch(`/incidencias/${inc.id}/cerrar`)
      toast.success('Incidencia cerrada.')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cerrar.')
    }
  }

  // ── Filtrado ──
  const incidenciasFiltradas = incidencias.filter(inc => {
    const texto = `${inc.numero_ticket || inc.id} ${inc.descripcion} ${inc.pedido_numero || ''}`.toLowerCase()
    const coincideBusqueda = busqueda ? texto.includes(busqueda.toLowerCase()) : true
    const coincideTipo = filtroTipo ? inc.tipo === filtroTipo : true
    const coincidePrioridad = filtroPrioridad ? inc.prioridad === filtroPrioridad : true
    const coincideEstado = filtroEstado ? inc.estado === filtroEstado : true
    return coincideBusqueda && coincideTipo && coincidePrioridad && coincideEstado
  })

  const incidenciasCriticas = incidencias.filter(inc => inc.prioridad === 'CRITICA' && inc.estado !== 'CERRADA')
  const incidenciasAbiertas = incidencias.filter(inc => inc.estado !== 'CERRADA')

  // ── Helpers para select de ingredientes ──
  const ingredientesOptions = ingredientes.length > 0
    ? ingredientes
    : [{ id: 1, nombre: 'Pollo', categoria: 'CARNES' }, { id: 2, nombre: 'Papa', categoria: 'VERDURAS' }, { id: 3, nombre: 'Lechuga', categoria: 'VERDURAS' }, { id: 4, nombre: 'Tomate', categoria: 'VERDURAS' }, { id: 5, nombre: 'Queso', categoria: 'LACTEOS' }, { id: 6, nombre: 'Arroz', categoria: 'HARINAS' }]

  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Reporte de Incidencias</h1>
          <p className="text-sm text-gray-500 font-medium">Comunicación cocina-despacho (CU45)</p>
        </div>
        <button
          onClick={() => { setFormData(FORM_INICIAL); setFormErrors({}); setModalForm(true) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 font-semibold text-sm active:scale-[0.98]"
        >
          <Plus size={18} /> Reportar incidencia
        </button>
      </div>

      {/* Alertas */}
      {incidenciasCriticas.length > 0 && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-bold text-sm">{incidenciasCriticas.length} incidencia(s) crítica(s) sin resolver</p>
            <p className="text-red-600 text-xs">Requieren atención inmediata del despachador.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg"><AlertTriangle size={18} className="text-orange-600" /></div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Abiertas</p>
            <p className="text-lg font-extrabold text-gray-800">{incidenciasAbiertas.length}</p>
          </div>
        </div>
        <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 shadow-sm flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg"><AlertTriangle size={18} className="text-red-600" /></div>
          <div>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Críticas</p>
            <p className="text-lg font-extrabold text-red-700">{incidenciasCriticas.length}</p>
          </div>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg"><CheckCircle2 size={18} className="text-green-600" /></div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cerradas</p>
            <p className="text-lg font-extrabold text-gray-800">{incidencias.filter(i => i.estado === 'CERRADA').length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <AlertTriangle size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ticket, descripción o pedido..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          value={filtroPrioridad}
          onChange={e => setFiltroPrioridad(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="">Todas prioridades</option>
          {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_INC).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
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
                <th className="p-4 font-bold">Ticket</th>
                <th className="p-4 font-bold">Pedido</th>
                <th className="p-4 font-bold">Tipo</th>
                <th className="p-4 font-bold">Descripción</th>
                <th className="p-4 font-bold">Prioridad</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {incidenciasFiltradas.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 font-medium">
                    No hay incidencias registradas.
                  </td>
                </tr>
              ) : (
                incidenciasFiltradas.map(inc => (
                  <tr
                    key={inc.id}
                    className={`border-b border-gray-50 transition-colors ${
                      inc.prioridad === 'CRITICA' && inc.estado !== 'CERRADA' ? 'bg-red-50/30' :
                      inc.estado === 'CERRADA' ? 'opacity-60 bg-gray-50/30' :
                      'hover:bg-orange-50/20'
                    }`}
                  >
                    <td className="p-4">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                        INC-{inc.numero_ticket || inc.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        <ChefHat size={13} className="text-orange-400" />
                        #{inc.pedido_numero || inc.pedido_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {inc.pedido_mesa ? `Mesa ${inc.pedido_mesa}` : '—'}
                      </div>
                    </td>
                    <td className="p-4"><TipoBadge tipo={inc.tipo} /></td>
                    <td className="p-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={inc.descripcion}>{inc.descripcion}</p>
                      {inc.ingrediente_faltante && (
                        <p className="text-xs text-orange-500 mt-0.5">
                          Faltante: {inc.ingrediente_faltante}
                          {inc.ingrediente_alternativo && ` → Alternativa: ${inc.ingrediente_alternativo}`}
                        </p>
                      )}
                    </td>
                    <td className="p-4"><PrioridadBadge prioridad={inc.prioridad} /></td>
                    <td className="p-4"><EstadoIncBadge estado={inc.estado} /></td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openDetalle(inc)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {inc.estado !== 'CERRADA' && inc.estado !== 'RECHAZADA' && (
                          <button onClick={() => handleCerrar(inc)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition text-xs font-bold"
                            title="Cerrar incidencia">
                            <CheckCircle2 size={13} /> Cerrar
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

      {/* ── Modal Crear Incidencia ── */}
      <GlassModal
        isOpen={modalForm}
        onClose={() => setModalForm(false)}
        title="Reportar Incidencia en Cocina"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info box */}
          <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-sm">
            <div className="font-bold text-orange-800">Reporte rápido de cocina</div>
            <div className="text-orange-600 text-xs">Vinculado a un pedido activo. El despachador será notificado automáticamente.</div>
          </div>

          {/* Paso 1: Tipo de incidencia (select grande) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de incidencia <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => {
                const Icon = t.icon
                const isActive = formData.tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'tipo', value: t.value } })}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                      isActive
                        ? `${t.bg} ${t.color} border-current ring-2 ring-offset-1`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                    style={{ minHeight: '56px' }}
                  >
                    <Icon size={18} /> {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paso 2: Pedido afectado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido afectado <span className="text-red-500">*</span></label>
            <select
              name="pedido_id"
              value={formData.pedido_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none text-sm ${formErrors.pedido_id ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            >
              <option value="">Seleccionar pedido...</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.numero_orden} — {p.mesa ? `Mesa ${p.mesa}` : 'Para llevar'} ({p.items?.map(i => i.nombre).join(', ')})
                </option>
              ))}
            </select>
            {formErrors.pedido_id && <p className="text-xs text-red-500 mt-1">{formErrors.pedido_id}</p>}
          </div>

          {/* Ingredientes (condicional según tipo) */}
          {(formData.tipo === 'RETRASO_INGREDIENTE' || formData.tipo === 'CAMBIO_INGREDIENTE') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente faltante <span className="text-red-500">*</span></label>
                <select
                  name="ingrediente_faltante"
                  value={formData.ingrediente_faltante}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none text-sm ${formErrors.ingrediente_faltante ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                >
                  <option value="">Seleccionar...</option>
                  {ingredientesOptions.map(ing => (
                    <option key={ing.id} value={ing.nombre}>{ing.nombre} ({ing.categoria})</option>
                  ))}
                </select>
                {formErrors.ingrediente_faltante && <p className="text-xs text-red-500 mt-1">{formErrors.ingrediente_faltante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente alternativo</label>
                <select
                  name="ingrediente_alternativo"
                  value={formData.ingrediente_alternativo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm ${formErrors.ingrediente_alternativo ? 'border-red-400 bg-red-50' : ''}`}
                >
                  <option value="">Seleccionar alternativa...</option>
                  {ingredientesOptions.map(ing => (
                    <option key={ing.id} value={ing.nombre}>{ing.nombre} ({ing.categoria})</option>
                  ))}
                </select>
                {formErrors.ingrediente_alternativo && <p className="text-xs text-red-500 mt-1">{formErrors.ingrediente_alternativo}</p>}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas <span className="text-red-500">*</span></label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none text-sm resize-none ${formErrors.descripcion ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              placeholder="Describe la situación en detalle..."
            />
            {formErrors.descripcion && <p className="text-xs text-red-500 mt-1">{formErrors.descripcion}</p>}
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'prioridad', value: p.value } })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.prioridad === p.value
                      ? p.cls
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            Al enviar, el pedido vinculado pasará a estado <strong>RETRASADO</strong> y el despachador recibirá una notificación crítica.
          </p>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalForm(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl text-sm font-bold shadow-md transition active:scale-[0.95] disabled:opacity-60"
              style={{ minHeight: '44px' }}>
              <Send size={16} /> {submitting ? 'Enviando...' : 'Reportar Incidencia'}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── Modal Detalle ── */}
      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title={`Detalle — INC-${incidenciaActiva?.numero_ticket || incidenciaActiva?.id}`}>
        {incidenciaActiva && (
          <div className="space-y-4 text-sm text-gray-800">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900">INC-{incidenciaActiva.numero_ticket || incidenciaActiva.id}</div>
                <div className="text-gray-500 text-xs">Pedido #{incidenciaActiva.pedido_numero || incidenciaActiva.pedido_id}</div>
              </div>
              <div className="ml-auto flex gap-2">
                <TipoBadge tipo={incidenciaActiva.tipo} />
                <PrioridadBadge prioridad={incidenciaActiva.prioridad} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-500 block">Estado</span><EstadoIncBadge estado={incidenciaActiva.estado} /></div>
              <div><span className="text-xs text-gray-500 block">Creado</span><span className="font-semibold">{new Date(incidenciaActiva.created_at).toLocaleString()}</span></div>
              <div><span className="text-xs text-gray-500 block">Reportado por</span><span className="font-semibold">{incidenciaActiva.reportado_por || '—'}</span></div>
              <div><span className="text-xs text-gray-500 block">Mesa</span><span className="font-semibold">{incidenciaActiva.pedido_mesa || '—'}</span></div>
            </div>

            {incidenciaActiva.ingrediente_faltante && (
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <span className="text-xs text-gray-500 block mb-1">Ingredientes</span>
                <div className="font-semibold text-orange-800">
                  Faltante: {incidenciaActiva.ingrediente_faltante}
                </div>
                {incidenciaActiva.ingrediente_alternativo && (
                  <div className="font-semibold text-green-700 mt-1">
                    Alternativa propuesta: {incidenciaActiva.ingrediente_alternativo}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">Descripción</span>
              <p className="text-gray-700 font-medium">{incidenciaActiva.descripcion}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setModalDetalle(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm font-semibold">Cerrar</button>
            </div>
          </div>
        )}
      </GlassModal>

    </div>
  )
}
