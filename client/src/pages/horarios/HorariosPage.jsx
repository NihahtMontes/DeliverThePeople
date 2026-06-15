import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Edit2, LogIn, LogOut, Plus, TimerReset } from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { EmptyState, KpiCard, PageHeader, TabBar, TableSkeleton } from '../../components/rrhh/RocketUi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const ESTADOS = ['PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'AUSENTE']
const FORM_INICIAL = {
  empleado_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  entrada_hora: '',
  entrada_minuto: '00',
  entrada_periodo: 'AM',
  salida_hora: '',
  salida_minuto: '00',
  salida_periodo: 'PM'
}

const estadoStyles = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-emerald-100 text-emerald-700',
  AUSENTE: 'bg-rose-100 text-rose-700'
}

function getTimeParts(value, defaultPeriod = 'AM') {
  if (!value) return { hora: '', minuto: '00', periodo: defaultPeriod }
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/La_Paz'
  }).formatToParts(new Date(value))
  const read = (type) => parts.find((part) => part.type === type)?.value || ''
  return { hora: read('hour').padStart(2, '0'), minuto: read('minute'), periodo: read('dayPeriod') }
}

function formatTime12(value) {
  if (!value) return '---'
  const { hora, minuto, periodo } = getTimeParts(value)
  return `${hora}:${minuto} ${periodo}`
}

function buildTimestamp(fecha, hora, minuto, periodo) {
  if (!hora) return null
  let hour24 = Number(hora) % 12
  if (periodo === 'PM') hour24 += 12
  return new Date(`${fecha}T${String(hour24).padStart(2, '0')}:${minuto}:00-04:00`).toISOString()
}

