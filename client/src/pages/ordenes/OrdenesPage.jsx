import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChefHat, Loader, Play, CheckCircle, Clock, AlertTriangle,
  Eye, Ban, Search, Filter
} from 'lucide-react'
import api from '../../services/api'
import useNow from '../../hooks/useNow'
import GlassModal from '../../components/ui/GlassModal'
import { useToast } from '../../hooks/useToast'

// ── Configuración de estados ──
const ESTADO_CONFIG = {
  PENDIENTE:        { label: 'En Cocina / Pendiente',  cls: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
  EN_PREPARACION:   { label: 'En Preparación',         cls: 'bg-blue-100 text-blue-700 border border-blue-300' },
  RETRASADO:        { label: 'Retrasado',              cls: 'bg-red-100 text-red-700 border border-red-400 animate-pulse' },
  TERMINADO:        { label: 'Terminado',              cls: 'bg-green-100 text-green-700 border border-green-300' },
  CANCELADO:        { label: 'Cancelado',              cls: 'bg-gray-100 text-gray-500 border border-gray-300' }
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' }
  return <span className={`px-2 py-1 rounded-md text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
}

// ── Componente Cronómetro ──
function Cronometro({ creado, tiempoEstimadoMin = 20, estado }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(creado)) / 1000))
  const [isOverdue, setIsOverdue] = useState(elapsed > tiempoEstimadoMin * 60)

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
    <div className={`flex items-center gap-1 font-mono font-bold text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
      <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
      <span className={isOverdue ? 'animate-pulse' : ''}>{mm}:{ss}</span>
      {isOverdue && <span className="text-[10px] text-red-500 font-bold ml-1 uppercase">⚠ retrasado</span>}
    </div>
  )
}

export default function OrdenesPage() {
  const toast = useToast()
  const now = useNow()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [verHistorial, setVerHistorial] = useState(false)

  // Modales
  const [modalTomar, setModalTomar] = useState(false)
  const [modalTerminar, setModalTerminar] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)

  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Polling
  const pollRef = useRef(null)

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await api.get('/pedidos')
      setPedidos(data.pedidos || [])
      setError(null)
    } catch {
      setError('No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = () => fetchPedidos()
    init()
    // Polling cada 15s
    pollRef.current = setInterval(fetchPedidos, 15000)
    return () => clearInterval(pollRef.current)
  }, [fetchPedidos])

  // ── Apertura de Modales ──
  const openTomar = (p) => { setPedidoActivo(p); setModalTomar(true) }
  const openTerminar = (p) => { setPedidoActivo(p); setModalTerminar(true) }
  const openDetalle = (p) => { setPedidoActivo(p); setModalDetalle(true) }

  // ── Handlers API ──
  const handleTomar = async () => {
    setSubmitting(true)
    try {
      await api.post(`/pedidos/${pedidoActivo.id}/tomar`)
      toast.success('Pedido tomado. ¡Manos a la obra!')
      setModalTomar(false)
      fetchPedidos()
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('El pedido ya fue tomado por otra estación.')
      } else {
        toast.error(err.response?.data?.error || 'Error al tomar el pedido.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleTerminar = async () => {
    setSubmitting(true)
    try {
      await api.patch(`/pedidos/${pedidoActivo.id}/terminar`)
      toast.success('Pedido marcado como Terminado.')
      setModalTerminar(false)
      fetchPedidos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al terminar el pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = async (p) => {
    try {
      await api.patch(`/pedidos/${p.id}/cancelar`)
      toast.info('Pedido cancelado.')
      fetchPedidos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar el pedido.')
    }
  }

  // ── Filtrado ──
  const pedidosFiltrados = pedidos.filter(p => {
    const texto = `${p.numero_orden} ${p.mesa} ${p.items?.map(i => i.nombre).join(' ')}`.toLowerCase()
    const coincideBusqueda = busqueda ? texto.includes(busqueda.toLowerCase()) : true
    const coincideEstado = filtroEstado ? p.estado === filtroEstado : true
    // Ver historial: mostrar terminados + cancelados. Si no, mostrar solo activos
    const esHistorial = p.estado === 'TERMINADO' || p.estado === 'CANCELADO'
    const coincideHistorial = verHistorial ? true : !esHistorial
    return coincideBusqueda && coincideEstado && coincideHistorial
  })

  const pedidosActivos = pedidos.filter(p => p.estado !== 'TERMINADO' && p.estado !== 'CANCELADO')
  const pedidosRetrasados = pedidosActivos.filter(p => {
    const elapsed = Math.floor((now - new Date(p.created_at).getTime()) / 1000)
    return elapsed > (p.tiempo_estimado_min || 20) * 60
  })

  // ── Render ──
  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Gestión de Pedidos</h1>
          <p className="text-sm text-gray-500 font-medium">Flujo de producción en cocina (CU43)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ChefHat size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pedidos activos</p>
              <p className="text-lg font-extrabold text-gray-800">{pedidosActivos.length}</p>
            </div>
          </div>
          {pedidosRetrasados.length > 0 && (
            <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 shadow-sm flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <div>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Retrasados</p>
                <p className="text-lg font-extrabold text-red-700">{pedidosRetrasados.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por orden, mesa o plato..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>
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
            checked={verHistorial}
            onChange={e => setVerHistorial(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 w-4 h-4"
          />
          <Filter size={14} />
          Ver historial
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
                <th className="p-4 font-bold">Orden</th>
                <th className="p-4 font-bold">Mesa</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold">Tiempo</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {pedidosFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 font-medium">
                    {verHistorial ? 'No hay pedidos en el historial.' : 'Sin pedidos activos en cocina.'}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map(p => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-50 transition-colors ${
                      p.estado === 'TERMINADO' || p.estado === 'CANCELADO'
                        ? 'opacity-60 bg-gray-50/30'
                        : p.estado === 'RETRASADO'
                          ? 'bg-red-50/30'
                          : 'hover:bg-orange-50/20'
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        <ChefHat size={14} className="text-orange-400 flex-shrink-0" />
                        #{p.numero_orden || p.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.items?.length || 0} ítems
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{p.mesa || '—'}</td>
                    <td className="p-4">
                      <div className="text-xs text-gray-600 max-w-[180px] truncate">
                        {p.items?.map(i => i.nombre).join(', ') || '—'}
                      </div>
                    </td>
                    <td className="p-4"><EstadoBadge estado={p.estado} /></td>
                    <td className="p-4">
                      <Cronometro creado={p.created_at} tiempoEstimadoMin={p.tiempo_estimado_min} estado={p.estado} />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center gap-2 flex-wrap">
                        {/* Botón TOMAR - PENDIENTE */}
                        {p.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => openTomar(p)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-[0.95] touch-manipulation"
                            style={{ minHeight: '44px' }}
                          >
                            <Play size={16} /> Tomar Pedido
                          </button>
                        )}
                        {/* Botón TERMINAR - EN_PREPARACION */}
                        {p.estado === 'EN_PREPARACION' && (
                          <button
                            onClick={() => openTerminar(p)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-all active:scale-[0.95] touch-manipulation"
                            style={{ minHeight: '44px' }}
                          >
                            <CheckCircle size={16} /> Terminar
                          </button>
                        )}
                        {/* Botón CANCELAR - PENDIENTE */}
                        {p.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleCancelar(p)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition touch-manipulation"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                            title="Cancelar pedido"
                          >
                            <Ban size={17} />
                          </button>
                        )}
                        <button
                          onClick={() => openDetalle(p)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition touch-manipulation"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                          title="Ver detalle"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tomar Pedido ── */}
      <GlassModal isOpen={modalTomar} onClose={() => setModalTomar(false)} title="Tomar Pedido">
        {pedidoActivo && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm">
              <div className="font-bold text-blue-800 text-lg">Orden #{pedidoActivo.numero_orden}</div>
              <div className="text-blue-600 text-xs mt-1">Mesa: {pedidoActivo.mesa || '—'}</div>
              <div className="text-gray-700 mt-2 text-sm">
                <span className="font-semibold">Items:</span> {pedidoActivo.items?.map(i => i.nombre).join(', ')}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Al confirmar, el pedido pasará a <strong>"En Preparación"</strong> y se vinculará a tu estación.
              El despachador será notificado automáticamente.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button onClick={() => setModalTomar(false)}
                className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition">
                Cancelar
              </button>
              <button onClick={handleTomar} disabled={submitting}
                className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md transition active:scale-[0.95] disabled:opacity-60"
                style={{ minHeight: '44px' }}>
                {submitting ? 'Procesando...' : 'Sí, Tomar Pedido'}
              </button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* ── Modal Terminar Pedido ── */}
      <GlassModal isOpen={modalTerminar} onClose={() => setModalTerminar(false)} title="Marcar como Terminado">
        {pedidoActivo && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-sm">
              <div className="font-bold text-green-800 text-lg">Orden #{pedidoActivo.numero_orden}</div>
              <div className="text-green-600 text-xs mt-1">Mesa: {pedidoActivo.mesa || '—'}</div>
              <div className="text-gray-700 mt-2 text-sm">
                <span className="font-semibold">Items:</span> {pedidoActivo.items?.map(i => i.nombre).join(', ')}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Al confirmar, el pedido pasará a <strong>"Terminado"</strong> y se registrará la hora exacta de finalización.
              El despachador recibirá una alerta visual inmediata.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button onClick={() => setModalTerminar(false)}
                className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition">
                Cancelar
              </button>
              <button onClick={handleTerminar} disabled={submitting}
                className="px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold shadow-md transition active:scale-[0.95] disabled:opacity-60"
                style={{ minHeight: '44px' }}>
                {submitting ? 'Procesando...' : 'Sí, Marcar Terminado'}
              </button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* ── Modal Detalle ── */}
      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title="Detalle del Pedido">
        {pedidoActivo && (
          <div className="space-y-4 text-sm text-gray-800">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <ChefHat size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900">Orden #{pedidoActivo.numero_orden}</div>
                <div className="text-gray-500 text-xs">Mesa: {pedidoActivo.mesa || '—'}</div>
              </div>
              <div className="ml-auto">
                <EstadoBadge estado={pedidoActivo.estado} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block">Creado</span>
                <span className="font-semibold">{new Date(pedidoActivo.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Cocinero</span>
                <span className="font-semibold">{pedidoActivo.cocinero_nombre || 'No asignado'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Total</span>
                <span className="font-bold text-gray-900">Bs. {Number(pedidoActivo.total || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Tiempo estimado</span>
                <span className="font-semibold">{pedidoActivo.tiempo_estimado_min || 20} min</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-2">Items del Pedido</span>
              <div className="space-y-2">
                {pedidoActivo.items?.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800">{item.nombre}</span>
                      <span className="text-xs text-gray-500 ml-2">x{item.cantidad}</span>
                    </div>
                    <span className="font-mono text-gray-700 font-semibold">Bs. {item.subtotal?.toFixed(2)}</span>
                  </div>
                )) || <span className="text-gray-500">Sin items.</span>}
              </div>
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
