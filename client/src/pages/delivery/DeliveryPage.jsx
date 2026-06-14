import { useState, useEffect, useCallback } from 'react'
import { Truck, CheckCircle, Clock, Search, Loader, PackageCheck, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../hooks/useToast'

const ESTADO_CONFIG = {
  PENDIENTE:        { label: 'Pendiente',        cls: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
  EN_PREPARACION:   { label: 'En Preparacion',   cls: 'bg-blue-100 text-blue-700 border border-blue-300' },
  RETRASADO:        { label: 'Retrasado',        cls: 'bg-red-100 text-red-700 border border-red-400 animate-pulse' },
  TERMINADO:        { label: 'Terminado',        cls: 'bg-green-100 text-green-700 border border-green-300' },
  ENTREGADO:        { label: 'Entregado',        cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  CANCELADO:        { label: 'Cancelado',        cls: 'bg-gray-100 text-gray-500 border border-gray-300' }
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' }
  return <span className={`px-2 py-1 rounded-md text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
}

export default function DeliveryPage() {
  const toast = useToast()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [verHistorial, setVerHistorial] = useState(false)

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/pedidos')
      setPedidos(data.pedidos || [])
    } catch {
      toast.error('No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  const handleEntregar = async (p) => {
    try {
      await api.patch(`/pedidos/${p.id}/entregar`)
      toast.success('Pedido marcado como Entregado.')
      fetchPedidos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al entregar el pedido.')
    }
  }

  const pedidosFiltrados = pedidos.filter(p => {
    const texto = `${p.numero_orden} ${p.mesa} ${p.items?.map(i => i.nombre).join(' ')}`.toLowerCase()
    const coincideBusqueda = busqueda ? texto.includes(busqueda.toLowerCase()) : true
    const coincideEstado = filtroEstado ? p.estado === filtroEstado : true
    const esHistorial = p.estado === 'ENTREGADO' || p.estado === 'CANCELADO'
    const coincideHistorial = verHistorial ? true : !esHistorial
    return coincideBusqueda && coincideEstado && coincideHistorial
  })

  const pedidosListos = pedidos.filter(p => p.estado === 'TERMINADO')
  const pedidosEntregadosHoy = pedidos.filter(p => p.estado === 'ENTREGADO')

  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Coordinacion de Delivery</h1>
          <p className="text-sm text-gray-500 font-medium">CU50 — Despacho y entregas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <PackageCheck size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Listos para entregar</p>
              <p className="text-lg font-extrabold text-gray-800">{pedidosListos.length}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Truck size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Entregados</p>
              <p className="text-lg font-extrabold text-gray-800">{pedidosEntregadosHoy.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por orden, mesa o plato..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400"
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
            className="rounded border-gray-300 text-green-500 w-4 h-4"
          />
          Ver historial
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader className="animate-spin text-green-600" size={32} />
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
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {pedidosFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 font-medium">
                    {verHistorial ? 'No hay pedidos en el historial.' : 'Sin pedidos activos para despacho.'}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map(p => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-50 transition-colors ${
                      p.estado === 'ENTREGADO' || p.estado === 'CANCELADO'
                        ? 'opacity-60 bg-gray-50/30'
                        : p.estado === 'TERMINADO'
                          ? 'bg-green-50/30'
                          : 'hover:bg-green-50/20'
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        <Truck size={14} className="text-green-400 flex-shrink-0" />
                        #{p.numero_orden || p.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.items?.length || 0} items
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{p.mesa || '—'}</td>
                    <td className="p-4">
                      <div className="text-xs text-gray-600 max-w-[180px] truncate">
                        {p.items?.map(i => i.nombre).join(', ') || '—'}
                      </div>
                    </td>
                    <td className="p-4"><EstadoBadge estado={p.estado} /></td>
                    <td className="p-4 font-bold text-gray-900">Bs. {Number(p.total || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex justify-end items-center gap-2 flex-wrap">
                        {p.estado === 'TERMINADO' && (
                          <button
                            onClick={() => handleEntregar(p)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 transition-all active:scale-[0.95] touch-manipulation"
                            style={{ minHeight: '44px' }}
                          >
                            <CheckCircle size={16} /> Marcar Entregado
                          </button>
                        )}
                        {p.estado === 'ENTREGADO' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                            <CheckCircle size={14} /> Entregado
                          </span>
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
    </div>
  )
}
