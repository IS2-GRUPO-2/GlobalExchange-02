import { useState, useEffect } from 'react';
import { CreditCard, Building2, Smartphone, Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../../components/Modal';
import MetodoFinancieroCard from '../components/MetodoFinancieroCard';
import CuentaBancariaForm from '../components/CuentaBancariaForm';
import BilleteraDigitalForm from '../components/BilleteraDigitalForm';
import TarjetaForm from '../components/TarjetaForm';
import {
  getMisCuentasBancarias,
  getMisBilleterasDigitales,
  getMisTarjetas,
  createCuentaBancaria,
  createBilleteraDigital,
  createTarjeta,
  updateCuentaBancaria,
  updateBilleteraDigital,
  updateTarjeta,
  createDetalleMetodoFinanciero,
  toggleActiveMetodoFinancieroDetalle,
  getMetodosFinancieros
} from '../services/metodoFinancieroService';
import type { 
  CuentaBancaria, 
  BilleteraDigital, 
  Tarjeta, 
  MetodoFinancieroDetalle,
  MetodoFinanciero,
  ClienteTabType,
  ExtendedItem
} from '../types/MetodoFinanciero';

type TabType = ClienteTabType;

const MetodosFinancierosClientePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cuentas');
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [billeteras, setBilleteras] = useState<BilleteraDigital[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data functions - Solo cargar datos iniciales SIN búsqueda
  const fetchAllData = async () => {
    try {
      // Fetch todos los datos SIN parámetros de búsqueda
      const [metodosRes, cuentasRes, billeterasRes, tarjetasRes] = await Promise.all([
        getMetodosFinancieros(),
        getMisCuentasBancarias(), // Sin params - obtener todo
        getMisBilleterasDigitales(), // Sin params - obtener todo  
        getMisTarjetas() // Sin params - obtener todo
      ]);
      
      setMetodos(metodosRes.results);
      setCuentas(cuentasRes);
      setBilleteras(billeterasRes);
      setTarjetas(tarjetasRes);
    } catch (err) {
      toast.error('Error al cargar los métodos financieros');
    }
  };

  // Filtrar items del lado del cliente
  const getFilteredItems = (items: any[], tipo: ClienteTabType): ExtendedItem[] => {
    const extendedItems = items.map(item => ({
      ...item,
      tipo,
      is_active: item.metodo_financiero_detalle?.is_active ?? true,
      detalle_id: item.metodo_financiero_detalle?.id,
      desactivado_por_catalogo: item.metodo_financiero_detalle?.desactivado_por_catalogo ?? false
    }));

    if (!searchQuery.trim()) return extendedItems;

    const searchLower = searchQuery.toLowerCase();
    return extendedItems.filter(item => {
      switch (tipo) {
        case 'cuentas':
          const cuenta = item as CuentaBancaria & ExtendedItem;
          return (
            cuenta.titular?.toLowerCase().includes(searchLower) ||
            cuenta.numero_cuenta?.toLowerCase().includes(searchLower) ||
            cuenta.cbu_cvu?.toLowerCase().includes(searchLower) ||
            cuenta.banco_nombre?.toLowerCase().includes(searchLower)
          );
        case 'billeteras digitales':
          const billetera = item as BilleteraDigital & ExtendedItem;
          return (
            billetera.usuario_id?.toLowerCase().includes(searchLower) ||
            billetera.email?.toLowerCase().includes(searchLower) ||
            billetera.telefono?.toLowerCase().includes(searchLower) ||
            billetera.plataforma_nombre?.toLowerCase().includes(searchLower)
          );
        case 'tarjetas':
          const tarjeta = item as Tarjeta & ExtendedItem;
          return (
            (tarjeta as any).titular?.toLowerCase().includes(searchLower) ||
            (tarjeta as any).last4?.toLowerCase().includes(searchLower) ||
            (tarjeta as any).brand?.toLowerCase().includes(searchLower) ||
            (tarjeta as any).marca_nombre?.toLowerCase().includes(searchLower)
          );
        default:
          return true;
      }
    });
  };

  const getCurrentItems = (): ExtendedItem[] => {
    switch (activeTab as ClienteTabType) {
      case 'cuentas':
        return getFilteredItems(cuentas, 'cuentas');
      case 'billeteras digitales':
        return getFilteredItems(billeteras, 'billeteras digitales');
      case 'tarjetas':
        return getFilteredItems(tarjetas, 'tarjetas');
      default:
        return [];
    }
  };

  // Modal handlers
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setIsSubmitting(false);
  };

  const openEditModal = (item: ExtendedItem) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedItem(null);
    setEditModalOpen(false);
    setIsSubmitting(false);
  };

  const openViewModal = (item: ExtendedItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };
  const closeViewModal = () => {
    setSelectedItem(null);
    setViewModalOpen(false);
  };

  // CRUD operations
  const handleCreateItem = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Generar alias único con timestamp
      const timestamp = Date.now();
      const getAliasBase = (tab: TabType) => {
        switch (tab) {
          case 'cuentas': return 'Mi cuenta bancaria';
          case 'billeteras digitales': return 'Mi billetera digital';
          case 'tarjetas': return 'Mi tarjeta';
          default: return 'Mi método financiero';
        }
      };
      
      // Primero crear el detalle
      const detalleData: MetodoFinancieroDetalle = {
        cliente: null, // Se asignará automáticamente en el backend
        es_cuenta_casa: false,
        metodo_financiero: getMetodoFinancieroId(activeTab),
        alias: `${getAliasBase(activeTab)} - ${timestamp}`,
        is_active: true
      };

      const detalleRes = await createDetalleMetodoFinanciero(detalleData);
      const detalleId = detalleRes.data.id;

      // Luego crear el item específico
      const itemData = { ...formData, metodo_financiero_detalle: detalleId };

      switch (activeTab) {
        case 'cuentas':
          await createCuentaBancaria(itemData);
          break;
        case 'billeteras digitales':
          await createBilleteraDigital(itemData);
          break;
        case 'tarjetas':
          await createTarjeta(itemData);
          break;
      }

      toast.success(`${activeTab.slice(0, -1)} creado exitosamente!`);
      fetchAllData();
      closeCreateModal();
    } catch (err) {
      toast.error(`Error al crear ${activeTab.slice(0, -1)}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (formData: any) => {
    if (!selectedItem?.id) return;
    
    setIsSubmitting(true);
    try {
      switch (selectedItem.tipo as ClienteTabType) {
        case 'cuentas':
          await updateCuentaBancaria(formData, selectedItem.id);
          break;
        case 'billeteras digitales':
          await updateBilleteraDigital(formData, selectedItem.id);
          break;
        case 'tarjetas':
          await updateTarjeta(formData, selectedItem.id);
          break;
      }

      toast.success(`${selectedItem.tipo.slice(0, -1)} actualizado exitosamente!`);
      fetchAllData();
      closeEditModal();
    } catch (err) {
      toast.error(`Error al actualizar ${selectedItem.tipo.slice(0, -1)}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: ExtendedItem) => {
    if (!item.detalle_id) return;
    
    try {
      await toggleActiveMetodoFinancieroDetalle(item.detalle_id);
      toast.success(`${item.tipo.slice(0, -1)} ${item.is_active ? 'desactivado' : 'activado'} exitosamente!`);
      fetchAllData();
    } catch (err) {
      toast.error(`Error al ${item.is_active ? 'desactivar' : 'activar'} ${item.tipo.slice(0, -1)}`);
      console.error(err);
    }
  };

  // Helper functions
  const getMetodoFinancieroId = (tipo: TabType): number => {
    // Buscar el ID del método financiero dinámicamente
    const metodo = metodos.find(m => {
      switch (tipo) {
        case 'cuentas': return m.nombre === 'TRANSFERENCIA_BANCARIA';
        case 'billeteras digitales': return m.nombre === 'BILLETERA_DIGITAL';
        case 'tarjetas': return m.nombre === 'TARJETA';
        default: return false;
      }
    });
    
    if (!metodo) {
      console.error(`No se encontró método financiero para tipo: ${tipo}`);
      // Fallback a valores por defecto si no se encuentran los métodos
      switch (tipo) {
        case 'cuentas': return 1; // TRANSFERENCIA_BANCARIA
        case 'billeteras digitales': return 2; // BILLETERA_DIGITAL
        case 'tarjetas': return 3; // TARJETA
        default: return 1;
      }
    }
    
    return metodo.id!;
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'cuentas': return <Building2 className="w-5 h-5" />;
      case 'billeteras digitales': return <Smartphone className="w-5 h-5" />;
      case 'tarjetas': return <CreditCard className="w-5 h-5" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'cuentas': return 'Cuentas Bancarias';
      case 'billeteras digitales': return 'Billeteras Digitales';
      case 'tarjetas': return 'Tarjetas';
    }
  };

  const getTabSingular = (tab: TabType) => {
    switch (tab) {
      case 'cuentas': return 'Cuenta Bancaria';
      case 'billeteras digitales': return 'Billetera Digital';
      case 'tarjetas': return 'Tarjeta';
    }
  };

  const renderForm = () => {
    const initialData = selectedItem || undefined;
    
    switch (activeTab) {
      case 'cuentas':
        return (
          <CuentaBancariaForm
            onSubmit={editModalOpen ? handleUpdateItem : handleCreateItem}
            initialData={initialData as CuentaBancaria}
            isSubmitting={isSubmitting}
          />
        );
      case 'billeteras digitales':
        return (
          <BilleteraDigitalForm
            onSubmit={editModalOpen ? handleUpdateItem : handleCreateItem}
            initialData={initialData as BilleteraDigital}
            isSubmitting={isSubmitting}
          />
        );
      case 'tarjetas':
        return (
          <TarjetaForm
            onSubmit={editModalOpen ? handleUpdateItem : handleCreateItem}
            initialData={initialData && activeTab === 'tarjetas' ? (initialData as unknown as Tarjeta) : undefined}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    switch (selectedItem.tipo as ClienteTabType) {
      case 'cuentas':
        const cuenta = selectedItem as CuentaBancaria & ExtendedItem;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles de Cuenta Bancaria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Banco</label>
                <p className="text-gray-900">{cuenta.banco_nombre || `Banco ID: ${cuenta.banco}`}</p>
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
                <p className="text-gray-900">{billetera.plataforma_nombre || `Plataforma ID: ${billetera.plataforma}`}</p>
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
      
      case 'tarjetas':
        const tarjeta = selectedItem as Tarjeta & ExtendedItem;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles de Tarjeta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-gray-900">{(tarjeta as any).tipo || 'LOCAL'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <p className="text-gray-900">{(tarjeta as any).brand || (tarjeta as any).marca_nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Titular</label>
                <p className="text-gray-900">{(tarjeta as any).titular}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Últimos 4 dígitos</label>
                <p className="text-gray-900">**** {(tarjeta as any).last4}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vencimiento</label>
                <p className="text-gray-900">
                  {(tarjeta as any).exp_month?.toString().padStart(2, '0')}/{(tarjeta as any).exp_year}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  (tarjeta as any).is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {(tarjeta as any).is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo cargar UNA vez, sin dependencia de searchQuery

  const currentItems = getCurrentItems();

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Métodos Financieros</h1>
      </div>

      {/* Search and Create */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Buscar ${getTabLabel(activeTab).toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" />
          Crear {getTabSingular(activeTab)}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['cuentas', 'billeteras digitales', 'tarjetas'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabIcon(tab)}
                <span>{getTabLabel(tab)}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {currentItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              {getTabIcon(activeTab)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay {getTabLabel(activeTab).toLowerCase()}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No se encontraron resultados para "${searchQuery}"`
                : `Comienza agregando tu primer ${activeTab.slice(0, -1)}`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((item) => (
              <MetodoFinancieroCard
                key={item.id}
                item={item}
                onView={openViewModal as any}
                onEdit={openEditModal as any}
                onToggleActive={handleToggleActive as any}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Crear {getTabSingular(activeTab)}
          </h2>
          {renderForm()}
        </div>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={closeEditModal}>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Editar {getTabSingular(activeTab)}
          </h2>
          {renderForm()}
        </div>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={closeViewModal}>
        {renderItemDetails()}
      </Modal>
    </div>
  );
};

export default MetodosFinancierosClientePage;