function TimeSelector({ label, prefix, form, setForm }) {
  const hourKey = `${prefix}_hora`
  const minuteKey = `${prefix}_minuto`
  const periodKey = `${prefix}_periodo`
  const hasHour = Boolean(form[hourKey])

  return (
    <fieldset className="rounded-xl border border-gray-200 bg-white/60 p-3">
      <legend className="px-1 text-sm font-bold text-gray-700">{label}</legend>
      <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2">
        <select aria-label={`${label}: hora`} value={form[hourKey]} onChange={(event) => setForm((prev) => ({ ...prev, [hourKey]: event.target.value }))} className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm font-semibold">
          <option value="">--</option>
          {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
        </select>
        <span className="font-bold text-gray-400">:</span>
        <select aria-label={`${label}: minutos`} disabled={!hasHour} value={form[minuteKey]} onChange={(event) => setForm((prev) => ({ ...prev, [minuteKey]: event.target.value }))} className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm font-semibold disabled:bg-gray-100">
          {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}
        </select>
        <select aria-label={`${label}: AM o PM`} disabled={!hasHour} value={form[periodKey]} onChange={(event) => setForm((prev) => ({ ...prev, [periodKey]: event.target.value }))} className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm font-bold text-orange-700 disabled:bg-gray-100">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <p className="mt-2 text-xs text-gray-500">Usa `--` para dejar la hora vacia.</p>
    </fieldset>
  )
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
  const [marcaPendiente, setMarcaPendiente] = useState(null)
  const [marcando, setMarcando] = useState(false)
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
    const entrada = getTimeParts(horario.hora_entrada, 'AM')
    const salida = getTimeParts(horario.hora_salida, 'PM')
    setEditando(horario)
    setForm({
      empleado_id: horario.empleado_id,
      fecha: horario.fecha,
      entrada_hora: entrada.hora,
      entrada_minuto: entrada.minuto,
      entrada_periodo: entrada.periodo,
      salida_hora: salida.hora,
      salida_minuto: salida.minuto,
      salida_periodo: salida.periodo
    })
    if (horario.estado === 'COMPLETADO') setConfirmarEdicion(true)
    else setModal(true)
  }

  const guardar = async (event) => {
    event.preventDefault()
    if (!form.empleado_id || !form.fecha) return toast.error('Selecciona empleado y fecha.')
    const entrada = buildTimestamp(form.fecha, form.entrada_hora, form.entrada_minuto, form.entrada_periodo)
    const salida = editando ? buildTimestamp(form.fecha, form.salida_hora, form.salida_minuto, form.salida_periodo) : null
    if (salida && !entrada) return toast.error('Primero debes indicar una hora de entrada.')
    if (entrada && salida && new Date(salida) < new Date(entrada)) return toast.error('La salida no puede ser anterior a la entrada.')
    const payload = { empleado_id: form.empleado_id, fecha: form.fecha, hora_entrada: entrada, hora_salida: salida }
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

  const confirmarMarca = async () => {
    if (!marcaPendiente) return
    const { horario, tipo } = marcaPendiente
    setMarcando(true)
    try {
      await api.patch(`/horarios-asistencias/${horario.id}/${tipo}`, {})
      toast.success(tipo === 'entrada' ? 'Entrada registrada.' : 'Salida registrada.')
      setMarcaPendiente(null)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo registrar la marca.')
    } finally {
      setMarcando(false)
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
          <tbody className="divide-y divide-gray-100">{horarios.map((item) => (
            <tr key={item.id} className="hover:bg-orange-50/30">
              <td className="px-5 py-4"><p className="font-bold text-gray-900">{item.empleado_nombre} {item.empleado_apellido}</p><p className="text-xs capitalize text-gray-500">{item.rol}</p></td>
              <td className="px-4 py-4 text-sm text-gray-600">{item.sucursal_nombre || 'Sin sucursal'}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-700">{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${item.fecha}T00:00:00Z`))}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-700">{formatTime12(item.hora_entrada)}<span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.puntualidad === 'A_TIEMPO' ? 'bg-emerald-100 text-emerald-700' : item.puntualidad === 'RETRASO' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>{item.puntualidad.replace('_', ' ')}</span></td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-700">{formatTime12(item.hora_salida)}</td>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estadoStyles[item.estado]}`}>{item.estado.replace('_', ' ')}</span></td>
              <td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-2">
                <button title="Editar" onClick={() => abrirEditar(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><Edit2 size={16} /><span className="hidden xl:inline">Editar</span></button>
                {!item.hora_entrada && <button onClick={() => setMarcaPendiente({ horario: item, tipo: 'entrada' })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><LogIn size={16} /> Registrar entrada</button>}
                {item.hora_entrada && !item.hora_salida && <button onClick={() => setMarcaPendiente({ horario: item, tipo: 'salida' })} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100"><LogOut size={16} /> Registrar salida</button>}
              </div></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </div>
      <p className="text-xs text-gray-500">La puntualidad es una referencia visual: se considera retraso después de las 09:15 porque el esquema no incluye una hora planificada.</p>

      <GlassModal isOpen={modal} onClose={() => !guardando && setModal(false)} title={editando ? 'Editar registro' : 'Nuevo horario de asistencia'}>
        <form onSubmit={guardar} className="space-y-4" noValidate>
          <label className="block text-sm font-bold text-gray-700">Empleado<select disabled={Boolean(editando)} value={form.empleado_id} onChange={(e) => setForm((prev) => ({ ...prev, empleado_id: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3 disabled:bg-gray-100"><option value="">Seleccionar...</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellido} — {item.rol}</option>)}</select></label>
          <label className="block text-sm font-bold text-gray-700">Fecha<input type="date" value={form.fecha} onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label>
          {editando ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TimeSelector label="Hora de entrada" prefix="entrada" form={form} setForm={setForm} />
              <TimeSelector label="Hora de salida" prefix="salida" form={form} setForm={setForm} />
            </div>
          ) : (
            <div className="space-y-2">
              <TimeSelector label="Hora de ingreso (opcional)" prefix="entrada" form={form} setForm={setForm} />
              <p className="px-1 text-xs text-gray-500">
                Sin hora de ingreso quedara <strong>PENDIENTE</strong>. Con una hora de ingreso quedara <strong>EN CURSO</strong>. La salida se registra al finalizar el turno.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModal(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button disabled={guardando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </GlassModal>

      <GlassModal isOpen={Boolean(marcaPendiente)} onClose={() => !marcando && setMarcaPendiente(null)} title={marcaPendiente?.tipo === 'entrada' ? 'Registrar entrada ahora' : 'Registrar salida ahora'}>
        {marcaPendiente && <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${marcaPendiente.tipo === 'entrada' ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
            <p className="text-sm text-gray-600">Empleado</p>
            <p className="font-bold text-gray-900">{marcaPendiente.horario.empleado_nombre} {marcaPendiente.horario.empleado_apellido}</p>
            <p className="mt-3 text-sm text-gray-600">Hora que se registrara</p>
            <p className="text-2xl font-black text-gray-900">{formatTime12(new Date())}</p>
          </div>
          <p className="text-sm text-gray-600">
            {marcaPendiente.tipo === 'entrada'
              ? 'Al confirmar, el estado cambiara de PENDIENTE a EN CURSO.'
              : 'Al confirmar, el estado cambiara de EN CURSO a COMPLETADO.'}
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" disabled={marcando} onClick={() => setMarcaPendiente(null)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button>
            <button type="button" disabled={marcando} onClick={confirmarMarca} className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${marcaPendiente.tipo === 'entrada' ? 'bg-emerald-600' : 'bg-orange-600'}`}>{marcando ? 'Registrando...' : 'Confirmar hora actual'}</button>
          </div>
        </div>}
      </GlassModal>

      <GlassModal isOpen={confirmarEdicion} onClose={() => setConfirmarEdicion(false)} title="Modificar registro completado">
        <p className="text-sm text-gray-600">Este registro ya tiene entrada y salida. Modificarlo cambiará el historial de asistencia.</p>
        <div className="mt-5 flex justify-end gap-3"><button onClick={() => setConfirmarEdicion(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button onClick={() => { setConfirmarEdicion(false); setModal(true) }} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white">Continuar</button></div>
      </GlassModal>
    </div>
  )
}
