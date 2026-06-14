import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import GlassModal from '../../components/ui/GlassModal';
import { 
  Plus, Search, Eye, Edit2, Archive, MinusCircle, 
  PlusCircle, FileText, AlertTriangle, RotateCcw
} from 'lucide-react';

const CATEGORIAS = [
  { value: 'CARNES', label: 'Carnes' },
  { value: 'VERDURAS', label: 'Verduras' },
  { value: 'FRUTAS', label: 'Frutas' },
  { value: 'HARINAS', label: 'Harinas' },
  { value: 'LACTEOS', label: 'Lácteos' },
  { value: 'BEBIDAS', label: 'Bebidas' },
  { value: 'CONDIMENTOS', label: 'Condimentos' },
  { value: 'OTROS', label: 'Otros' }
];
const UNIDADES = ['kg', 'g', 'L', 'ml', 'u', 'paquete', 'caja'];

const InventarioPage = () => {
  const toast = useToast();
  
  // Estados de datos
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Estados de Modales
  const [modalAlta, setModalAlta] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalAuditoria, setModalAuditoria] = useState(false);
  const [modalInactivar, setModalInactivar] = useState(false);

  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState(''); // 'INGRESO' o 'MERMA'

  // Formularios
  const [formDataAlta, setFormDataAlta] = useState({ nombre: '', categoria: '', unidad: '', stock_minimo: 0, costo_unitario: '' });
  const [formDataEdicion, setFormDataEdicion] = useState({ nombre: '', categoria: '', unidad: '', stock_minimo: 0, costo_unitario: '' });
  const [formDataMov, setFormDataMov] = useState({ cantidad: '', motivo: '', observaciones: '', costo_compra: '' });

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventario');
      setInsumos(response.data.productos || []);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientos = async (id) => {
    try {
      const response = await api.get(`/inventario/${id}/movimientos`);
      setMovimientos(response.data);
    } catch (error) {
      toast.error('Error al cargar movimientos');
    }
  };

  // Handlers para abrir modales
  const openAlta = () => {
    setFormDataAlta({ nombre: '', categoria: '', unidad: '', stock_minimo: 0, costo_unitario: '' });
    setModalAlta(true);
  };

  const openEdicion = (insumo) => {
    setInsumoSeleccionado(insumo);
    setFormDataEdicion({
      nombre: insumo.nombre,
      categoria: insumo.categoria || '',
      unidad: insumo.unidad || '',
      stock_minimo: insumo.stock_minimo || 0,
      costo_unitario: insumo.costo_unitario || ''
    });
    setModalEdicion(true);
  };

  const openDetalle = (insumo) => {
    setInsumoSeleccionado(insumo);
    setModalDetalle(true);
  };

  const openMovimiento = (insumo, tipo) => {
    setInsumoSeleccionado(insumo);
    setTipoMovimiento(tipo);
    setFormDataMov({ cantidad: '', motivo: '', observaciones: '', costo_compra: '' });
    setModalMovimiento(true);
  };

  const openAuditoria = (insumo) => {
    setInsumoSeleccionado(insumo);
    setMovimientos([]);
    fetchMovimientos(insumo.id);
    setModalAuditoria(true);
  };

  const openInactivar = (insumo) => {
    setInsumoSeleccionado(insumo);
    setModalInactivar(true);
  };

  // Operaciones API
  const handleAlta = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventario', formDataAlta);
      toast.success('Insumo registrado correctamente');
      setModalAlta(false);
      fetchInventario();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar insumo');
    }
  };

  const handleEdicion = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/inventario/${insumoSeleccionado.id}`, formDataEdicion);
      toast.success('Insumo actualizado correctamente');
      setModalEdicion(false);
      fetchInventario();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar insumo');
    }
  };

  const handleInactivar = async () => {
    try {
      await api.put(`/inventario/${insumoSeleccionado.id}/estado`);
      toast.success('Insumo inactivado');
      setModalInactivar(false);
      fetchInventario();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al inactivar');
    }
  };

  const handleReactivar = async (insumo) => {
    try {
      await api.put(`/inventario/${insumo.id}/reactivar`);
      toast.success('Insumo reactivado correctamente');
      fetchInventario();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al reactivar');
    }
  };

  const handleSubmitMov = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventario/${insumoSeleccionado.id}/movimiento`, {
        tipo_movimiento: tipoMovimiento,
        ...formDataMov
      });
      toast.success(`${tipoMovimiento === 'INGRESO' ? 'Lote ingresado' : 'Merma reportada'} correctamente`);
      setModalMovimiento(false);
      fetchInventario();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar movimiento');
    }
  };

  // Filtrado de la tabla principal
  const insumosFiltrados = insumos.filter(insumo => {
    const coincideBusqueda = insumo.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideActivo = mostrarInactivos ? true : insumo.activo;
    const coincideCat = filtroCategoria ? insumo.categoria === filtroCategoria : true;
    return coincideBusqueda && coincideActivo && coincideCat;
  });

  return (
    <div className="flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Catálogo de Inventario</h1>
          <p className="text-sm text-gray-500 font-medium">Gestiona los insumos y sus movimientos</p>
        </div>
        <button
          onClick={openAlta}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 font-semibold text-sm active:scale-[0.98]"
        >
          <Plus size={18} />
          Registrar Nuevo Insumo
        </button>
      </div>

      {/* Controles y Filtros */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 outline-none text-sm"
          />
        </div>
        <select 
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input 
            type="checkbox" 
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 w-4 h-4"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Alertas Preventivas de la vista filtrada */}
      {insumosFiltrados.filter(i => i.activo && Number(i.cantidad_actual) <= Number(i.stock_minimo)).length > 0 && (
        <div className="mb-6 bg-red-50/80 border border-red-200 p-4 rounded-xl shadow-sm">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Alertas de Stock Crítico
          </h3>
          <ul className="list-disc list-inside text-red-700 text-sm grid grid-cols-1 md:grid-cols-2 gap-1">
            {insumosFiltrados.filter(i => i.activo && Number(i.cantidad_actual) <= Number(i.stock_minimo)).map(insumo => (
              <li key={insumo.id}>
                <span className="font-semibold">{insumo.nombre}</span>: {insumo.cantidad_actual} {insumo.unidad} (Mín: {insumo.stock_minimo})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-600">
                <th className="p-5 font-bold">Insumo</th>
                <th className="p-5 font-bold">Categoría</th>
                <th className="p-5 font-bold">Stock</th>
                <th className="p-5 font-bold">Costo Un.</th>
                <th className="p-5 font-bold text-right">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">Cargando inventario...</td></tr>
              ) : insumosFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">No se encontraron insumos.</td></tr>
              ) : (
                insumosFiltrados.map((insumo) => {
                  const isCritico = Number(insumo.cantidad_actual) <= Number(insumo.stock_minimo);
                  const inactivo = !insumo.activo;
                  return (
                    <tr key={insumo.id} className={`border-b border-gray-50 transition-colors ${inactivo ? 'opacity-50 bg-gray-50/30' : 'hover:bg-orange-50/20'}`}>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {insumo.nombre}
                          {inactivo && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wider">Inactivo</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Mínimo: {insumo.stock_minimo} {insumo.unidad}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {CATEGORIAS.find(c => c.value === insumo.categoria)?.label || insumo.categoria || 'N/A'}
                        </span>
                      </td>
                      <td className={`py-4 px-6 font-semibold text-lg ${inactivo ? 'text-gray-500' : isCritico ? 'text-red-600' : 'text-emerald-600'}`}>
                        {insumo.cantidad_actual} <span className="text-sm font-normal text-gray-500">{insumo.unidad}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        Bs {Number(insumo.costo_unitario || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          {/* Botones de Movimiento (Solo si está activo) */}
                          {insumo.activo && (
                            <>
                              <button onClick={() => openMovimiento(insumo, 'INGRESO')} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition" title="Ingresar Lote">
                                <PlusCircle size={24} fill="currentColor" stroke="white" />
                              </button>
                              <button onClick={() => openMovimiento(insumo, 'MERMA')} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition" title="Reportar Merma">
                                <MinusCircle size={24} fill="currentColor" stroke="white" />
                              </button>
                            </>
                          )}
                          <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                          {/* Botones Maestros */}
                          <button onClick={() => openDetalle(insumo)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Ver Detalle">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => openEdicion(insumo)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Editar">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => openAuditoria(insumo)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Ver Auditoría">
                            <FileText size={18} />
                          </button>
                          {insumo.activo && (
                            <button onClick={() => openInactivar(insumo)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Inactivar">
                              <Archive size={18} />
                            </button>
                          )}
                          {!insumo.activo && (
                            <button onClick={() => handleReactivar(insumo)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Reactivar insumo">
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* Modal Alta */}
      <GlassModal isOpen={modalAlta} onClose={() => setModalAlta(false)} title="Registrar Nuevo Insumo">
        <form onSubmit={handleAlta} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input required type="text" value={formDataAlta.nombre} onChange={e => setFormDataAlta({...formDataAlta, nombre: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" placeholder="Ej: Tomate perita" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select required value={formDataAlta.categoria} onChange={e => setFormDataAlta({...formDataAlta, categoria: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none">
                <option value="" disabled>Seleccione...</option>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select required value={formDataAlta.unidad} onChange={e => setFormDataAlta({...formDataAlta, unidad: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none">
                <option value="" disabled>Seleccione...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input required type="number" min="0" step="0.01" value={formDataAlta.stock_minimo} onChange={e => setFormDataAlta({...formDataAlta, stock_minimo: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (Bs)</label>
              <input required type="number" min="0" step="0.01" value={formDataAlta.costo_unitario} onChange={e => setFormDataAlta({...formDataAlta, costo_unitario: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setModalAlta(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl hover:from-orange-700 hover:to-orange-600 font-semibold shadow-md">Guardar</button>
          </div>
        </form>
      </GlassModal>

      {/* Modal Edición */}
      <GlassModal isOpen={modalEdicion} onClose={() => setModalEdicion(false)} title={`Editar: ${insumoSeleccionado?.nombre}`}>
        <form onSubmit={handleEdicion} className="space-y-4">
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            Nota: La cantidad actual ({insumoSeleccionado?.cantidad_actual} {insumoSeleccionado?.unidad}) no se puede modificar aquí. Debes registrar un ingreso o merma.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input required type="text" value={formDataEdicion.nombre} onChange={e => setFormDataEdicion({...formDataEdicion, nombre: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select required value={formDataEdicion.categoria} onChange={e => setFormDataEdicion({...formDataEdicion, categoria: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none">
                <option value="" disabled>Seleccione...</option>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select required value={formDataEdicion.unidad} onChange={e => setFormDataEdicion({...formDataEdicion, unidad: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none">
                <option value="" disabled>Seleccione...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input required type="number" min="0" step="0.01" value={formDataEdicion.stock_minimo} onChange={e => setFormDataEdicion({...formDataEdicion, stock_minimo: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (Bs)</label>
              <input type="number" min="0" step="0.01" value={formDataEdicion.costo_unitario} onChange={e => setFormDataEdicion({...formDataEdicion, costo_unitario: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setModalEdicion(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl hover:from-orange-700 hover:to-orange-600 font-semibold shadow-md">Guardar Cambios</button>
          </div>
        </form>
      </GlassModal>

      {/* Modal Detalle */}
      <GlassModal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title="Detalle del Insumo">
        {insumoSeleccionado && (
          <div className="space-y-4 text-gray-800">
            <div className="grid grid-cols-2 gap-y-4 border-b border-gray-100 pb-4">
              <div><span className="text-sm text-gray-500 block">Nombre</span> <span className="font-medium text-lg">{insumoSeleccionado.nombre}</span></div>
              <div><span className="text-sm text-gray-500 block">Categoría</span> <span className="font-medium">{CATEGORIAS.find(c => c.value === insumoSeleccionado.categoria)?.label || insumoSeleccionado.categoria}</span></div>
              <div><span className="text-sm text-gray-500 block">Estado</span> 
                <span className={`px-2 py-1 inline-block rounded text-xs font-bold ${insumoSeleccionado.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {insumoSeleccionado.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <div><span className="text-sm text-gray-500 block">Creado en</span> {new Date(insumoSeleccionado.created_at).toLocaleDateString()}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-2xl font-bold text-gray-900">{insumoSeleccionado.cantidad_actual}</span>
                <span className="text-xs text-gray-500 uppercase">Stock ({insumoSeleccionado.unidad})</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-2xl font-bold text-gray-900">{insumoSeleccionado.stock_minimo}</span>
                <span className="text-xs text-gray-500 uppercase">Mínimo ({insumoSeleccionado.unidad})</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-2xl font-bold text-gray-900">Bs {Number(insumoSeleccionado.costo_unitario || 0).toFixed(2)}</span>
                <span className="text-xs text-gray-500 uppercase">Costo Un.</span>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <span className="block text-2xl font-bold text-orange-900">Bs. {(Number(insumoSeleccionado.cantidad_actual) * Number(insumoSeleccionado.costo_unitario || 0)).toFixed(2)}</span>
                <span className="text-xs text-orange-600 uppercase">Valor Total</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setModalDetalle(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl">Cerrar</button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Modal Movimiento (Ingreso / Merma) */}
      <GlassModal isOpen={modalMovimiento} onClose={() => setModalMovimiento(false)} title={tipoMovimiento === 'INGRESO' ? 'Ingresar Lote' : 'Reportar Merma'}>
        <form onSubmit={handleSubmitMov} className="space-y-4">
          <div className={`p-4 rounded-xl mb-4 ${tipoMovimiento === 'INGRESO' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
            <p className="text-sm font-medium">Insumo: <span className="font-bold">{insumoSeleccionado?.nombre}</span></p>
            <p className="text-sm mt-1">Stock actual: <span className="font-bold">{insumoSeleccionado?.cantidad_actual} {insumoSeleccionado?.unidad}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a {tipoMovimiento === 'INGRESO' ? 'sumar' : 'descontar'}
            </label>
            <input required type="number" min="0.01" step="0.01" value={formDataMov.cantidad} onChange={e => setFormDataMov({...formDataMov, cantidad: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
          </div>
          {tipoMovimiento === 'INGRESO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario de compra (Bs) <span className="text-red-500">*</span></label>
              <input required type="number" min="0" step="0.01" value={formDataMov.costo_compra} onChange={e => setFormDataMov({...formDataMov, costo_compra: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
          )}
          {tipoMovimiento === 'MERMA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo <span className="text-red-500">*</span></label>
              <input required type="text" value={formDataMov.motivo} onChange={e => setFormDataMov({...formDataMov, motivo: e.target.value})} placeholder="Ej: Vencimiento, accidente..." className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (Opcional)</label>
            <input type="text" value={formDataMov.observaciones} onChange={e => setFormDataMov({...formDataMov, observaciones: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setModalMovimiento(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl">Cancelar</button>
            <button type="submit" className={`px-5 py-2.5 text-white rounded-xl shadow-md ${tipoMovimiento === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Confirmar</button>
          </div>
        </form>
      </GlassModal>

      {/* Modal / Panel Auditoría */}
      <GlassModal isOpen={modalAuditoria} onClose={() => setModalAuditoria(false)} title={`Auditoría: ${insumoSeleccionado?.nombre}`}>
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {movimientos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay movimientos registrados para este insumo.</p>
            ) : (
              <div className="space-y-3">
                {movimientos.map(mov => (
                  <div key={mov.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm flex flex-col gap-2 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${mov.tipo_movimiento === 'INGRESO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {mov.tipo_movimiento}
                        </span>
                        <span className="text-gray-500">{new Date(mov.created_at).toLocaleString()}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{mov.tipo_movimiento === 'INGRESO' ? '+' : '-'}{mov.cantidad}</span>
                    </div>
                    <div className="text-gray-600 grid grid-cols-2 text-xs">
                      <div>Stock anterior: <span className="font-medium">{mov.stock_anterior}</span></div>
                      <div>Stock resultante: <span className="font-medium text-gray-900">{mov.stock_nuevo}</span></div>
                    </div>
                    {mov.costo_unitario != null && (
                      <div className="mt-1 pt-1 text-gray-600 grid grid-cols-2 text-xs">
                        <div>Costo Unitario: <span className="font-medium">Bs {Number(mov.costo_unitario).toFixed(2)}</span></div>
                        <div>{mov.tipo_movimiento === 'MERMA' ? 'Costo Perdido' : 'Costo Total'}: <span className="font-medium text-gray-900">Bs {Number(mov.costo_total).toFixed(2)}</span></div>
                      </div>
                    )}
                    {(mov.motivo || mov.observaciones) && (
                      <div className="mt-1 pt-2 border-t border-gray-200 text-gray-600">
                        {mov.motivo && <p><span className="font-medium">Motivo:</span> {mov.motivo}</p>}
                        {mov.observaciones && <p><span className="font-medium">Obs:</span> {mov.observaciones}</p>}
                      </div>
                    )}
                    {mov.empleado_nombre && (
                      <div className="text-xs text-gray-400 mt-1 flex justify-end">
                        Por: {mov.empleado_nombre} {mov.empleado_apellido}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2 flex justify-end">
            <button onClick={() => setModalAuditoria(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl">Cerrar</button>
          </div>
        </div>
      </GlassModal>

      {/* Modal Confirmar Inactivar */}
      <GlassModal isOpen={modalInactivar} onClose={() => setModalInactivar(false)} title="Confirmar Baja">
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas dar de baja el insumo <span className="font-bold text-gray-900">{insumoSeleccionado?.nombre}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no eliminará el registro, pero lo ocultará de las operaciones diarias de inventario.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setModalInactivar(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
            <button onClick={handleInactivar} className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition">Sí, dar de baja</button>
          </div>
        </div>
      </GlassModal>

    </div>
  );
};

export default InventarioPage;
