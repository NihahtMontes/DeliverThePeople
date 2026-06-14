import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChefHat, Loader, Clock, Play, CheckCircle, AlertTriangle,
  Search, Filter, Flame, Zap, Thermometer, Droplets, X
} from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../hooks/useToast'
import useNow from '../../hooks/useNow'

// ── Configuración de estados ──
const ESTADO_CONFIG = {
  PENDIENTE:        { label: 'Pendiente',      cls: 'bg-yellow-500 text-white', borde: 'border-yellow-400' },
  EN_PREPARACION:   { label: 'Preparando',     cls: 'bg-blue-500 text-white', borde: 'border-blue-400' },
  RETRASADO:        { label: 'RETRASADO',      cls: 'bg-red-600 text-white', borde: 'border-red-500' },
  TERMINADO:        { label: 'Terminado',      cls: 'bg-green-500 text-white', borde: 'border-green-400' },
  CANCELADO:        { label: 'Cancelado',      cls: 'bg-gray-400 text-white', borde: 'border-gray-300' }
}

// ── Configuración de maquinaria / tipos de cocción ──
const MAQUINARIA = [
  { value: 'freidora',    label: 'Freidora',    icon: Flame, color: 'text-orange-500' },
  { value: 'horno',       label: 'Horno',       icon: Thermometer, color: 'text-red-500' },
  { value: 'parrilla',    label: 'Parrilla',    icon: Flame, color: 'text-orange-600' },
  { value: 'sarten',      label: 'Sartén',      icon: Zap, color: 'text-yellow-500' },
  { value: 'olla',        label: 'Olla',        icon: Droplets, color: 'text-blue-500' },
  { value: 'plancha',     label: 'Plancha',     icon: Thermometer, color: 'text-red-400' },
  { value: 'vaporera',    label: 'Vaporera',    icon: Droplets, color: 'text-cyan-500' },
]

// ── Cronómetro por pedido ──
function CronometroCard({ creado, tiempoEstimadoMin = 20, estado }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(creado)) / 1000))
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    if (estado === 'TERMINADO' || estado === 'CANCELADO') return
    const timer = setInterval(() => {
      const e = Math.floor((Date.now() - new Date(creado)) / 1000)
      setElapsed(e)
      setIsOverdue(e > tiempoEstimadoMin * 60)
    }, 1000)
    return () => clearInterval(timer)
  }, [creado, tiempoEstimadoMin, estado])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={`flex items-center gap-1 font-mono font-bold text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
      <Clock size={16} className={isOverdue ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
      <span className={`${isOverdue ? 'animate-pulse' : ''}`}>{mm}:{ss}</span>
    </div>
  )
}

// ── Badge de maquinaria ──
function MaquinariaBadge({ tipo }) {
  const m = MAQUINARIA.find(item => item.value === tipo)
  if (!m) return null
  const Icon = m.icon
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 bg-white/80 rounded-lg border ${m.color}`}>
      <Icon size={12} /> {m.label}
    </span>
  )
}

