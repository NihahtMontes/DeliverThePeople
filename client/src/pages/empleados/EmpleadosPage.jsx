import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Edit2,
  FilterX,
  Loader2,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX
} from 'lucide-react'
import api from '../../services/api'
import GlassInput from '../../components/ui/GlassInput'
import GlassModal from '../../components/ui/GlassModal'
import GlassSelect from '../../components/ui/GlassSelect'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'cocinero', label: 'Cocinero' },
  { value: 'despachador', label: 'Despachador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'aseo', label: 'Aseo' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'tecnico', label: 'Técnico' }
]

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' }
]

const FORM_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'cocinero',
  sucursal_id: '',
  estado: 'activo'
}

const ROL_ESTILOS = {
  admin: 'bg-violet-100 text-violet-700',
  gerente: 'bg-blue-100 text-blue-700',
  cocinero: 'bg-orange-100 text-orange-700',
  despachador: 'bg-cyan-100 text-cyan-700',
  cajero: 'bg-emerald-100 text-emerald-700',
  aseo: 'bg-teal-100 text-teal-700',
  mantenimiento: 'bg-amber-100 text-amber-700',
  tecnico: 'bg-slate-200 text-slate-700'
}

function etiquetaRol(rol) {
  return ROLES.find((item) => item.value === rol)?.label || rol
}

function obtenerMensajeError(error, fallback) {
  return error.response?.data?.error || fallback
}

function TablaSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-6 gap-5 px-6 py-5 animate-pulse">
          <div className="col-span-2 h-10 rounded-lg bg-gray-100" />
          <div className="h-7 rounded-lg bg-gray-100" />
          <div className="h-7 rounded-lg bg-gray-100" />
          <div className="h-7 rounded-lg bg-gray-100" />
          <div className="h-8 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, className }) {
  return (
    <div className="glass-card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className}`}>
        <Icon size={23} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function EmpleadosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [modalFormulario, setModalFormulario] = useState(false)
  const [modalConfirmacion, setModalConfirmacion] = useState(false)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)
  const [esEdicion, setEsEdicion] = useState(false)
  const [formData, setFormData] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})
  const [filtros, setFiltros] = useState({
    search: '',
    rol: '',
    estado: '',
    sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : ''
  })

  const tienePermiso = ['admin', 'gerente'].includes(user?.rol)

  const cargarEmpleados = useCallback(async (filtrosActuales) => {
    try {
      setLoading(true)
      const params = Object.fromEntries(
        Object.entries(filtrosActuales).filter(([, value]) => value !== '')
      )
      const { data } = await api.get('/empleados', { params })
      setEmpleados(data.empleados || [])
      setError('')
    } catch (err) {
      setError(obtenerMensajeError(err, 'No se pudieron cargar los empleados.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const { data } = await api.get('/empleados/catalogos/sucursales')
        setSucursales(data.sucursales || [])
      } catch (err) {
        setError(obtenerMensajeError(err, 'No se pudieron cargar las sucursales.'))
      }
    }
    cargarSucursales()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => cargarEmpleados(filtros), 300)
    return () => clearTimeout(timer)
  }, [filtros, cargarEmpleados])

  const kpis = useMemo(() => ({
    total: empleados.length,
    activos: empleados.filter((empleado) => empleado.estado === 'activo').length,
    inactivos: empleados.filter((empleado) => empleado.estado === 'inactivo').length,
    liderazgo: empleados.filter((empleado) => ['admin', 'gerente'].includes(empleado.rol)).length
  }), [empleados])

  const opcionesSucursal = useMemo(() => [
    ...(user?.rol === 'gerente' && user.sucursal_id ? [] : [{ value: '', label: 'Sin sucursal' }]),
    ...sucursales.map((sucursal) => ({ value: sucursal.id, label: sucursal.nombre }))
  ], [sucursales, user])

  const abrirNuevo = () => {
    setEsEdicion(false)
    setEmpleadoSeleccionado(null)
    setFormErrors({})
    setFormData({
      ...FORM_INICIAL,
      sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : ''
    })
    setModalFormulario(true)
  }

  const abrirEdicion = (empleado) => {
    setEsEdicion(true)
    setEmpleadoSeleccionado(empleado)
    setFormErrors({})
    setFormData({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      email: empleado.email,
      password: '',
      rol: empleado.rol,
      sucursal_id: empleado.sucursal_id || '',
      estado: empleado.estado
    })
    setModalFormulario(true)
  }

  const abrirConfirmacion = (empleado) => {
    setEmpleadoSeleccionado(empleado)
    setModalConfirmacion(true)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validarFormulario = () => {
    const errors = {}
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio.'
    if (!formData.apellido.trim()) errors.apellido = 'El apellido es obligatorio.'
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un email válido.'
    }
    if (!formData.rol) errors.rol = 'Selecciona un rol.'
    if (!formData.estado) errors.estado = 'Selecciona un estado.'
    if (!esEdicion && !formData.password) errors.password = 'La contraseña es obligatoria.'
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Debe tener al menos 6 caracteres.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const guardarEmpleado = async (event) => {
    event.preventDefault()
    if (!validarFormulario()) {
      toast.error('Revisa los campos marcados antes de guardar.')
      return
    }

    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/empleados/${empleadoSeleccionado.id}`, formData)
        toast.success('Empleado actualizado correctamente.')
      } else {
        await api.post('/empleados', formData)
        toast.success('Empleado registrado correctamente.')
      }
      setModalFormulario(false)
      await cargarEmpleados(filtros)
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo guardar el empleado.'))
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async () => {
    if (!empleadoSeleccionado) return
    const nuevoEstado = empleadoSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
    setCambiandoEstado(true)
    try {
      await api.patch(`/empleados/${empleadoSeleccionado.id}/estado`, { estado: nuevoEstado })
      toast.success(nuevoEstado === 'activo' ? 'Empleado reactivado correctamente.' : 'Empleado dado de baja correctamente.')
      setModalConfirmacion(false)
      await cargarEmpleados(filtros)
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo cambiar el estado del empleado.'))
    } finally {
      setCambiandoEstado(false)
    }
  }

  const limpiarFiltros = () => setFiltros({
    search: '',
    rol: '',
    estado: '',
    sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : ''
  })
  const esReactivacion = empleadoSeleccionado?.estado === 'inactivo'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-600">
              <Users size={25} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Gestión de Empleados</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Administra el personal, roles, sucursales y estado laboral.
          </p>
        </div>
        {tienePermiso && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-700 hover:to-orange-600 active:scale-[0.98]"
          >
            <UserPlus size={18} /> Nuevo empleado
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total empleados" value={kpis.total} className="bg-blue-100 text-blue-600" />
        <KpiCard icon={UserCheck} label="Activos" value={kpis.activos} className="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={UserX} label="Inactivos" value={kpis.inactivos} className="bg-rose-100 text-rose-600" />
        <KpiCard icon={ShieldCheck} label="Admins y gerentes" value={kpis.liderazgo} className="bg-violet-100 text-violet-600" />
      </div>

      <div className="glass-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_220px_auto]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              value={filtros.search}
              onChange={(event) => setFiltros((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Buscar por nombre o email..."
              className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <select
            value={filtros.rol}
            onChange={(event) => setFiltros((prev) => ({ ...prev, rol: event.target.value }))}
            className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-400"
          >
            <option value="">Todos los roles</option>
            {ROLES.map((rol) => <option key={rol.value} value={rol.value}>{rol.label}</option>)}
          </select>
          <select
            value={filtros.estado}
            onChange={(event) => setFiltros((prev) => ({ ...prev, estado: event.target.value }))}
            className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-400"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => <option key={estado.value} value={estado.value}>{estado.label}</option>)}
          </select>
          {sucursales.length > 0 && (
            <select
              value={filtros.sucursal_id}
              onChange={(event) => setFiltros((prev) => ({ ...prev, sucursal_id: event.target.value }))}
              disabled={user?.rol === 'gerente' && Boolean(user.sucursal_id)}
              className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={limpiarFiltros}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <FilterX size={17} /> Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
        {loading ? (
          <TablaSkeleton />
        ) : empleados.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400"><Users size={30} /></div>
            <h2 className="text-lg font-bold text-gray-800">No hay empleados para mostrar</h2>
            <p className="mt-1 text-sm text-gray-500">Ajusta los filtros o registra un nuevo empleado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">Empleado</th>
                  <th className="px-4 py-4">Rol</th>
                  <th className="px-4 py-4">Sucursal</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Fecha de creación</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empleados.map((empleado) => (
                  <tr key={empleado.id} className="transition hover:bg-orange-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-50 font-extrabold text-orange-700">
                          {empleado.nombre?.[0]}{empleado.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{empleado.nombre} {empleado.apellido}</p>
                          <p className="text-sm text-gray-500">{empleado.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${ROL_ESTILOS[empleado.rol] || 'bg-gray-100 text-gray-700'}`}>
                        {etiquetaRol(empleado.rol)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600">
                      {empleado.sucursal_nombre || 'Sin sucursal'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${empleado.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${empleado.estado === 'activo' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        {empleado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(empleado.created_at))}
                    </td>
                    <td className="px-6 py-4">
                      {tienePermiso && !(user?.rol === 'gerente' && empleado.rol === 'admin') && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(empleado)}
                            title="Editar empleado"
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirConfirmacion(empleado)}
                            title={empleado.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                            className={`rounded-lg p-2 transition ${empleado.estado === 'activo' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            {empleado.estado === 'activo' ? <Power size={17} /> : <RotateCcw size={17} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GlassModal
        isOpen={modalFormulario}
        onClose={() => !guardando && setModalFormulario(false)}
        title={esEdicion ? 'Editar empleado' : 'Registrar nuevo empleado'}
      >
        <form onSubmit={guardarEmpleado} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <GlassInput label="Nombre" name="nombre" value={formData.nombre} onChange={handleFormChange} required />
              {formErrors.nombre && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.nombre}</p>}
            </div>
            <div>
              <GlassInput label="Apellido" name="apellido" value={formData.apellido} onChange={handleFormChange} required />
              {formErrors.apellido && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.apellido}</p>}
            </div>
          </div>
          <div>
            <GlassInput label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} required />
            {formErrors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.email}</p>}
          </div>
          <div>
            <GlassInput
              label={esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              required={!esEdicion}
              placeholder={esEdicion ? 'Dejar vacío para conservar la contraseña actual' : 'Mínimo 6 caracteres'}
            />
            {formErrors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.password}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <GlassSelect
                label="Rol"
                name="rol"
                value={formData.rol}
                onChange={handleFormChange}
                options={user?.rol === 'gerente' ? ROLES.filter((rol) => rol.value !== 'admin') : ROLES}
              />
              {formErrors.rol && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.rol}</p>}
            </div>
            <div>
              <GlassSelect label="Estado" name="estado" value={formData.estado} onChange={handleFormChange} options={ESTADOS} />
              {formErrors.estado && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.estado}</p>}
            </div>
          </div>
          <GlassSelect
            label="Sucursal"
            name="sucursal_id"
            value={formData.sucursal_id}
            onChange={handleFormChange}
            options={opcionesSucursal}
          />
          <div className="flex flex-col-reverse gap-3 border-t border-white/60 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalFormulario(false)}
              disabled={guardando}
              className="rounded-xl bg-white/70 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-white disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={17} /> : <BriefcaseBusiness size={17} />}
              {guardando ? 'Guardando...' : 'Guardar empleado'}
            </button>
          </div>
        </form>
      </GlassModal>

      <GlassModal
        isOpen={modalConfirmacion}
        onClose={() => !cambiandoEstado && setModalConfirmacion(false)}
        title={esReactivacion ? 'Reactivar empleado' : 'Dar de baja empleado'}
      >
        <div className="space-y-5">
          <div className={`flex items-start gap-4 rounded-2xl p-4 ${esReactivacion ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            <div className={`rounded-xl p-2 ${esReactivacion ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {esReactivacion ? <RotateCcw size={22} /> : <UserX size={22} />}
            </div>
            <div>
              <p className="font-bold">{empleadoSeleccionado?.nombre} {empleadoSeleccionado?.apellido}</p>
              <p className="mt-1 text-sm leading-relaxed">
                {esReactivacion
                  ? 'El empleado volverá a estar disponible en el sistema.'
                  : 'Esta acción no eliminará al empleado, solo cambiará su estado a inactivo.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalConfirmacion(false)}
              disabled={cambiandoEstado}
              className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-200 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={cambiarEstado}
              disabled={cambiandoEstado}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60 ${esReactivacion ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              {cambiandoEstado ? <Loader2 className="animate-spin" size={17} /> : esReactivacion ? <RotateCcw size={17} /> : <Power size={17} />}
              {cambiandoEstado ? 'Procesando...' : esReactivacion ? 'Sí, reactivar' : 'Sí, dar de baja'}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
