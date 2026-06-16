import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Clock3, PlayCircle, Plus, Search, UserCheck, XCircle } from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { EmptyState, KpiCard, PageHeader, TableSkeleton } from '../../components/rrhh/RocketUi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA']
const estadoStyles = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-gray-200 text-gray-600'
}

export default function TareasPage() {
  const { user } = useAuth()
  const toast = useToast()
  const esGestor = ['admin', 'gerente'].includes(user?.rol)
  const [tareas, setTareas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ titulo: '', empleado_id: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '', estado: 'PENDIENTE' })
  const [filtros, setFiltros] = useState({ search: '', estado: '', empleado_id: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '' })

  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value))
      const { data } = await api.get('/tareas', { params })
      setTareas(data.tareas || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las tareas.')
    } finally {
      setLoading(false)
    }
  }, [filtros])

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
    const timer = setTimeout(cargarTareas, 250)
    return () => clearTimeout(timer)
  }, [cargarTareas])

  const kpis = useMemo(() => ({
    total: tareas.length,
    pendientes: tareas.filter((item) => item.estado === 'PENDIENTE').length,
    proceso: tareas.filter((item) => item.estado === 'EN_PROCESO').length,
    completadas: tareas.filter((item) => item.estado === 'COMPLETADA').length
  }), [tareas])

  const abrirModal = () => {
    setForm({ titulo: '', empleado_id: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '', estado: 'PENDIENTE' })
    setModal(true)
  }

  const seleccionarEmpleado = (empleadoId) => {
    const empleado = empleados.find((item) => item.id === empleadoId)
    setForm((prev) => ({ ...prev, empleado_id: empleadoId, sucursal_id: empleado?.sucursal_id || prev.sucursal_id }))
  }

  const crearTarea = async (event) => {
    event.preventDefault()
    if (!form.titulo.trim() || !form.empleado_id) return toast.error('Título y empleado son obligatorios.')
    setGuardando(true)
    try {
      await api.post('/tareas', form)
      toast.success('Tarea asignada correctamente.')
      setModal(false)
      await cargarTareas()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo asignar la tarea.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (tarea, estado) => {
    try {
      await api.patch(`/tareas/${tarea.id}/estado`, { estado })
      toast.success(estado === 'COMPLETADA' ? 'Tarea completada.' : 'Estado actualizado.')
      await cargarTareas()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar la tarea.')
    }
  }

  const columnas = useMemo(() => ({
    PENDIENTE: tareas.filter((item) => item.estado === 'PENDIENTE'),
    EN_PROCESO: tareas.filter((item) => item.estado === 'EN_PROCESO'),
    COMPLETADA: tareas.filter((item) => item.estado === 'COMPLETADA')
  }), [tareas])

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardList} title={esGestor ? 'Gestión de Tareas' : 'Mis tareas'} subtitle={esGestor ? 'Asigna y supervisa las actividades del personal.' : 'Consulta, inicia y completa tus actividades asignadas.'} action={esGestor ? <button onClick={abrirModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700"><Plus size={18} /> Asignar tarea</button> : null} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Total" value={kpis.total} />
        <KpiCard icon={Clock3} label="Pendientes" value={kpis.pendientes} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={PlayCircle} label="En proceso" value={kpis.proceso} color="bg-blue-100 text-blue-600" />
        <KpiCard icon={CheckCircle2} label="Completadas" value={kpis.completadas} color="bg-emerald-100 text-emerald-600" />
      </div>

      {esGestor && <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} /><input value={filtros.search} onChange={(e) => setFiltros((prev) => ({ ...prev, search: e.target.value }))} placeholder="Buscar por título..." className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-3 text-sm" /></label><select value={filtros.estado} onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>)}</select><select value={filtros.empleado_id} onChange={(e) => setFiltros((prev) => ({ ...prev, empleado_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los empleados</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido}</option>)}</select><select disabled={user?.rol === 'gerente' && Boolean(user.sucursal_id)} value={filtros.sucursal_id} onChange={(e) => setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm disabled:bg-gray-100"><option value="">Todas las sucursales</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      {loading ? <div className="overflow-hidden rounded-2xl bg-white/70"><TableSkeleton columns={6} /></div> : tareas.length === 0 ? <div className="glass-card"><EmptyState title="No hay tareas" description={esGestor ? 'Asigna una nueva tarea o cambia los filtros.' : 'Cuando te asignen una actividad aparecerá aquí.'} /></div> : esGestor ? (
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-100 text-left"><thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-500"><tr><th className="px-5 py-4">Tarea</th><th className="px-4 py-4">Empleado</th><th className="px-4 py-4">Sucursal</th><th className="px-4 py-4">Estado</th><th className="px-4 py-4">Creada</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{tareas.map((tarea) => <tr key={tarea.id} className="hover:bg-orange-50/30"><td className="px-5 py-4 font-bold text-gray-900">{tarea.titulo}</td><td className="px-4 py-4"><p className="font-semibold text-gray-800">{tarea.empleado_nombre} {tarea.empleado_apellido}</p><p className="text-xs capitalize text-gray-500">{tarea.rol}</p></td><td className="px-4 py-4 text-sm text-gray-600">{tarea.sucursal_nombre}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[tarea.estado]}`}>{tarea.estado.replace('_', ' ')}</span></td><td className="px-4 py-4 text-sm text-gray-500">{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(tarea.created_at))}</td><td className="px-5 py-4"><div className="flex justify-end gap-1">{tarea.estado === 'PENDIENTE' && <button title="Iniciar" onClick={() => cambiarEstado(tarea, 'EN_PROCESO')} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><PlayCircle size={18} /></button>}{!['COMPLETADA', 'CANCELADA'].includes(tarea.estado) && <button title="Completar" onClick={() => cambiarEstado(tarea, 'COMPLETADA')} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={18} /></button>}{tarea.estado !== 'CANCELADA' && <button title="Cancelar" onClick={() => cambiarEstado(tarea, 'CANCELADA')} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><XCircle size={18} /></button>}</div></td></tr>)}</tbody></table></div></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">{Object.entries(columnas).map(([estado, items]) => <section key={estado} className="glass-card min-h-64 p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold text-gray-800">{estado.replace('_', ' ')}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[estado]}`}>{items.length}</span></div><div className="space-y-3">{items.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Sin tareas</p> : items.map((tarea) => <article key={tarea.id} className={`rounded-2xl border p-4 transition ${estado === 'COMPLETADA' ? 'border-emerald-100 bg-emerald-50/50' : 'border-white/80 bg-white/70 shadow-sm'}`}><p className="font-bold text-gray-900">{tarea.titulo}</p><p className="mt-1 text-xs text-gray-500">{tarea.sucursal_nombre || 'Sin sucursal'} · {new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(tarea.created_at))}</p><div className="mt-4 flex gap-2">{estado === 'PENDIENTE' && <button onClick={() => cambiarEstado(tarea, 'EN_PROCESO')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><PlayCircle size={15} /> Iniciar</button>}{estado === 'EN_PROCESO' && <button onClick={() => cambiarEstado(tarea, 'COMPLETADA')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><UserCheck size={15} /> Marcar completada</button>}</div></article>)}</div></section>)}</div>
      )}

      <GlassModal isOpen={modal} onClose={() => !guardando && setModal(false)} title="Asignar tarea">
        <form onSubmit={crearTarea} noValidate className="space-y-4"><label className="block text-sm font-bold text-gray-700">Título<input value={form.titulo} onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Ej. Limpiar zona de cocina" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label><label className="block text-sm font-bold text-gray-700">Empleado<select value={form.empleado_id} onChange={(e) => seleccionarEmpleado(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3"><option value="">Seleccionar...</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido} — {item.rol}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-gray-700">Sucursal<select disabled value={form.sucursal_id} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-100 p-3"><option value="">Seleccionar empleado</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label className="block text-sm font-bold text-gray-700">Estado inicial<select value={form.estado} onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3">{ESTADOS.slice(0, 2).map((estado) => <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>)}</select></label></div><div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModal(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button disabled={guardando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Asignando...' : 'Asignar tarea'}</button></div></form>
      </GlassModal>
    </div>
  )
}
