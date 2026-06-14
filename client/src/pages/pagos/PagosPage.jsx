import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Plus, Trash2, Search, Loader, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../hooks/useToast'
import GlassModal from '../../components/ui/GlassModal'

const METODOS = [
  { value: 'efectivo', label: 'Efectivo', color: 'bg-green-100 text-green-700' },
  { value: 'tarjeta', label: 'Tarjeta', color: 'bg-blue-100 text-blue-700' },
  { value: 'transferencia', label: 'Transferencia', color: 'bg-purple-100 text-purple-700' },
  { value: 'qr', label: 'QR', color: 'bg-orange-100 text-orange-700' }
]

export default function PagosPage() {
  const toast = useToast()
  const [pagos, setPagos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    pedido_id: '',
    monto: '',
    metodo: 'efectivo'
  })

  const fetchPagos = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/pagos')
      setPagos(data.pagos || [])
    } catch {
      toast.error('No se pudieron cargar los pagos.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await api.get('/pedidos')
      const activos = (data.pedidos || []).filter(
        p => p.estado !== 'CANCELADO' && p.estado !== 'ENTREGADO'
      )
      setPedidos(activos)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    fetchPagos()
    fetchPedidos()
  }, [fetchPagos, fetchPedidos])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.pedido_id || !formData.monto) {
      toast.error('Selecciona un pedido y un monto.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/pagos', {
        pedido_id: formData.pedido_id,
        monto: parseFloat(formData.monto),
        metodo: formData.metodo
      })
      toast.success('Pago registrado correctamente.')
      setModalNuevo(false)
      setFormData({ pedido_id: '', monto: '', metodo: 'efectivo' })
      fetchPagos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await api.delete(`/pagos/${id}`)
      toast.info('Pago eliminado.')
      fetchPagos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar pago.')
    }
  }

  const pagosFiltrados = pagos.filter(p => {
    const texto = `${p.numero_orden} ${p.metodo} ${p.registrado_por_nombre}`.toLowerCase()
    return busqueda ? texto.includes(busqueda.toLowerCase()) : true
  })

  const totalPagado = pagosFiltrados.reduce((sum, p) => sum + Number(p.monto || 0), 0)

  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Registro de Pagos</h1>
          <p className="text-sm text-gray-500 font-medium">CU11 — Gestiona los pagos por pedido</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total pagado</p>
              <p className="text-lg font-extrabold text-gray-800">Bs. {totalPagado.toFixed(2)}</p>
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
            placeholder="Buscar por orden, metodo o cajero..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400"
          />
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-md shadow-green-500/20 font-semibold text-sm active:scale-[0.98]"
        >
          <Plus size={18} />
          Registrar Pago
        </button>
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
                <th className="p-4 font-bold">Pedido</th>
                <th className="p-4 font-bold">Monto</th>
                <th className="p-4 font-bold">Metodo</th>
                <th className="p-4 font-bold">Estado Pago</th>
                <th className="p-4 font-bold">Registrado por</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {pagosFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 font-medium">
                    No hay pagos registrados.
                  </td>
                </tr>
              ) : (
                pagosFiltrados.map(p => {
                  const metodo = METODOS.find(m => m.value === p.metodo)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-green-50/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">#{p.numero_orden}</div>
                        <div className="text-xs text-gray-500">Mesa: {p.mesa || '—'}</div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">Bs. {Number(p.monto).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${metodo?.color || 'bg-gray-100 text-gray-700'}`}>
                          {metodo?.label || p.metodo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">
                          {p.estado || 'completado'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {p.registrado_por_nombre || '—'} {p.registrado_por_apellido || ''}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEliminar(p.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="Eliminar pago"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Pago */}
      <GlassModal isOpen={modalNuevo} onClose={() => setModalNuevo(false)} title="Registrar Nuevo Pago">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido</label>
            <select
              required
              value={formData.pedido_id}
              onChange={e => setFormData({ ...formData, pedido_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
            >
              <option value="" disabled>Selecciona un pedido...</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.numero_orden || p.id} — Mesa {p.mesa || '—'} — Total Bs. {Number(p.total || 0).toFixed(2)}
                </option>
              ))}
            </select>
            {pedidos.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No hay pedidos activos disponibles.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={formData.monto}
                onChange={e => setFormData({ ...formData, monto: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metodo</label>
              <select
                required
                value={formData.metodo}
                onChange={e => setFormData({ ...formData, metodo: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
              >
                {METODOS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalNuevo(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold shadow-md transition active:scale-[0.95] disabled:opacity-60"
              style={{ minHeight: '44px' }}
            >
              {submitting ? 'Procesando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  )
}
