import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageCircle, Send, Loader, User, Clock, Package, MessageSquare } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'

export default function ChatClientePage() {
  const toast = useToast()
  const { user } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef(null)

  const fetchPedidos = useCallback(async () => {
    try {
      setLoadingPedidos(true)
      const { data } = await api.get('/pedidos')
      // Solo pedidos activos o entregados (no cancelados)
      const activos = (data.pedidos || []).filter(
        p => p.estado !== 'CANCELADO'
      )
      setPedidos(activos)
    } catch {
      // Silencioso
    } finally {
      setLoadingPedidos(false)
    }
  }, [])

  const fetchMensajes = useCallback(async () => {
    try {
      setLoading(true)
      const params = pedidoSeleccionado ? { pedido_id: pedidoSeleccionado } : {}
      const { data } = await api.get('/mensajes', { params })
      const mensajesOrdenados = (data.mensajes || []).reverse()
      setMensajes(mensajesOrdenados)
    } catch {
      toast.error('No se pudieron cargar los mensajes.')
    } finally {
      setLoading(false)
    }
  }, [pedidoSeleccionado, toast])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  useEffect(() => {
    fetchMensajes()
    const interval = setInterval(fetchMensajes, 15000)
    return () => clearInterval(interval)
  }, [fetchMensajes])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return
    setEnviando(true)
    try {
      await api.post('/mensajes', { 
        mensaje: nuevoMensaje.trim(),
        pedido_id: pedidoSeleccionado || null
      })
      setNuevoMensaje('')
      fetchMensajes()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  const getPedidoLabel = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) return 'Pedido desconocido'
    return `#${pedido.numero_orden || pedido.id} — Mesa ${pedido.mesa || '—'} (${pedido.estado})`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Chat con Cliente</h1>
          <p className="text-sm text-gray-500 font-medium">CU51 — Comunicacion con clientes por pedido</p>
        </div>
      </div>

      {/* Selector de Pedido */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <Package size={18} className="text-blue-500" />
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Seleccionar Pedido
            </label>
            <select
              value={pedidoSeleccionado}
              onChange={e => setPedidoSeleccionado(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              disabled={loadingPedidos}
            >
              <option value="">Chat general (todos los mensajes)</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.numero_orden || p.id} — Mesa {p.mesa || '—'} — {p.estado} — Bs. {Number(p.total || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          {pedidoSeleccionado && (
            <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
              <span className="text-xs font-bold text-blue-700">
                {getPedidoLabel(pedidoSeleccionado)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Lista de mensajes */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {loading && mensajes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader className="animate-spin mr-2" size={20} />
              Cargando mensajes...
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={48} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">
                {pedidoSeleccionado 
                  ? 'No hay mensajes para este pedido.' 
                  : 'No hay mensajes aun.'}
              </p>
              <p className="text-xs text-gray-400">
                {pedidoSeleccionado 
                  ? 'Escribe un mensaje para el cliente de este pedido.' 
                  : 'Selecciona un pedido o escribe un mensaje general.'}
              </p>
            </div>
          ) : (
            mensajes.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-100">
                    {m.numero_orden && (
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare size={10} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                          Pedido #{m.numero_orden}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-800 leading-relaxed">{m.mensaje}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <Clock size={10} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">
                      {user?.nombre || 'Sistema'} — {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4 bg-white">
          {pedidoSeleccionado && (
            <div className="mb-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
              <span className="text-xs text-blue-700 font-medium">
                Mensaje para: {getPedidoLabel(pedidoSeleccionado)}
              </span>
            </div>
          )}
          <form onSubmit={handleEnviar} className="flex gap-3">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={e => setNuevoMensaje(e.target.value)}
              placeholder={pedidoSeleccionado 
                ? "Escribe un mensaje para este pedido..." 
                : "Escribe un mensaje general..."}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={enviando || !nuevoMensaje.trim()}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-md active:scale-[0.95] disabled:opacity-60 flex items-center gap-2"
              style={{ minHeight: '44px' }}
            >
              {enviando ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