export default function ColaProduccionPage() {
  const toast = useToast()
  const now = useNow()
  const [pedidos, setPedidos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros combinados
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroIngrediente, setFiltroIngrediente] = useState('')
  const [filtroMaquinaria, setFiltroMaquinaria] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      const [resPedidos, resIngredientes] = await Promise.all([
        api.get('/pedidos/cola'),
        api.get('/inventario').catch(() => ({ data: { productos: [] } }))
      ])
      setPedidos(resPedidos.data.pedidos || [])
      // Usar ingredientes del inventario como catálogo para filtros
      const productos = resIngredientes.data.productos || []
      const uniqueCats = [...new Set(productos.map(p => p.categoria).filter(Boolean))]
      setIngredientes(uniqueCats.length ? uniqueCats : ['CARNES', 'VERDURAS', 'FRUTAS', 'HARINAS', 'LACTEOS', 'BEBIDAS', 'CONDIMENTOS', 'OTROS'])
      setError(null)
    } catch {
      setError('No se pudo cargar la cola de producción.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = () => fetchData()
    init()
    // Polling cada 10s para cocina (más frecuente que órdenes)
    pollRef.current = setInterval(fetchData, 10000)
    return () => clearInterval(pollRef.current)
  }, [fetchData])

  // ── Handlers de acción rápida ──
  const handleTomar = async (p) => {
    setSubmitting(true)
    try {
      await api.post(`/pedidos/${p.id}/tomar`)
      toast.success('Pedido tomado.')
      fetchData()
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('El pedido ya fue tomado por otra estación.')
      } else {
        toast.error(err.response?.data?.error || 'Error.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleTerminar = async (p) => {
    setSubmitting(true)
    try {
      await api.patch(`/pedidos/${p.id}/terminar`)
      toast.success('Pedido terminado.')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Filtrado combinado ──
  const pedidosFiltrados = pedidos.filter(p => {
    const esActivo = p.estado !== 'TERMINADO' && p.estado !== 'CANCELADO'
    if (!esActivo) return false

    const texto = `${p.numero_orden} ${p.mesa} ${p.items?.map(i => i.nombre).join(' ')}`.toLowerCase()
    const coincideBusqueda = busqueda ? texto.includes(busqueda.toLowerCase()) : true
    const coincideEstado = filtroEstado ? p.estado === filtroEstado : true
    // Filtro por ingrediente: si el item tiene categoria que coincida
    const coincideIngrediente = filtroIngrediente
      ? p.items?.some(item =>
          item.categoria?.toLowerCase() === filtroIngrediente.toLowerCase() ||
          item.ingredientes?.some(ing => ing.categoria?.toLowerCase() === filtroIngrediente.toLowerCase())
        )
      : true
    // Filtro por maquinaria: si el item tiene tipo_coccion que coincida
    const coincideMaquinaria = filtroMaquinaria
      ? p.items?.some(item => item.tipo_coccion?.toLowerCase() === filtroMaquinaria.toLowerCase())
      : true

    return coincideBusqueda && coincideEstado && coincideIngrediente && coincideMaquinaria
  })

  const pedidosRetrasados = pedidosFiltrados.filter(p => {
    const elapsed = Math.floor((now - new Date(p.created_at).getTime()) / 1000)
    return elapsed > (p.tiempo_estimado_min || 20) * 60
  })

  const activosTotal = pedidos.filter(p => p.estado !== 'TERMINADO' && p.estado !== 'CANCELADO').length
  const enPreparacion = pedidos.filter(p => p.estado === 'EN_PREPARACION').length
  const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length

  // ── Render ──
  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Cola de Producción</h1>
          <p className="text-sm text-gray-500 font-medium">Monitor de cocina en tiempo real (CU44)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ChefHat size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">En cocina</p>
              <p className="text-lg font-extrabold text-gray-800">{activosTotal}</p>
            </div>
          </div>
          <div className="bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Preparando</p>
              <p className="text-lg font-extrabold text-blue-700">{enPreparacion}</p>
            </div>
          </div>
          <div className="bg-yellow-50 px-4 py-2.5 rounded-xl border border-yellow-100 shadow-sm flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider">Pendientes</p>
              <p className="text-lg font-extrabold text-yellow-700">{pendientes}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Alerta retrasados */}
      {pedidosRetrasados.length > 0 && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <p className="text-red-800 font-bold text-sm">{pedidosRetrasados.length} orden(es) excedieron el tiempo de cocción</p>
            <p className="text-red-600 text-xs">Revisar prioridad de atención en las tarjetas marcadas.</p>
          </div>
        </div>
      )}

      {/* Barra de búsqueda + filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por orden, mesa o plato..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${mostrarFiltros ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
        >
          <Filter size={16} />
          {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
          {(filtroEstado || filtroIngrediente || filtroMaquinaria) && (
            <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {[filtroEstado, filtroIngrediente, filtroMaquinaria].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros desplegable */}
      {mostrarFiltros && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none min-w-[180px]"
            >
              <option value="">Todos</option>
              {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingrediente</label>
            <select
              value={filtroIngrediente}
              onChange={e => setFiltroIngrediente(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none min-w-[180px]"
            >
              <option value="">Todos</option>
              {ingredientes.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maquinaria</label>
            <select
              value={filtroMaquinaria}
              onChange={e => setFiltroMaquinaria(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none min-w-[180px]"
            >
              <option value="">Todas</option>
              {MAQUINARIA.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {(filtroEstado || filtroIngrediente || filtroMaquinaria) && (
            <button
              onClick={() => { setFiltroEstado(''); setFiltroIngrediente(''); setFiltroMaquinaria('') }}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-semibold px-3 py-2 hover:bg-red-50 rounded-xl transition"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid de Tarjetas */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-orange-600" size={48} />
        </div>
      )}

      {!loading && pedidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <ChefHat size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-500 mb-1">
            {activosTotal === 0 ? 'Cocina libre, sin pedidos actuales' : 'No hay pedidos con estos criterios'}
          </p>
          <p className="text-sm text-gray-400">
            {activosTotal === 0 ? 'A la espera de nuevas órdenes.' : 'Ajusta los filtros para ver más resultados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map(p => {
            const isOverdue = (() => {
              const elapsed = Math.floor((Date.now() - new Date(p.created_at)) / 1000)
              return elapsed > (p.tiempo_estimado_min || 20) * 60
            })()
            const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.PENDIENTE

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all hover:shadow-lg ${
                  isOverdue ? 'border-red-400 shadow-red-200/50' : cfg.borde
                }`}
              >
                {/* Header de tarjeta */}
                <div className={`px-4 py-3 flex justify-between items-center ${cfg.cls}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">#{p.numero_orden}</span>
                    <span className="text-xs font-bold opacity-90">{p.mesa ? `Mesa ${p.mesa}` : 'Para llevar'}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">{cfg.label}</span>
                </div>

                {/* Cuerpo */}
                <div className="p-4 space-y-3">
                  {/* Items */}
                  <div className="space-y-1">
                    {p.items?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold text-sm">•</span>
                        <div className="flex-1">
                          <span className="font-bold text-gray-800 text-sm">{item.nombre}</span>
                          <span className="text-xs text-gray-500 ml-1">x{item.cantidad}</span>
                          {item.tipo_coccion && <MaquinariaBadge tipo={item.tipo_coccion} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cronómetro grande */}
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${
                    isOverdue ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-700'
                  }`}>
                    <Clock size={20} className={isOverdue ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
                    <CronometroCard creado={p.created_at} tiempoEstimadoMin={p.tiempo_estimado_min} estado={p.estado} />
                    {isOverdue && (
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wider animate-pulse">⚠ Crítico</span>
                    )}
                  </div>
                </div>

                {/* Acciones - Botones táctiles grandes */}
                <div className="px-4 pb-4 pt-1 flex gap-2">
                  {p.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleTomar(p)}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-[0.95] touch-manipulation"
                      style={{ minHeight: '56px' }}
                    >
                      <Play size={18} /> Empezar
                    </button>
                  )}
                  {p.estado === 'EN_PREPARACION' && (
                    <button
                      onClick={() => handleTerminar(p)}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-all active:scale-[0.95] touch-manipulation"
                      style={{ minHeight: '56px' }}
                    >
                      <CheckCircle size={18} /> Terminado
                    </button>
                  )}
                  {p.estado === 'RETRASADO' && (
                    <button
                      onClick={() => handleTerminar(p)}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-600 transition-all active:scale-[0.95] touch-manipulation"
                      style={{ minHeight: '56px' }}
                    >
                      <CheckCircle size={18} /> Forzar Terminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
