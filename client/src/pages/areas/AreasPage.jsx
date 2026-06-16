import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Edit2, Eye, MapPin, Plus, Search, Users } from 'lucide-react'
import api from '../../services/api'
import GlassModal from '../../components/ui/GlassModal'
import { EmptyState, KpiCard, PageHeader, TableSkeleton } from '../../components/rrhh/RocketUi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export default function AreasPage() {
  const { user } = useAuth()
  const toast = useToast()
  const esGestor = ['admin', 'gerente'].includes(user?.rol)
  const [areas, setAreas] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [editando, setEditando] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '' })
  const [filtros, setFiltros] = useState({ search: '', sucursal_id: user?.rol === 'admin' ? '' : (user?.sucursal_id || '') })

  const cargarAreas = useCallback(async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value))
      const { data } = await api.get('/areas', { params })
      setAreas(data.areas || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las áreas.')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    if (!esGestor) return
    api.get('/empleados/catalogos/sucursales')
      .then(({ data }) => setSucursales(data.sucursales || []))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar las sucursales.'))
  }, [esGestor])

  useEffect(() => {
    const timer = setTimeout(cargarAreas, 250)
    return () => clearTimeout(timer)
  }, [cargarAreas])

  const kpis = useMemo(() => {
    const personalPorSucursal = new Map()
    areas.forEach((area) => personalPorSucursal.set(area.sucursal_id, area.empleados_sucursal_count || 0))
    return {
      total: areas.length,
      sucursales: personalPorSucursal.size,
      personal: [...personalPorSucursal.values()].reduce((total, cantidad) => total + cantidad, 0)
    }
  }, [areas])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', sucursal_id: user?.rol === 'gerente' ? (user.sucursal_id || '') : '' })
    setModalForm(true)
  }

  const abrirEditar = (area) => {
    setEditando(area)
    setForm({ nombre: area.nombre, descripcion: area.descripcion || '', sucursal_id: area.sucursal_id })
    setModalForm(true)
  }

  const guardar = async (event) => {
    event.preventDefault()
    if (!form.nombre.trim() || !form.sucursal_id) return toast.error('Nombre y sucursal son obligatorios.')
    setGuardando(true)
    try {
      if (editando) await api.put(`/areas/${editando.id}`, { nombre: form.nombre, descripcion: form.descripcion })
      else await api.post('/areas', form)
      toast.success(editando ? 'Área actualizada.' : 'Área creada.')
      setModalForm(false)
      await cargarAreas()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar el área.')
    } finally {
      setGuardando(false)
    }
  }

  const verDetalle = async (area) => {
    try {
      const { data } = await api.get(`/areas/${area.id}`)
      setDetalle(data)
      setModalDetalle(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar el personal de la sucursal.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={MapPin} title="Áreas del Restaurante" subtitle="Consulta las zonas operativas y el personal vinculado por sucursal." action={esGestor ? <button onClick={abrirNuevo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700"><Plus size={18} /> Nueva área</button> : null} />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={MapPin} label="Total áreas" value={kpis.total} />
        <KpiCard icon={Building2} label="Sucursales con áreas" value={kpis.sucursales} color="bg-violet-100 text-violet-600" />
        <KpiCard icon={Users} label="Personal activo visible" value={kpis.personal} color="bg-emerald-100 text-emerald-600" />
      </div>
      <div className="glass-card grid gap-3 p-4 md:grid-cols-2"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} /><input value={filtros.search} onChange={(e) => setFiltros((prev) => ({ ...prev, search: e.target.value }))} placeholder="Buscar área..." className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-3 text-sm" /></label>{esGestor && <select disabled={user?.rol === 'gerente' && Boolean(user.sucursal_id)} value={filtros.sucursal_id} onChange={(e) => setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm disabled:bg-gray-100"><option value="">Todas las sucursales</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>}</div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {loading ? <div className="overflow-hidden rounded-2xl bg-white/70"><TableSkeleton columns={3} /></div> : areas.length === 0 ? <div className="glass-card"><EmptyState title="No hay áreas disponibles" description={esGestor ? 'Registra una zona operativa para comenzar.' : 'Tu sucursal todavía no tiene áreas registradas.'} /></div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{areas.map((area) => <article key={area.id} className="glass-card group flex min-h-56 flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg"><div className="flex items-start justify-between"><div className="rounded-2xl bg-orange-100 p-3 text-orange-600"><MapPin size={22} /></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{area.empleados_sucursal_count} empleados</span></div><h2 className="mt-4 text-lg font-extrabold text-gray-900">{area.nombre}</h2><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-500"><Building2 size={14} /> {area.sucursal_nombre || 'Sin sucursal'}</p><p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{area.descripcion || 'Sin descripción registrada.'}</p><div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4"><button onClick={() => verDetalle(area)} className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700"><Eye size={16} /> Ver personal</button>{esGestor && <button onClick={() => abrirEditar(area)} title="Editar área" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Edit2 size={17} /></button>}</div></article>)}</div>
      )}

      <GlassModal isOpen={modalForm} onClose={() => !guardando && setModalForm(false)} title={editando ? 'Editar área' : 'Crear área'}>
        <form onSubmit={guardar} noValidate className="space-y-4"><label className="block text-sm font-bold text-gray-700">Nombre<input value={form.nombre} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Ej. Zona de lavado" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3" /></label><label className="block text-sm font-bold text-gray-700">Descripción<textarea value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white/70 p-3" /></label><label className="block text-sm font-bold text-gray-700">Sucursal<select disabled={Boolean(editando) || (user?.rol === 'gerente' && Boolean(user.sucursal_id))} value={form.sucursal_id} onChange={(e) => setForm((prev) => ({ ...prev, sucursal_id: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 p-3 disabled:bg-gray-100"><option value="">Seleccionar...</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalForm(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600">Cancelar</button><button disabled={guardando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar área'}</button></div></form>
      </GlassModal>

      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title={detalle?.area?.nombre || 'Detalle del área'}>
        {detalle && <div className="space-y-5"><div className="rounded-2xl bg-orange-50 p-4"><p className="font-bold text-orange-800">{detalle.area.sucursal_nombre}</p><p className="mt-1 text-sm text-orange-700">{detalle.area.descripcion || 'Sin descripción.'}</p></div><div><h3 className="font-extrabold text-gray-800">Personal de la sucursal</h3><p className="mt-1 text-xs text-gray-500">El esquema no vincula personas a un área específica; se muestra el personal activo de la misma sucursal.</p></div><div className="max-h-80 space-y-2 overflow-y-auto">{detalle.empleados.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No hay personal activo.</p> : detalle.empleados.map((empleado) => <div key={empleado.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/70 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{empleado.nombre[0]}{empleado.apellido[0]}</div><div className="min-w-0 flex-1"><p className="font-bold text-gray-900">{empleado.nombre} {empleado.apellido}</p><p className="truncate text-xs text-gray-500">{empleado.email}</p></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold capitalize text-gray-600">{empleado.rol}</span></div>)}</div></div>}
      </GlassModal>
    </div>
  )
}
