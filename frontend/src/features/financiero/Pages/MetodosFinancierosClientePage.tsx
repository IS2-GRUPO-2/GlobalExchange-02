import { useState, useEffect } from 'react';
import { CreditCard, Building2, Smartphone, Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/useAuth';
import Modal from '../../../components/Modal';
import MetodoFinancieroCard from '../components/MetodoFinancieroCard';
import CuentaBancariaForm from '../components/CuentaBancariaForm';
import BilleteraDigitalForm from '../components/BilleteraDigitalForm';
import TarjetaForm from '../components/TarjetaForm';
import {
  getCuentasBancarias,
  getBilleterasDigitales,
  getTarjetas,
  createCuentaBancaria,
  createBilleteraDigital,
  createTarjeta,
  updateCuentaBancaria,
  updateBilleteraDigital,
  updateTarjeta,
  getDetallesMetodosFinancieros,
  createDetalleMetodoFinanciero,
  toggleActiveMetodoFinanciero,
  getMetodosFinancieros
} from '../services/metodoFinancieroService';
import type { 
  CuentaBancaria, 
  BilleteraDigital, 
  Tarjeta, 
  MetodoFinancieroDetalle,
  MetodoFinanciero,
  InstanceTabType
} from '../types/MetodoFinanciero';

type TabType = InstanceTabType;

// ExtendedItem específico para esta página que maneja Tarjetas Stripe (no TarjetaLocal)
type ExtendedItem = (CuentaBancaria | BilleteraDigital | Tarjeta) & {
  tipo: TabType;
  is_active: boolean;
  detalle_id?: number;
  desactivado_por_catalogo?: boolean;
};

const MetodosFinancierosClientePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cuentas');
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [billeteras, setBilleteras] = useState<BilleteraDigital[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [detalles, setDetalles] = useState<MetodoFinancieroDetalle[]>([]);
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoggedIn } = useAuth();

  // Fetch data functions
  const fetchMetodos = async () => {
    try {
      const res = await getMetodosFinancieros();
      setMetodos(res.results);
    } catch (err) {
      console.error('Error fetching métodos:', err);
    }
  };

  const fetchDetalles = async () => {
    try {
      const res = await getDetallesMetodosFinancieros({ search });
      setDetalles(res.results.filter(d => !d.es_cuenta_casa));
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

  const fetchTarjetas = async () => {
    try {
      const res = await getTarjetas({ search });
      setTarjetas(res.results);
    } catch (err) {
      console.error('Error fetching tarjetas:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetodos(),
        fetchDetalles(),
        fetchCuentas(),
        fetchBilleteras(),
        fetchTarjetas()
      ]);
    } catch (err) {
      toast.error('Error al cargar los métodos financieros');
    } finally {
      setLoading(false);
    }
  };

  // Create extended items with active status from detalles
  const getExtendedItems = (items: any[], tipo: TabType): ExtendedItem[] => {
    return items.map(item => {
      const detalle = detalles.find((d: MetodoFinancieroDetalle) => d.id === item.metodo_financiero_detalle);
      return {
        ...item,
        tipo,
        is_active: detalle?.is_active ?? true,
        detalle_id: detalle?.id,
        desactivado_por_catalogo: detalle?.desactivado_por_catalogo ?? false
      };
    });
  };

  const getFilteredItems = (): ExtendedItem[] => {
    let items: ExtendedItem[] = [];
    
    switch (activeTab) {
      case 'cuentas':
        items = getExtendedItems(cuentas, 'cuentas');
        break;
      case 'billeteras digitales':
        items = getExtendedItems(billeteras, 'billeteras digitales');
        break;
      case 'tarjetas':
        items = getExtendedItems(tarjetas, 'tarjetas');
        break;
    }

    if (!search) return items;
    
    return items.filter(item => {
      const searchLower = search.toLowerCase();
      switch (item.tipo) {
        case 'cuentas':
          const cuenta = item as CuentaBancaria & ExtendedItem;
          return (cuenta.banco_nombre?.toLowerCase().includes(searchLower) ?? false) ||
                 cuenta.titular.toLowerCase().includes(searchLower) ||
                 cuenta.numero_cuenta.includes(searchLower);
        case 'billeteras digitales':
          const billetera = item as BilleteraDigital & ExtendedItem;
          return (billetera.plataforma_nombre?.toLowerCase().includes(searchLower) ?? false) ||
                 billetera.usuario_id.toLowerCase().includes(searchLower) ||
                 (billetera.email?.toLowerCase().includes(searchLower) ?? false);
        case 'tarjetas':
          const tarjeta = item as Tarjeta & ExtendedItem;
          return tarjeta.brand.toLowerCase().includes(searchLower) ||
                 tarjeta.titular.toLowerCase().includes(searchLower) ||
                 tarjeta.last4.includes(searchLower);
        default:
          return false;
      }
    });
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
      switch (selectedItem.tipo) {
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
      await toggleActiveMetodoFinanciero(item.detalle_id);
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
            initialData={initialData as Tarjeta}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    switch (selectedItem.tipo) {
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
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <p className="text-gray-900">{tarjeta.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Titular</label>
                <p className="text-gray-900">{tarjeta.titular}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Últimos 4 dígitos</label>
                <p className="text-gray-900">**** {tarjeta.last4}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vencimiento</label>
                <p className="text-gray-900">
                  {tarjeta.exp_month.toString().padStart(2, '0')}/{tarjeta.exp_year}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tarjeta.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tarjeta.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  useEffect(() => {
    if (isLoggedIn()) {
      fetchAllData();
    }
  }, [isLoggedIn, search]);

  // Actualizar datos cuando la página vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn()) {
        fetchAllData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn]);

  // Actualizar datos cada 30 segundos para reflejar cambios en tiempo real
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const filteredItems = getFilteredItems();

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Métodos Financieros</h1>
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
                placeholder={`Buscar ${getTabLabel(activeTab).toLowerCase()}...`}
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
                toast.info('Datos actualizados');
              }}
              className="btn-primary flex items-center justify-center px-4 py-2"
              title="Actualizar datos"
            >
              <Search size={18} />
            </button>
          </div>
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
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              {getTabIcon(activeTab)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay {getTabLabel(activeTab).toLowerCase()}
            </h3>
            <p className="text-gray-600 mb-4">
              {search 
                ? `No se encontraron resultados para "${search}"`
                : `Comienza agregando tu primer ${activeTab.slice(0, -1)}`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
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
