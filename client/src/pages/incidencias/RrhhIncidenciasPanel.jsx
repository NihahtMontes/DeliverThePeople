import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, FileWarning, Plus, ShieldAlert } from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { EmptyState, KpiCard, PageHeader, TableSkeleton } from '../../components/rrhh/RocketUi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const TIPOS = [
  { value: 'RRHH_CONFLICTO', label: 'Conflicto laboral' },
  { value: 'RRHH_ACCIDENTE', label: 'Accidente' },
  { value: 'RRHH_ASISTENCIA', label: 'Asistencia' },
  { value: 'RRHH_TAREA', label: 'Tarea' },
  { value: 'RRHH_OTRO', label: 'Otro' }
]
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']
const ESTADOS = ['ABIERTA', 'EN_REVISION', 'CERRADA']
const estadoStyles = { ABIERTA: 'bg-amber-100 text-amber-700', EN_REVISION: 'bg-blue-100 text-blue-700', CERRADA: 'bg-emerald-100 text-emerald-700' }
const prioridadStyles = { BAJA: 'bg-gray-100 text-gray-600', MEDIA: 'bg-blue-100 text-blue-700', ALTA: 'bg-orange-100 text-orange-700', CRITICA: 'bg-rose-100 text-rose-700' }

export default function RrhhIncidenciasPanel() {
  const { user } = useAuth()
  const toast = useToast()
  const esGestor = ['admin', 'gerente'].includes(user?.rol)
  const [incidencias, setIncidencias] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalCerrar, setModalCerrar] = useState(false)
  const [seleccionada, setSeleccionada] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ tipo: 'RRHH_CONFLICTO', prioridad: 'ALTA', descripcion: '', empleado_id: esGestor ? '' : user?.id, sucursal_id: esGestor ? (user?.rol === 'gerente' ? (user.sucursal_id || '') : '') : (user?.sucursal_id || '') })
  const [filtros, setFiltros] = useState({ estado: '', tipo: '', prioridad: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '' })

  const cargarIncidencias = useCallback(async () => {
    try {
      setLoading(true)
      const params = esGestor ? Object.fromEntries(Object.entries(filtros).filter(([, value]) => value)) : {}
      const { data } = await api.get('/rrhh/incidencias', { params })
      setIncidencias(data.incidencias || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las incidencias RRHH.')
    } finally {
      setLoading(false)
    }
  }, [esGestor, filtros])

  useEffect(() => {
    if (!esGestor) return
    Promise.all([api.get('/empleados?estado=activo'), api.get('/empleados/catalogos/sucursales')])
      .then(([empleadosRes, sucursalesRes]) => {
        setEmpleados(empleadosRes.data.empleados || [])
        setSucursales(sucursalesRes.data.sucursales || [])
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los catálogos.'))
  }, [esGestor])

  useEffect(() => {
    const timer = setTimeout(cargarIncidencias, 0)
    return () => clearTimeout(timer)
  }, [cargarIncidencias])

  const kpis = useMemo(() => ({
    abiertas: incidencias.filter((item) => item.estado === 'ABIERTA').length,
    revision: incidencias.filter((item) => item.estado === 'EN_REVISION').length,
    cerradas: incidencias.filter((item) => item.estado === 'CERRADA').length,
    criticas: incidencias.filter((item) => item.prioridad === 'CRITICA' && item.estado !== 'CERRADA').length
  }), [incidencias])

  const abrirForm = () => {
    setForm({ tipo: 'RRHH_CONFLICTO', prioridad: 'ALTA', descripcion: '', empleado_id: esGestor ? '' : user.id, sucursal_id: esGestor ? (user?.rol === 'gerente' ? (user.sucursal_id || '') : '') : (user.sucursal_id || '') })
    setModalForm(true)
  }

  const seleccionarEmpleado = (empleadoId) => {
    const empleado = empleados.find((item) => item.id === empleadoId)
    setForm((prev) => ({ ...prev, empleado_id: empleadoId, sucursal_id: empleado?.sucursal_id || '' }))
  }

  const reportar = async (event) => {
    event.preventDefault()
    if (!form.descripcion.trim()) return toast.error('Describe la incidencia.')
    if (esGestor && !form.empleado_id) return toast.error('Selecciona el empleado relacionado.')
    setGuardando(true)
    try {
      await api.post('/rrhh/incidencias', form)
      toast.success('Incidencia RRHH reportada.')
      setModalForm(false)
      await cargarIncidencias()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo reportar la incidencia.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (incidencia, estado) => {
    try {
      await api.patch(`/rrhh/incidencias/${incidencia.id}/estado`, { estado })
      toast.success(estado === 'CERRADA' ? 'Incidencia cerrada.' : 'Incidencia enviada a revisión.')
      setModalCerrar(false)
      await cargarIncidencias()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar la incidencia.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldAlert} title="Incidencias de Personal" subtitle="Reporta y gestiona situaciones relacionadas con el personal." action={<button onClick={abrirForm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700"><Plus size={18} /> Reportar incidencia</button>} />
      {esGestor ? <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard icon={AlertTriangle} label="Abiertas" value={kpis.abiertas} color="bg-amber-100 text-amber-600" /><KpiCard icon={Eye} label="En revisión" value={kpis.revision} color="bg-blue-100 text-blue-600" /><KpiCard icon={CheckCircle2} label="Cerradas" value={kpis.cerradas} color="bg-emerald-100 text-emerald-600" /><KpiCard icon={FileWarning} label="Críticas" value={kpis.criticas} color="bg-rose-100 text-rose-600" /></div>
        <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"><select value={filtros.estado} onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>)}</select><select value={filtros.tipo} onChange={(e) => setFiltros((prev) => ({ ...prev, tipo: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los tipos</option>{TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select><select value={filtros.prioridad} onChange={(e) => setFiltros((prev) => ({ ...prev, prioridad: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todas las prioridades</option>{PRIORIDADES.map((prioridad) => <option key={prioridad}>{prioridad}</option>)}</select><select disabled={user?.rol === 'gerente' && Boolean(user.sucursal_id)} value={filtros.sucursal_id} onChange={(e) => setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm disabled:bg-gray-100"><option value="">Todas las sucursales</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">{loading ? <TableSkeleton columns={7} /> : incidencias.length === 0 ? <EmptyState title="Sin incidencias RRHH" description="No hay registros con los filtros seleccionados." /> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-100 text-left"><thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-4 py-4">Empleado</th><th className="px-4 py-4">Sucursal</th><th className="px-4 py-4">Tipo</th><th className="px-4 py-4">Prioridad</th><th className="px-4 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{incidencias.map((item) => <tr key={item.id} className="hover:bg-orange-50/30"><td className="px-5 py-4 text-sm text-gray-500">{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(item.created_at))}</td><td className="px-4 py-4"><p className="font-bold text-gray-900">{item.empleado_nombre} {item.empleado_apellido}</p><p className="text-xs capitalize text-gray-500">{item.rol}</p></td><td className="px-4 py-4 text-sm text-gray-600">{item.sucursal_nombre}</td><td className="px-4 py-4 text-sm font-semibold text-gray-700">{TIPOS.find((tipo) => tipo.value === item.tipo)?.label}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${prioridadStyles[item.prioridad]}`}>{item.prioridad}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[item.estado]}`}>{item.estado.replace('_', ' ')}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button title="Ver detalle" onClick={() => { setSeleccionada(item); setModalDetalle(true) }} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye size={17} /></button>{item.estado === 'ABIERTA' && <button title="Enviar a revisión" onClick={() => cambiarEstado(item, 'EN_REVISION')} className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"><FileWarning size={17} /></button>}{item.estado !== 'CERRADA' && <button title="Cerrar" onClick={() => { setSeleccionada(item); setModalCerrar(true) }} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={17} /></button>}</div></td></tr>)}</tbody></table></div>}</div>
      </> : <>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={AlertTriangle} label="Mis reportes abiertos" value={kpis.abiertas} color="bg-amber-100 text-amber-600" />
          <KpiCard icon={Eye} label="Mis reportes en revision" value={kpis.revision} color="bg-blue-100 text-blue-600" />
          <KpiCard icon={CheckCircle2} label="Mis reportes cerrados" value={kpis.cerradas} color="bg-emerald-100 text-emerald-600" />
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Este historial es privado: solo muestra reportes vinculados a tu cuenta. Los reportes de otros empleados no son visibles.
        </div>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-extrabold text-gray-900">Mis reportes</h2>
            <p className="mt-1 text-sm text-gray-500">Consulta el estado y el detalle de las incidencias que reportaste.</p>
          </div>
          {loading ? <TableSkeleton columns={5} /> : incidencias.length === 0 ? <EmptyState title="Aun no tienes reportes" description="Cuando reportes una incidencia, podras consultar aqui su seguimiento." /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left">
                <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-4 py-4">Tipo</th><th className="px-4 py-4">Prioridad</th><th className="px-4 py-4">Estado</th><th className="px-5 py-4 text-right">Detalle</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{incidencias.map((item) => <tr key={item.id} className="hover:bg-orange-50/30"><td className="px-5 py-4 text-sm text-gray-500">{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(item.created_at))}</td><td className="px-4 py-4 text-sm font-semibold text-gray-700">{TIPOS.find((tipo) => tipo.value === item.tipo)?.label}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${prioridadStyles[item.prioridad]}`}>{item.prioridad}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[item.estado]}`}>{item.estado.replace('_', ' ')}</span></td><td className="px-5 py-4 text-right"><button title="Ver mi reporte" onClick={() => { setSeleccionada(item); setModalDetalle(true) }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><Eye size={17} /> Ver</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </>}

      <GlassModal isOpen={modalForm} onClose={() => !guardando && setModalForm(false)} title="Reportar incidencia RRHH">
        <form onSubmit={reportar} noValidate className="space-y-4">{esGestor && <label className="block text-sm font-bold text-gray-700">Empleado<select value={form.empleado_id} onChange={(e) => seleccionarEmpleado(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3"><option value="">Seleccionar...</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido} — {item.rol}</option>)}</select></label>}<div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-gray-700">Tipo<select value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3">{TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></label><label className="block text-sm font-bold text-gray-700">Prioridad<select value={form.prioridad} onChange={(e) => setForm((prev) => ({ ...prev, prioridad: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3">{PRIORIDADES.map((prioridad) => <option key={prioridad}>{prioridad}</option>)}</select></label></div><label className="block text-sm font-bold text-gray-700">Descripción<textarea value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} rows={4} placeholder="Describe la situación con claridad..." className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white/70 p-3" /></label><div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">El reporte se registrará como incidencia de personal y no se asociará a pedidos ni ingredientes.</div><div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalForm(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button disabled={guardando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Enviando...' : 'Reportar incidencia'}</button></div></form>
      </GlassModal>

      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title="Detalle de incidencia RRHH">{seleccionada && <div className="space-y-4"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${prioridadStyles[seleccionada.prioridad]}`}>{seleccionada.prioridad}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[seleccionada.estado]}`}>{seleccionada.estado.replace('_', ' ')}</span></div><div><p className="text-xs font-bold uppercase text-gray-400">Empleado</p><p className="font-bold text-gray-900">{seleccionada.empleado_nombre} {seleccionada.empleado_apellido}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase text-gray-400">Descripción</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{seleccionada.descripcion}</p></div></div>}</GlassModal>
      <GlassModal isOpen={modalCerrar} onClose={() => setModalCerrar(false)} title="Cerrar incidencia RRHH"><p className="text-sm text-gray-600">Esta incidencia quedará marcada como cerrada para RRHH.</p><div className="mt-5 flex justify-end gap-3"><button onClick={() => setModalCerrar(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button onClick={() => cambiarEstado(seleccionada, 'CERRADA')} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Sí, cerrar</button></div></GlassModal>
    </div>
  )
}
