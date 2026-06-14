import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Edit2, LogIn, LogOut, Plus, TimerReset } from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { EmptyState, KpiCard, PageHeader, TabBar, TableSkeleton } from '../../components/rrhh/RocketUi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const ESTADOS = ['PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'AUSENTE']
const FORM_INICIAL = { empleado_id: '', fecha: new Date().toISOString().slice(0, 10), hora_entrada: '', hora_salida: '' }

const estadoStyles = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-emerald-100 text-emerald-700',
  AUSENTE: 'bg-rose-100 text-rose-700'
}

function toInputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function formatTime(value) {
  return value ? new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'
}

export default function HorariosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('rrhh')
  const [horarios, setHorarios] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [confirmarEdicion, setConfirmarEdicion] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [filtros, setFiltros] = useState({ empleado_id: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '', fecha_desde: '', fecha_hasta: '', estado: '' })

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value))
      const { data } = await api.get('/horarios-asistencias', { params })
      setHorarios(data.horarios || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los horarios.')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    Promise.all([api.get('/empleados?estado=activo'), api.get('/empleados/catalogos/sucursales')])
      .then(([empleadosRes, sucursalesRes]) => {
        setEmpleados(empleadosRes.data.empleados || [])
        setSucursales(sucursalesRes.data.sucursales || [])
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los catálogos.'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(cargar, 0)
    return () => clearTimeout(timer)
  }, [cargar])

  const kpis = useMemo(() => ({
    hoy: horarios.filter((item) => item.fecha === new Date().toISOString().slice(0, 10)).length,
    pendientes: horarios.filter((item) => item.estado === 'PENDIENTE').length,
    curso: horarios.filter((item) => item.estado === 'EN_CURSO').length,
    completados: horarios.filter((item) => item.estado === 'COMPLETADO').length,
    alertas: horarios.filter((item) => item.estado === 'AUSENTE' || item.puntualidad === 'RETRASO').length
  }), [horarios])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ ...FORM_INICIAL, empleado_id: '', fecha: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  const abrirEditar = (horario) => {
    setEditando(horario)
    setForm({ empleado_id: horario.empleado_id, fecha: horario.fecha, hora_entrada: toInputDateTime(horario.hora_entrada), hora_salida: toInputDateTime(horario.hora_salida) })
    if (horario.estado === 'COMPLETADO') setConfirmarEdicion(true)
    else setModal(true)
  }

  const guardar = async (event) => {
    event.preventDefault()
    if (!form.empleado_id || !form.fecha) return toast.error('Selecciona empleado y fecha.')
    if (form.hora_entrada && form.hora_salida && new Date(form.hora_salida) < new Date(form.hora_entrada)) return toast.error('La salida no puede ser anterior a la entrada.')
    const payload = { empleado_id: form.empleado_id, fecha: form.fecha, hora_entrada: form.hora_entrada ? new Date(form.hora_entrada).toISOString() : null, hora_salida: form.hora_salida ? new Date(form.hora_salida).toISOString() : null }
    setGuardando(true)
    try {
      if (editando) await api.put(`/horarios-asistencias/${editando.id}`, payload)
      else await api.post('/horarios-asistencias', payload)
      toast.success(editando ? 'Registro actualizado.' : 'Registro creado.')
      setModal(false)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar el registro.')
    } finally {
      setGuardando(false)
    }
  }

  const marcar = async (horario, tipo) => {
    try {
      await api.patch(`/horarios-asistencias/${horario.id}/${tipo}`, {})
      toast.success(tipo === 'entrada' ? 'Entrada registrada.' : 'Salida registrada.')
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo registrar la marca.')
    }
  }

  if (tab === 'cocina') {
    return (
      <div className="space-y-6">
        <TabBar tabs={[{ value: 'cocina', label: 'Cocina / Delivery' }, { value: 'rrhh', label: 'RRHH - Todos los Turnos' }]} active={tab} onChange={setTab} />
        <div className="glass-card p-12 text-center">
          <Clock className="mx-auto text-orange-500" size={34} />
          <h2 className="mt-4 text-xl font-bold text-gray-800">Horarios de Cocina / Delivery</h2>
          <p className="mt-2 text-sm text-gray-500">Sección reservada para la planificación específica del equipo de cocina.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TabBar tabs={[{ value: 'cocina', label: 'Cocina / Delivery' }, { value: 'rrhh', label: 'RRHH - Todos los Turnos' }]} active={tab} onChange={setTab} />
      <PageHeader icon={Clock} title="Control de Horarios y Asistencias" subtitle="Gestiona entradas, salidas y cumplimiento del personal." action={
        <button onClick={abrirNuevo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700"><Plus size={18} /> Nuevo registro</button>
      } />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={CalendarDays} label="Registros de hoy" value={kpis.hoy} />
        <KpiCard icon={TimerReset} label="Pendientes" value={kpis.pendientes} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={Clock} label="En curso" value={kpis.curso} color="bg-blue-100 text-blue-600" />
        <KpiCard icon={CheckCircle2} label="Completados" value={kpis.completados} color="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={AlertTriangle} label="Ausencias/retrasos" value={kpis.alertas} color="bg-rose-100 text-rose-600" />
      </div>

      <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <select value={filtros.empleado_id} onChange={(e) => setFiltros((prev) => ({ ...prev, empleado_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los empleados</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido}</option>)}</select>
        <select value={filtros.sucursal_id} disabled={user?.rol === 'gerente' && Boolean(user.sucursal_id)} onChange={(e) => setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm disabled:bg-gray-100"><option value="">Todas las sucursales</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
        <input type="date" value={filtros.fecha_desde} onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_desde: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm" />
        <input type="date" value={filtros.fecha_hasta} onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_hasta: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm" />
        <select value={filtros.estado} onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>)}</select>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
        {loading ? <TableSkeleton columns={7} /> : horarios.length === 0 ? <EmptyState title="Sin registros" description="Crea un registro de asistencia o ajusta los filtros." /> : (
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-100 text-left"><thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-500"><tr><th className="px-5 py-4">Empleado</th><th className="px-4 py-4">Sucursal</th><th className="px-4 py-4">Fecha</th><th className="px-4 py-4">Entrada</th><th className="px-4 py-4">Salida</th><th className="px-4 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{horarios.map((item) => <tr key={item.id} className="hover:bg-orange-50/30"><td className="px-5 py-4"><p className="font-bold text-gray-900">{item.empleado_nombre} {item.empleado_apellido}</p><p className="text-xs capitalize text-gray-500">{item.rol}</p></td><td className="px-4 py-4 text-sm text-gray-600">{item.sucursal_nombre || 'Sin sucursal'}</td><td className="px-4 py-4 text-sm font-semibold text-gray-700">{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${item.fecha}T00:00:00Z`))}</td><td className="px-4 py-4 text-sm text-gray-600">{formatTime(item.hora_entrada)}<span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.puntualidad === 'A_TIEMPO' ? 'bg-emerald-100 text-emerald-700' : item.puntualidad === 'RETRASO' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>{item.puntualidad.replace('_', ' ')}</span></td><td className="px-4 py-4 text-sm text-gray-600">{formatTime(item.hora_salida)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[item.estado]}`}>{item.estado.replace('_', ' ')}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button title="Editar" onClick={() => abrirEditar(item)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Edit2 size={17} /></button>{!item.hora_entrada && <button title="Registrar entrada" onClick={() => marcar(item, 'entrada')} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><LogIn size={17} /></button>}{item.hora_entrada && !item.hora_salida && <button title="Registrar salida" onClick={() => marcar(item, 'salida')} className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"><LogOut size={17} /></button>}</div></td></tr>)}</tbody></table></div>
        )}
      </div>
      <p className="text-xs text-gray-500">La puntualidad es una referencia visual: se considera retraso después de las 09:15 porque el esquema no incluye una hora planificada.</p>

      <GlassModal isOpen={modal} onClose={() => !guardando && setModal(false)} title={editando ? 'Editar registro' : 'Nuevo registro de asistencia'}>
        <form onSubmit={guardar} className="space-y-4" noValidate>
          <label className="block text-sm font-bold text-gray-700">Empleado<select disabled={Boolean(editando)} value={form.empleado_id} onChange={(e) => setForm((prev) => ({ ...prev, empleado_id: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3 disabled:bg-gray-100"><option value="">Seleccionar...</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido} — {item.rol}</option>)}</select></label>
          <label className="block text-sm font-bold text-gray-700">Fecha<input type="date" value={form.fecha} onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-gray-700">Hora de entrada<input type="datetime-local" value={form.hora_entrada} onChange={(e) => setForm((prev) => ({ ...prev, hora_entrada: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label><label className="block text-sm font-bold text-gray-700">Hora de salida<input type="datetime-local" value={form.hora_salida} onChange={(e) => setForm((prev) => ({ ...prev, hora_salida: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label></div>
          <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModal(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button disabled={guardando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </GlassModal>

      <GlassModal isOpen={confirmarEdicion} onClose={() => setConfirmarEdicion(false)} title="Modificar registro completado">
        <p className="text-sm text-gray-600">Este registro ya tiene entrada y salida. Modificarlo cambiará el historial de asistencia.</p>
        <div className="mt-5 flex justify-end gap-3"><button onClick={() => setConfirmarEdicion(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button onClick={() => { setConfirmarEdicion(false); setModal(true) }} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white">Continuar</button></div>
      </GlassModal>
    </div>
  )
}
