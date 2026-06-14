import { useState, useEffect } from 'react'
import {
  Wrench, Loader, AlertTriangle, Clock, CheckCircle2,
  Eye, FileText, DollarSign
} from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { useToast } from '../../hooks/useToast'

const URGENCIA_CONFIG = {
  BAJA:    { label: 'Baja',    cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
  MEDIA:   { label: 'Media',   cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
  ALTA:    { label: 'Alta',    cls: 'bg-red-100 text-red-700 border border-red-200' },
  CRITICA: { label: 'Crítica', cls: 'bg-red-200 text-red-900 border border-red-400 animate-pulse' }
}

const ESTADO_CONFIG = {
  PENDIENTE:   { label: 'Pendiente',    cls: 'bg-yellow-100 text-yellow-700' },
  EN_PROCESO:  { label: 'En Proceso',   cls: 'bg-blue-100 text-blue-700' },
  RETRASADO:   { label: 'Retrasado',    cls: 'bg-red-100 text-red-700 animate-pulse' },
  COMPLETADO:  { label: 'Completado',   cls: 'bg-green-100 text-green-700' }
}

function UrgenciaBadge({ urgencia }) {
  const cfg = URGENCIA_CONFIG[urgencia] || { label: urgencia, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-1 rounded-md text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
}

const URGENCIAS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' }
]

export default function MantenimientoPage() {
  const toast = useToast()
  const [mantenimientos, setMantenimientos] = useState([])
  const [equipos, setEquipos]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)

  // Tab: activos vs historial
  const [tab, setTab] = useState('activos')

  // Modales
  const [modalDetalle, setModalDetalle]     = useState(false)
  const [modalIniciar, setModalIniciar]     = useState(false)
  const [modalDiag, setModalDiag]           = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)

  const [ticketActivo, setTicketActivo]     = useState(null)
  const [submitting, setSubmitting]         = useState(false)

  // Formularios
  const [formIniciar, setFormIniciar]   = useState({ fecha_estimada: '', diagnostico: '' })
  const [formDiag, setFormDiag]         = useState({ diagnostico: '', observaciones_inicio: '', fecha_estimada: '', costo: '' })
  const [formFinalizar, setFormFinalizar] = useState({ observaciones_cierre: '', costo: '' })

  const fetchMantenimientos = async () => {
    try {
      setLoading(true)
      const [resMan, resEq] = await Promise.all([
        api.get('/mantenimientos'),
        api.get('/equipos')
      ])
      setMantenimientos(resMan.data.mantenimientos)
      setEquipos(resEq.data.equipos)
      setError(null)
    } catch (err) {
      setError('No se pudieron cargar los tickets de mantenimiento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMantenimientos() }, [])

  // ── Apertura de Modales ─────────────────────────────────────────────────────

  const openDetalle  = (m) => { setTicketActivo(m); setModalDetalle(true) }

  const openIniciar  = (m) => {
    setTicketActivo(m)
    setFormIniciar({ fecha_estimada: '', diagnostico: '' })
    setModalIniciar(true)
  }

  const openDiag     = (m) => {
    setTicketActivo(m)
    setFormDiag({
      diagnostico: m.diagnostico || '',
      observaciones_inicio: m.observaciones_inicio || '',
      fecha_estimada: m.fecha_estimada ? m.fecha_estimada.split('T')[0] : '',
      costo: m.costo || ''
    })
    setModalDiag(true)
  }

  const openFinalizar = (m) => {
    setTicketActivo(m)
    setFormFinalizar({ observaciones_cierre: '', costo: m.costo || '' })
    setModalFinalizar(true)
  }

  // ── Handlers API ─────────────────────────────────────────────────────────────

  const handleIniciar = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/mantenimientos/${ticketActivo.id}/iniciar`, formIniciar)
      setModalIniciar(false)
      fetchMantenimientos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar el mantenimiento.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiag = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.patch(`/mantenimientos/${ticketActivo.id}/diagnostico`, formDiag)
      setModalDiag(false)
      fetchMantenimientos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el diagnóstico.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinalizar = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/mantenimientos/${ticketActivo.id}/finalizar`, formFinalizar)
      setModalFinalizar(false)
      fetchMantenimientos()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al finalizar el mantenimiento.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Filtrado por tab ─────────────────────────────────────────────────────────

  const ACTIVOS = ['PENDIENTE', 'EN_PROCESO', 'RETRASADO']
  const mantenimientosFiltrados = mantenimientos.filter(m =>
    tab === 'activos' ? ACTIVOS.includes(m.estado_ticket) : m.estado_ticket === 'COMPLETADO'
  )

  const costoTotal = mantenimientos
    .filter(m => m.estado_ticket === 'COMPLETADO')
    .reduce((sum, m) => sum + parseFloat(m.costo || 0), 0)

  const retrasados = mantenimientos.filter(m => m.estado_ticket === 'RETRASADO').length

  const equiposConProblemas = equipos.filter(
    eq => eq.activo && (eq.estado === 'REQUIERE_MANTENIMIENTO' || eq.estado === 'FUERA_DE_SERVICIO')
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* Cabecera */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Tickets de Mantenimiento</h1>
          <p className="text-sm text-gray-500 font-medium">Gestión de fallas y reparaciones (CU48)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <DollarSign size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gasto en reparaciones</p>
              <p className="text-lg font-extrabold text-gray-800">Bs {costoTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de equipos con problemas */}
      {equiposConProblemas.length > 0 && !loading && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl shadow-sm flex gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-yellow-800 font-bold text-sm">
              {equiposConProblemas.length} equipo(s) requieren atención
            </p>
            <p className="text-yellow-700 text-xs">
              {equiposConProblemas.map(e => e.equipo_nombre || e.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de retrasados */}
      {retrasados > 0 && !loading && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-bold text-sm">{retrasados} ticket(s) con retraso</p>
            <p className="text-red-600 text-xs">Hay mantenimientos que superaron la fecha estimada de cierre.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold border border-red-100">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'activos',   label: `Activos (${mantenimientos.filter(m => ACTIVOS.includes(m.estado_ticket)).length})` },
          { key: 'historial', label: `Historial (${mantenimientos.filter(m => m.estado_ticket === 'COMPLETADO').length})` }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
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
                <th className="p-5 font-bold">Ticket</th>
                <th className="p-5 font-bold">Equipo</th>
                <th className="p-5 font-bold">Falla</th>
                <th className="p-5 font-bold">Urgencia</th>
                <th className="p-5 font-bold">Fechas</th>
                <th className="p-5 font-bold">Costo</th>
                <th className="p-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {mantenimientosFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 font-medium">
                    {tab === 'activos' ? 'No hay tickets activos.' : 'No hay tickets completados.'}
                  </td>
                </tr>
              ) : (
                mantenimientosFiltrados.map(m => (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 transition-colors ${
                      m.estado_ticket === 'COMPLETADO' ? 'bg-gray-50/30 opacity-80' :
                      m.estado_ticket === 'RETRASADO'  ? 'bg-red-50/20' :
                      'hover:bg-orange-50/20'
                    }`}
                  >
                    {/* Ticket */}
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                          MANT-{m.numero_ticket}
                        </span>
                        <EstadoBadge estado={m.estado_ticket} />
                      </div>
                    </td>

                    {/* Equipo */}
                    <td className="p-5">
                      <div className="flex items-center gap-2 font-bold text-gray-800">
                        <Wrench size={13} className="text-orange-400 flex-shrink-0" />
                        {m.equipo_nombre}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {m.equipo_marca} · <span className="font-mono">{m.equipo_serie}</span>
                      </div>
                    </td>

                    {/* Falla */}
                    <td className="p-5 text-gray-600 max-w-xs">
                      <p className="truncate" title={m.descripcion_falla}>{m.descripcion_falla}</p>
                    </td>

                    {/* Urgencia */}
                    <td className="p-5"><UrgenciaBadge urgencia={m.urgencia} /></td>

                    {/* Fechas */}
                    <td className="p-5 text-xs text-gray-500 whitespace-nowrap">
                      <div>Solicitado: <span className="font-medium">{new Date(m.fecha_solicitud).toLocaleDateString()}</span></div>
                      {m.fecha_estimada && (
                        <div className={m.estado_ticket === 'RETRASADO' ? 'text-red-600 font-bold' : ''}>
                          Estimado: {new Date(m.fecha_estimada).toLocaleDateString()}
                        </div>
                      )}
                      {m.fecha_cierre && (
                        <div className="text-green-600 font-semibold">
                          Cierre: {new Date(m.fecha_cierre).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Costo */}
                    <td className="p-5 font-mono font-bold text-gray-800">
                      {m.costo ? `Bs. ${parseFloat(m.costo).toFixed(2)}` : '—'}
                    </td>

                    {/* Acciones */}
                    <td className="p-5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openDetalle(m)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {m.estado_ticket === 'PENDIENTE' && (
                          <button onClick={() => openIniciar(m)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition text-xs font-bold"
                            title="Iniciar mantenimiento">
                            <Clock size={13} /> Iniciar
                          </button>
                        )}
                        {(m.estado_ticket === 'EN_PROCESO' || m.estado_ticket === 'RETRASADO') && (
                          <>
                            <button onClick={() => openDiag(m)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition text-xs font-bold"
                              title="Registrar diagnóstico">
                              <FileText size={13} /> Diagnóstico
                            </button>
                            <button onClick={() => openFinalizar(m)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition text-xs font-bold"
                              title="Finalizar y cerrar ticket">
                              <CheckCircle2 size={13} /> Finalizar
                            </button>
                          </>
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

      {/* ── Modal Detalle ── */}
      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title={`Detalle — MANT-${ticketActivo?.numero_ticket}`}>
        {ticketActivo && (
          <div className="space-y-4 text-sm text-gray-800">
            <div className="flex items-center gap-3">
              <EstadoBadge estado={ticketActivo.estado_ticket} />
              <UrgenciaBadge urgencia={ticketActivo.urgencia} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <span className="text-xs text-gray-500 block">Equipo</span>
                <span className="font-bold">{ticketActivo.equipo_nombre}</span>
                <span className="text-xs text-gray-500"> ({ticketActivo.equipo_marca} · {ticketActivo.equipo_serie})</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 block">Descripción de la Falla</span>
                <p className="font-medium">{ticketActivo.descripcion_falla}</p>
              </div>
              {ticketActivo.diagnostico && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block">Diagnóstico</span>
                  <p className="font-medium">{ticketActivo.diagnostico}</p>
                </div>
              )}
              {ticketActivo.observaciones_inicio && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block">Observaciones Inicio</span>
                  <p className="font-medium">{ticketActivo.observaciones_inicio}</p>
                </div>
              )}
              {ticketActivo.observaciones_cierre && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block">Observaciones Cierre</span>
                  <p className="font-medium">{ticketActivo.observaciones_cierre}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block">Solicitado</span>
                <span className="font-medium">{new Date(ticketActivo.fecha_solicitud).toLocaleString()}</span>
              </div>
              {ticketActivo.fecha_estimada && (
                <div>
                  <span className="text-xs text-gray-500 block">Fecha Estimada</span>
                  <span className="font-medium">{new Date(ticketActivo.fecha_estimada).toLocaleDateString()}</span>
                </div>
              )}
              {ticketActivo.fecha_cierre && (
                <div>
                  <span className="text-xs text-gray-500 block">Fecha Cierre</span>
                  <span className="font-medium text-green-600">{new Date(ticketActivo.fecha_cierre).toLocaleString()}</span>
                </div>
              )}
              {ticketActivo.costo && (
                <div>
                  <span className="text-xs text-gray-500 block">Costo</span>
                  <span className="font-bold text-gray-900">Bs. {parseFloat(ticketActivo.costo).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setModalDetalle(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm">Cerrar</button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* ── Modal Iniciar Mantenimiento ── */}
      <GlassModal isOpen={modalIniciar} onClose={() => setModalIniciar(false)} title="Iniciar Mantenimiento">
        <form onSubmit={handleIniciar} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-sm">
            <div className="font-bold text-blue-800">{ticketActivo?.equipo_nombre}</div>
            <div className="text-blue-600 text-xs">{ticketActivo?.descripcion_falla}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha estimada de cierre</label>
            <input type="date" value={formIniciar.fecha_estimada}
              onChange={e => setFormIniciar({ ...formIniciar, fecha_estimada: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico inicial</label>
            <textarea value={formIniciar.diagnostico} rows={2}
              onChange={e => setFormIniciar({ ...formIniciar, diagnostico: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm resize-none"
              placeholder="Primer diagnóstico del técnico..." />
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            Al iniciar, el equipo pasará automáticamente a estado <strong>FUERA DE SERVICIO</strong>.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalIniciar(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-60">
              {submitting ? 'Iniciando...' : 'Iniciar Mantenimiento'}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── Modal Diagnóstico ── */}
      <GlassModal isOpen={modalDiag} onClose={() => setModalDiag(false)} title="Registrar Diagnóstico">
        <form onSubmit={handleDiag} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
            <textarea value={formDiag.diagnostico} rows={3}
              onChange={e => setFormDiag({ ...formDiag, diagnostico: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm resize-none"
              placeholder="Describe el diagnóstico técnico..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <input value={formDiag.observaciones_inicio}
              onChange={e => setFormDiag({ ...formDiag, observaciones_inicio: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
              placeholder="Notas adicionales..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha estimada</label>
              <input type="date" value={formDiag.fecha_estimada}
                onChange={e => setFormDiag({ ...formDiag, fecha_estimada: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo estimado (Bs)</label>
              <input type="number" min="0" step="0.01" value={formDiag.costo}
                onChange={e => setFormDiag({ ...formDiag, costo: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
                placeholder="0.00" />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalDiag(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-white bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-60">
              {submitting ? 'Guardando...' : 'Guardar Diagnóstico'}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── Modal Finalizar ── */}
      <GlassModal isOpen={modalFinalizar} onClose={() => setModalFinalizar(false)} title="Finalizar Mantenimiento">
        <form onSubmit={handleFinalizar} className="space-y-4">
          <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-sm">
            <div className="font-bold text-green-800">{ticketActivo?.equipo_nombre}</div>
            <div className="text-green-600 text-xs">MANT-{ticketActivo?.numero_ticket} · {ticketActivo?.descripcion_falla}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de cierre <span className="text-red-500">*</span></label>
            <textarea required value={formFinalizar.observaciones_cierre} rows={3}
              onChange={e => setFormFinalizar({ ...formFinalizar, observaciones_cierre: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm resize-none"
              placeholder="Describe cómo se resolvió la falla..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo real (Bs)</label>
            <input type="number" min="0" step="0.01" value={formFinalizar.costo}
              onChange={e => setFormFinalizar({ ...formFinalizar, costo: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
              placeholder="0.00" />
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            Al finalizar, el equipo volverá automáticamente a estado <strong>OPERATIVO</strong>.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalFinalizar(false)}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-60">
              {submitting ? 'Cerrando...' : 'Cerrar Ticket'}
            </button>
          </div>
        </form>
      </GlassModal>

    </div>
  )
}
