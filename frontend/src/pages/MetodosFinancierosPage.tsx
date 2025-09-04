import React, { useState, useEffect } from 'react';
import { Building2, Smartphone, Plus, Search, Edit, X, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/useAuth';
import Modal from '../components/Modal';
import MetodoFinancieroCard from '../components/MetodoFinancieroCard';
import CuentaBancariaForm from '../components/CuentaBancariaForm';
import BilleteraDigitalForm from '../components/BilleteraDigitalForm';
import BancoForm from '../components/BancoForm';
import BilleteraDigitalCatalogoForm from '../components/BilleteraDigitalCatalogoForm';
import {
  getMetodosFinancieros,
  getCuentasBancarias,
  getBilleterasDigitales,
  getBancos,
  getBilleterasDigitalesCatalogo,
  createMetodoFinanciero,
  createCuentaBancaria,
  createBilleteraDigital,
  createBanco,
  createBilleteraDigitalCatalogo,
  updateMetodoFinanciero,
  updateCuentaBancaria,
  updateBilleteraDigital,
  updateBanco,
  updateBilleteraDigitalCatalogo,
  deactivateMetodoFinanciero,
  toggleActiveMetodoFinanciero,
  toggleActiveBanco,
  toggleActiveBilleteraDigitalCatalogo,
  getDetallesMetodosFinancieros,
  createDetalleMetodoFinanciero
} from '../services/metodoFinancieroService';
import type { 
  Banco,
  BilleteraDigitalCatalogo,
  MetodoFinanciero,
  CuentaBancaria, 
  BilleteraDigital, 
  MetodoFinancieroDetalle 
} from '../types/MetodoFinanciero';

type MainTabType = 'catalogo' | 'instancias' | 'catalogos';
type InstanceTabType = 'cuentas' | 'billeteras digitales';
type CatalogTabType = 'bancos' | 'billeteras';

type ExtendedItem = (CuentaBancaria | BilleteraDigital) & {
  tipo: InstanceTabType;
  is_active: boolean;
  detalle_id?: number;
};

type CatalogItem = (Banco | BilleteraDigitalCatalogo) & {
  tipo: CatalogTabType;
};

const getDisplayName = (nombre: string): string => {
  switch (nombre) {
    case 'BILLETERA_DIGITAL':
      return 'Billetera Digital';
    case 'TRANSFERENCIA_BANCARIA':
      return 'Transferencia Bancaria';
    case 'TARJETA_CREDITO':
      return 'Tarjeta de Crédito';
    case 'TARJETA_DEBITO':
      return 'Tarjeta de Débito';
    default:
      // Convierte formato SNAKE_CASE a Title Case
      return nombre
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

const MetodosFinancierosPage = () => {
  const [mainTab, setMainTab] = useState<MainTabType>('catalogo');
  const [instanceTab, setInstanceTab] = useState<InstanceTabType>('cuentas');
  const [catalogTab, setCatalogTab] = useState<CatalogTabType>('bancos');
  
  // Data states
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [billeteras, setBilleteras] = useState<BilleteraDigital[]>([]);
  const [detalles, setDetalles] = useState<MetodoFinancieroDetalle[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [billeterasCatalogo, setBilleterasCatalogo] = useState<BilleteraDigitalCatalogo[]>([]);
  
  // UI states
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoggedIn } = useAuth();

  // Fetch functions
  const fetchMetodos = async () => {
    try {
      const res = await getMetodosFinancieros({ page, search });
      setMetodos(res.results);
      setTotalPages(Math.ceil(res.count / 10)); // Assuming 10 items per page
    } catch (err) {
      console.error('Error fetching métodos:', err);
    }
  };

  const fetchDetalles = async () => {
    try {
      const res = await getDetallesMetodosFinancieros({ search });
      setDetalles(res.results.filter(d => d.es_cuenta_casa));
    } catch (err) {
      console.error('Error fetching detalles:', err);
    }
  };

  const fetchCuentas = async () => {
    try {
      const res = await getCuentasBancarias({ search });
      setCuentas(res.results);
    } catch (err) {
      console.error('Error fetching cuentas:', err);
    }
  };

  const fetchBilleteras = async () => {
    try {
      const res = await getBilleterasDigitales({ search });
      setBilleteras(res.results);
    } catch (err) {
      console.error('Error fetching billeteras:', err);
    }
  };

  const fetchBancos = async () => {
    try {
      const res = await getBancos({ search });
      setBancos(res.results);
    } catch (err) {
      console.error('Error fetching bancos:', err);
    }
  };

  const fetchBilleterasCatalogo = async () => {
    try {
      const res = await getBilleterasDigitalesCatalogo({ search });
      setBilleterasCatalogo(res.results);
    } catch (err) {
      console.error('Error fetching billeteras catálogo:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (mainTab === 'catalogo') {
        await fetchMetodos();
      } else if (mainTab === 'catalogos') {
        await Promise.all([
          fetchBancos(),
          fetchBilleterasCatalogo()
        ]);
      } else {
        await Promise.all([
          fetchDetalles(),
          fetchCuentas(),
          fetchBilleteras()
        ]);
      }
    } catch (err) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Create extended items with active status from detalles (only for casa accounts)
  const getExtendedItems = (items: any[], tipo: InstanceTabType): ExtendedItem[] => {
    return items.map(item => {
      const detalle = detalles.find(d => d.id === item.metodo_financiero_detalle);
      return {
        ...item,
        tipo,
        is_active: detalle?.is_active ?? true,
        detalle_id: detalle?.id
      };
    });
  };

  const getFilteredItems = (): ExtendedItem[] => {
    let items: ExtendedItem[] = [];
    
    switch (instanceTab) {
      case 'cuentas':
        items = getExtendedItems(cuentas, 'cuentas');
        break;
      case 'billeteras digitales':
        items = getExtendedItems(billeteras, 'billeteras digitales');
        break;
    }

    // Filter only casa accounts
    items = items.filter(item => {
      const detalle = detalles.find(d => d.id === item.detalle_id);
      return detalle?.es_cuenta_casa;
    });

    if (!search) return items;
    
    return items.filter(item => {
      const searchLower = search.toLowerCase();
      switch (item.tipo) {
        case 'cuentas':
          const cuenta = item as CuentaBancaria & ExtendedItem;
          return (cuenta.banco_nombre && cuenta.banco_nombre.toLowerCase().includes(searchLower)) ||
                 cuenta.titular.toLowerCase().includes(searchLower) ||
                 cuenta.numero_cuenta.includes(searchLower);
        case 'billeteras digitales':
          const billetera = item as BilleteraDigital & ExtendedItem;
          return (billetera.plataforma_nombre && billetera.plataforma_nombre.toLowerCase().includes(searchLower)) ||
                 billetera.usuario_id.toLowerCase().includes(searchLower) ||
                 (billetera.email && billetera.email.toLowerCase().includes(searchLower));
        default:
          return false;
      }
    });
  };

  // Modal handlers
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setSelectedItem(null);
    setIsSubmitting(false);
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedItem(null);
    setEditModalOpen(false);
    setIsSubmitting(false);
  };

  const openViewModal = (item: any) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };
  const closeViewModal = () => {
    setSelectedItem(null);
    setViewModalOpen(false);
  };

  // CRUD operations for métodos financieros (catálogo)
  const handleCreateMetodo = async (formData: any) => {
    setIsSubmitting(true);
    try {
      await createMetodoFinanciero(formData);
      toast.success('Método financiero creado exitosamente!');
      fetchMetodos();
      closeCreateModal();
    } catch (err) {
      toast.error('Error al crear método financiero');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMetodo = async (formData: any) => {
    if (!selectedItem?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateMetodoFinanciero(formData, selectedItem.id);
      toast.success('Método financiero actualizado exitosamente!');
      fetchMetodos();
      closeEditModal();
    } catch (err) {
      toast.error('Error al actualizar método financiero');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMetodo = async (metodo: MetodoFinanciero) => {
    if (!metodo.id) return;
    
    try {
      if (metodo.is_active) {
        // Desactivar
        await deactivateMetodoFinanciero(metodo.id);
        toast.success('Método financiero desactivado exitosamente!');
      } else {
        // Activar - usar update con is_active = true
        const updatedMetodo = { ...metodo, is_active: true };
        await updateMetodoFinanciero(updatedMetodo, metodo.id);
        toast.success('Método financiero activado exitosamente!');
      }
      fetchMetodos();
    } catch (err) {
      toast.error(`Error al ${metodo.is_active ? 'desactivar' : 'activar'} método financiero`);
      console.error(err);
    }
  };

  // CRUD operations for instances (instancias de la casa)
  const handleCreateInstance = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Primero crear el detalle marcado como cuenta de la casa
      const detalleData: MetodoFinancieroDetalle = {
        cliente: null,
        es_cuenta_casa: true,
        metodo_financiero: getMetodoFinancieroId(instanceTab),
        alias: `Casa - ${getInstanceTabSingular(instanceTab)}`,
        is_active: true
      };

      const detalleRes = await createDetalleMetodoFinanciero(detalleData);
      const detalleId = detalleRes.data.id;

      // Luego crear el item específico
      const itemData = { ...formData, metodo_financiero_detalle: detalleId };

      switch (instanceTab) {
        case 'cuentas':
          await createCuentaBancaria(itemData);
          break;
        case 'billeteras digitales':
          await createBilleteraDigital(itemData);
          break;
      }

      toast.success(`${getInstanceTabSingular(instanceTab)} de la casa creado exitosamente!`);
      fetchAllData();
      closeCreateModal();
    } catch (err) {
      toast.error(`Error al crear ${getInstanceTabSingular(instanceTab)} de la casa`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInstance = async (formData: any) => {
    if (!selectedItem?.id) return;
    
    setIsSubmitting(true);
    try {
      switch (selectedItem.tipo) {
        case 'cuentas':
          await updateCuentaBancaria(formData, selectedItem.id);
          break;
        case 'billeteras digitales':
          await updateBilleteraDigital(formData, selectedItem.id);
          break;
      }

      toast.success(`${getInstanceTabSingular(selectedItem.tipo)} de la casa actualizado exitosamente!`);
      fetchAllData();
      closeEditModal();
    } catch (err) {
      toast.error(`Error al actualizar ${getInstanceTabSingular(selectedItem.tipo)} de la casa`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleInstance = async (item: ExtendedItem) => {
    if (!item.detalle_id) return;
    
    try {
      await toggleActiveMetodoFinanciero(item.detalle_id);
      toast.success(`${getInstanceTabSingular(item.tipo)} de la casa ${item.is_active ? 'desactivado' : 'activado'} exitosamente!`);
      fetchAllData();
    } catch (err) {
      toast.error(`Error al ${item.is_active ? 'desactivar' : 'activar'} ${getInstanceTabSingular(item.tipo)} de la casa`);
      console.error(err);
    }
  };

  // ======================== FUNCIONES PARA CATÁLOGOS ========================

  const handleCreateCatalog = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (catalogTab === 'bancos') {
        await createBanco(formData);
        toast.success('Banco creado exitosamente!');
      } else {
        await createBilleteraDigitalCatalogo(formData);
        toast.success('Billetera digital creada exitosamente!');
      }
      fetchAllData();
      closeCreateModal();
    } catch (err) {
      toast.error(`Error al crear ${catalogTab === 'bancos' ? 'banco' : 'billetera digital'}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCatalog = async (formData: any) => {
    if (!selectedItem?.id) return;
    
    setIsSubmitting(true);
    try {
      if (catalogTab === 'bancos') {
        await updateBanco(formData, selectedItem.id);
        toast.success('Banco actualizado exitosamente!');
      } else {
        await updateBilleteraDigitalCatalogo(formData, selectedItem.id);
        toast.success('Billetera digital actualizada exitosamente!');
      }
      fetchAllData();
      closeEditModal();
    } catch (err) {
      toast.error(`Error al actualizar ${catalogTab === 'bancos' ? 'banco' : 'billetera digital'}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCatalog = async (item: any, tipo: CatalogTabType) => {
    if (!item.id) return;
    
    try {
      // Si estamos desactivando un elemento del catálogo, mostrar confirmación
      if (item.is_active) {
        const confirm = window.confirm(
          `¿Está seguro de desactivar este ${tipo === 'bancos' ? 'banco' : 'billetera digital'}? ` +
          `Esto también desactivará todos los métodos financieros asociados a esta ${tipo === 'bancos' ? 'entidad bancaria' : 'plataforma'}.`
        );
        
        if (!confirm) return;
      }
      
      if (tipo === 'bancos') {
        await toggleActiveBanco(item.id);
        toast.success(`Banco ${item.is_active ? 'desactivado' : 'activado'} exitosamente!`);
        
        // Si se desactivó el banco, desactivar todas las cuentas bancarias asociadas
        if (item.is_active) {
          const cuentasAsociadas = cuentas.filter((cuenta: any) => cuenta.banco === item.id);
          for (const cuenta of cuentasAsociadas) {
            if (cuenta.detalle_id) {
              try {
                await toggleActiveMetodoFinanciero(cuenta.detalle_id);
              } catch (err) {
                console.error(`Error al desactivar cuenta asociada ${cuenta.id}:`, err);
              }
            }
          }
          if (cuentasAsociadas.length > 0) {
            toast.info(`Se desactivaron ${cuentasAsociadas.length} cuenta(s) bancaria(s) asociada(s)`);
          }
        }
      } else {
        await toggleActiveBilleteraDigitalCatalogo(item.id);
        toast.success(`Billetera digital ${item.is_active ? 'desactivada' : 'activada'} exitosamente!`);
        
        // Si se desactivó la billetera, desactivar todas las billeteras digitales asociadas
        if (item.is_active) {
          const billeterasAsociadas = billeteras.filter((billetera: any) => billetera.plataforma === item.id);
          for (const billetera of billeterasAsociadas) {
            if (billetera.detalle_id) {
              try {
                await toggleActiveMetodoFinanciero(billetera.detalle_id);
              } catch (err) {
                console.error(`Error al desactivar billetera asociada ${billetera.id}:`, err);
              }
            }
          }
          if (billeterasAsociadas.length > 0) {
            toast.info(`Se desactivaron ${billeterasAsociadas.length} billetera(s) digital(es) asociada(s)`);
          }
        }
      }
      
      fetchAllData();
    } catch (err) {
      toast.error(`Error al ${item.is_active ? 'desactivar' : 'activar'} ${tipo === 'bancos' ? 'banco' : 'billetera digital'}`);
      console.error(err);
    }
  };

  // Helper functions
  const getMetodoFinancieroId = (tipo: InstanceTabType): number => {
    // Buscar el ID del método financiero dinámicamente
    const metodo = metodos.find(m => {
      switch (tipo) {
        case 'cuentas': return m.nombre === 'TRANSFERENCIA_BANCARIA';
        case 'billeteras digitales': return m.nombre === 'BILLETERA_DIGITAL';
        default: return false;
      }
    });
    
    if (!metodo) {
      console.error(`No se encontró método financiero para tipo: ${tipo}`);
      return 1; // Fallback
    }
    
    return metodo.id!;
  };

  const getInstanceTabIcon = (tab: InstanceTabType) => {
    switch (tab) {
      case 'cuentas': return <Building2 className="w-5 h-5" />;
      case 'billeteras digitales': return <Smartphone className="w-5 h-5" />;
    }
  };

  const getInstanceTabLabel = (tab: InstanceTabType) => {
    switch (tab) {
      case 'cuentas': return 'Cuentas';
      case 'billeteras digitales': return 'Billeteras Digitales';
    }
  };

  const getInstanceTabSingular = (tab: InstanceTabType) => {
    switch (tab) {
      case 'cuentas': return 'cuenta';
      case 'billeteras digitales': return 'billetera digital';
    }
  };

  const getInstanceTabSingularTitle = (tab: InstanceTabType) => {
    switch (tab) {
      case 'cuentas': return 'Cuenta';
      case 'billeteras digitales': return 'Billetera Digital';
    }
  };

  const renderMetodoForm = () => {
    const initialData = selectedItem || {
      nombre: 'TRANSFERENCIA_BANCARIA',
      permite_cobro: true,
      permite_pago: true,
      comision_cobro_porcentaje: '0.00',
      comision_pago_porcentaje: '0.00',
      is_active: true
    };

    return (
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const data = {
            nombre: formData.get('nombre'),
            permite_cobro: formData.get('permite_cobro') === 'on',
            permite_pago: formData.get('permite_pago') === 'on',
            comision_cobro_porcentaje: formData.get('comision_cobro_porcentaje'),
            comision_pago_porcentaje: formData.get('comision_pago_porcentaje'),
            is_active: true
          };
          editModalOpen ? handleUpdateMetodo(data) : handleCreateMetodo(data);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Tipo de Método *
          </label>
          <select
            id="nombre"
            name="nombre"
            defaultValue={initialData.nombre}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          >
            <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
            <option value="BILLETERA_DIGITAL">Billetera Digital</option>
            <option value="METALICO">Metálico</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              id="permite_cobro"
              name="permite_cobro"
              type="checkbox"
              defaultChecked={initialData.permite_cobro}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="permite_cobro" className="ml-2 block text-sm text-gray-900">
              Permite Cobro
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="permite_pago"
              name="permite_pago"
              type="checkbox"
              defaultChecked={initialData.permite_pago}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="permite_pago" className="ml-2 block text-sm text-gray-900">
              Permite Pago
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="comision_cobro_porcentaje" className="block text-sm font-medium text-gray-700">
              Comisión Cobro (%)
            </label>
            <input
              type="number"
              id="comision_cobro_porcentaje"
              name="comision_cobro_porcentaje"
              step="0.01"
              min="0"
              max="100"
              defaultValue={initialData.comision_cobro_porcentaje}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="comision_pago_porcentaje" className="block text-sm font-medium text-gray-700">
              Comisión Pago (%)
            </label>
            <input
              type="number"
              id="comision_pago_porcentaje"
              name="comision_pago_porcentaje"
              step="0.01"
              min="0"
              max="100"
              defaultValue={initialData.comision_pago_porcentaje}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={closeCreateModal || closeEditModal}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Guardando..." : editModalOpen ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    );
  };

  const renderInstanceForm = () => {
    const initialData = selectedItem || undefined;
    
    switch (instanceTab) {
      case 'cuentas':
        return (
          <CuentaBancariaForm
            onSubmit={editModalOpen ? handleUpdateInstance : handleCreateInstance}
            initialData={initialData as CuentaBancaria}
            isSubmitting={isSubmitting}
          />
        );
      case 'billeteras digitales':
        return (
          <BilleteraDigitalForm
            onSubmit={editModalOpen ? handleUpdateInstance : handleCreateInstance}
            initialData={initialData as BilleteraDigital}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  const renderCatalogForm = () => {
    const initialData = selectedItem || undefined;
    
    switch (catalogTab) {
      case 'bancos':
        return (
          <BancoForm
            onSubmit={editModalOpen ? handleUpdateCatalog : handleCreateCatalog}
            initialData={initialData as Banco}
            isSubmitting={isSubmitting}
          />
        );
      case 'billeteras':
        return (
          <BilleteraDigitalCatalogoForm
            onSubmit={editModalOpen ? handleUpdateCatalog : handleCreateCatalog}
            initialData={initialData as BilleteraDigitalCatalogo}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    if (mainTab === 'catalogo') {
      const metodo = selectedItem as MetodoFinanciero;
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles del Método Financiero</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <p className="text-gray-900">{getDisplayName(metodo.nombre)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                metodo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {metodo.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permite Cobro</label>
              <p className="text-gray-900">{metodo.permite_cobro ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permite Pago</label>
              <p className="text-gray-900">{metodo.permite_pago ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comisión Cobro</label>
              <p className="text-gray-900">{metodo.comision_cobro_porcentaje}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comisión Pago</label>
              <p className="text-gray-900">{metodo.comision_pago_porcentaje}%</p>
            </div>
          </div>
        </div>
      );
    } else {
      switch (selectedItem.tipo) {
        case 'cuentas':
          const cuenta = selectedItem as CuentaBancaria & ExtendedItem;
          return (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles de Cuenta Bancaria</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Banco</label>
                  <p className="text-gray-900">{cuenta.banco}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titular</label>
                  <p className="text-gray-900">{cuenta.titular}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Cuenta</label>
                  <p className="text-gray-900">{cuenta.numero_cuenta}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CBU/CVU</label>
                  <p className="text-gray-900">{cuenta.cbu_cvu}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cuenta.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cuenta.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          );
        
        case 'billeteras digitales':
          const billetera = selectedItem as BilleteraDigital & ExtendedItem;
          return (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles de Billetera Digital</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plataforma</label>
                  <p className="text-gray-900">{billetera.plataforma}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario ID</label>
                  <p className="text-gray-900">{billetera.usuario_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{billetera.email}</p>
                </div>
                {billetera.telefono && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-gray-900">{billetera.telefono}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    billetera.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {billetera.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          );
        
        default:
          return <div className="text-gray-600">Detalles de instancia de la casa</div>;
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn, mainTab, search, page]);

  const filteredItems = mainTab === 'instancias' ? getFilteredItems() : [];

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Métodos Financieros</h1>
      </div>

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMainTab('catalogo')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === 'catalogo'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Catálogo de Métodos Financieros
            </button>
            <button
              onClick={() => setMainTab('catalogos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === 'catalogos'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Catálogos de Entidades
            </button>
            <button
              onClick={() => setMainTab('instancias')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === 'instancias'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Instancias de la Casa
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Create */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96 pl-4">
          <div className="flex w-full sm:w-64 md:w-96 gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={
                  mainTab === 'catalogo' 
                    ? 'Buscar métodos...' 
                    : mainTab === 'catalogos'
                      ? `Buscar ${catalogTab}...`
                      : `Buscar ${getInstanceTabLabel(instanceTab).toLowerCase()}...`
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchAllData();
                  }
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => {
                fetchAllData();
              }}
              className="btn-primary flex items-center justify-center"
            >
              Buscar
            </button>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" />
          Agregar
        </button>
      </div>

      {/* Instance Tabs (only shown when mainTab is 'instancias') */}
      {mainTab === 'instancias' && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['cuentas', 'billeteras digitales'] as InstanceTabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInstanceTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    instanceTab === tab
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getInstanceTabIcon(tab)}
                  <span>{getInstanceTabLabel(tab)}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Catalog Tabs (only shown when mainTab is 'catalogos') */}
      {mainTab === 'catalogos' && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCatalogTab('bancos')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  catalogTab === 'bancos'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Bancos</span>
              </button>
              <button
                onClick={() => setCatalogTab('billeteras')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  catalogTab === 'billeteras'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>Billeteras Digitales</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : mainTab === 'catalogo' ? (
          // Catalog table
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Permite Cobro</th>
                  <th>Permite Pago</th>
                  <th>Comisión Cobro</th>
                  <th>Comisión Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metodos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <p className="text-gray-600">No hay métodos financieros</p>
                    </td>
                  </tr>
                ) : (
                  metodos.map((metodo) => (
                    <tr key={metodo.id}>
                      <td className="font-medium">{getDisplayName(metodo.nombre)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metodo.permite_cobro ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {metodo.permite_cobro ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metodo.permite_pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {metodo.permite_pago ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>{metodo.comision_cobro_porcentaje}%</td>
                      <td>{metodo.comision_pago_porcentaje}%</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metodo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {metodo.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(metodo)}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleMetodo(metodo)}
                            className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                            title={metodo.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {metodo.is_active ? <X size={16} /> : <Check size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination for catalog */}
            {metodos.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4">
                <div className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 btn-primary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-1 btn-primary disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : mainTab === 'catalogos' ? (
          // Nueva sección de catálogos
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {catalogTab === 'bancos' ? (
                    bancos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <p className="text-gray-600">No hay bancos registrados</p>
                        </td>
                      </tr>
                    ) : (
                      bancos.map((banco) => (
                        <tr key={banco.id}>
                          <td className="font-medium">{banco.nombre}</td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              banco.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {banco.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>{banco.fecha_creacion ? new Date(banco.fecha_creacion).toLocaleDateString() : '-'}</td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(banco)}
                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleCatalog(banco, 'bancos')}
                                className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                                title={banco.is_active ? 'Desactivar' : 'Activar'}
                              >
                                {banco.is_active ? <X size={16} /> : <Check size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    billeterasCatalogo.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <p className="text-gray-600">No hay billeteras digitales registradas</p>
                        </td>
                      </tr>
                    ) : (
                      billeterasCatalogo.map((billetera) => (
                        <tr key={billetera.id}>
                          <td className="font-medium">{billetera.nombre}</td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              billetera.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {billetera.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>{billetera.fecha_creacion ? new Date(billetera.fecha_creacion).toLocaleDateString() : '-'}</td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(billetera)}
                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleCatalog(billetera, 'billeteras')}
                                className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                                title={billetera.is_active ? 'Desactivar' : 'Activar'}
                              >
                                {billetera.is_active ? <X size={16} /> : <Check size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
        ) : (
          // Instances grid
          filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                {getInstanceTabIcon(instanceTab)}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay {getInstanceTabLabel(instanceTab).toLowerCase()} de la casa
              </h3>
              <p className="text-gray-600 mb-4">
                {search 
                  ? `No se encontraron resultados para "${search}"`
                  : `Comienza creando la primera ${getInstanceTabSingular(instanceTab)} de la casa`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MetodoFinancieroCard
                  key={item.id}
                  item={item}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onToggleActive={handleToggleInstance}
                  isAdminView={true}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {mainTab === 'catalogo' 
              ? 'Crear Método Financiero' 
              : mainTab === 'catalogos'
                ? `Crear ${catalogTab === 'bancos' ? 'Banco' : 'Billetera Digital'}`
                : `Crear ${getInstanceTabSingularTitle(instanceTab)} de la Casa`
            }
          </h2>
          {mainTab === 'catalogo' 
            ? renderMetodoForm() 
            : mainTab === 'catalogos'
              ? renderCatalogForm()
              : renderInstanceForm()
          }
        </div>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={closeEditModal}>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {mainTab === 'catalogo' 
              ? 'Editar Método Financiero' 
              : mainTab === 'catalogos'
                ? `Editar ${catalogTab === 'bancos' ? 'Banco' : 'Billetera Digital'}`
                : `Editar ${getInstanceTabSingularTitle(instanceTab)} de la Casa`
            }
          </h2>
          {mainTab === 'catalogo' 
            ? renderMetodoForm() 
            : mainTab === 'catalogos'
              ? renderCatalogForm()
              : renderInstanceForm()
          }
        </div>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={closeViewModal}>
        {renderItemDetails()}
      </Modal>
    </div>
  );
};

export default MetodosFinancierosPage;
