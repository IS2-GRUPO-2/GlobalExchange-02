import { useState, useEffect } from "react";
import { useAuth } from "../../../context/useAuth";
import Modal from "../../../components/Modal";
import { useMetodosFinancieros } from "../hooks/useMetodosFinancieros";
import { useInstancias } from "../hooks/useInstancias";
import { useCatalogos } from "../hooks/useCatalogos";
import { useModal } from "../../../hooks/useModal";

import { TabNavigation } from "../components/TabNavigation";
import { SearchAndCreate } from "../components/SearchAndCreate";
import { MetodoFinancieroTable } from "../components/MetodoFinancieroTable";
import { CatalogTable } from "../components/CatalogTable";
import { InstancesGrid } from "../components/InstancesGrid";
import MetodoFinancieroForm from "../components/MetodoFinancieroForm";
import { ItemDetailsView } from "../components/ItemDetailsView";

import CuentaBancariaForm from "../components/CuentaBancariaForm";
import BilleteraDigitalForm from "../components/BilleteraDigitalForm";
import BancoForm from "../components/BancoForm";
import BilleteraDigitalCatalogoForm from "../components/BilleteraDigitalCatalogoForm";
import TarjetaCatalogoForm from "../components/TarjetaCatalogoForm";

import {
  filterInstances,
  getMetodoFinancieroId,
} from "../utils/metodosFinancierosUtils";

import type {
  MainTabType,
  InstanceTabType,
  CatalogTabType,
  ExtendedItem,
} from "../types/MetodoFinanciero";

const MetodosFinancierosPage = () => {
  const [mainTab, setMainTab] = useState<MainTabType>("catalogo");
  const [instanceTab, setInstanceTab] = useState<InstanceTabType>("cuentas");
  const [catalogTab, setCatalogTab] = useState<CatalogTabType>("bancos");
  const [searchQuery, setSearchQuery] = useState("");

  // Hooks personalizados
  const { isLoggedIn } = useAuth();
  const metodosHook = useMetodosFinancieros();
  const instanciasHook = useInstancias();
  const catalogosHook = useCatalogos();
  const modalHook = useModal();

  // Handlers para métodos financieros (catálogo)
  const handleCreateMetodo = async (formData: any) => {
    modalHook.setIsSubmitting(true);
    const success = await metodosHook.createMetodo(formData);
    if (success) {
      metodosHook.fetchMetodos("", metodosHook.page); // Recargar sin búsqueda
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleUpdateMetodo = async (formData: any) => {
    if (!modalHook.selectedItem?.id) return;

    modalHook.setIsSubmitting(true);
    const success = await metodosHook.updateMetodo(
      formData,
      modalHook.selectedItem.id
    );
    if (success) {
      metodosHook.fetchMetodos("", metodosHook.page); // Recargar sin búsqueda
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleMetodo = async (metodo: any) => {
    const success = await metodosHook.toggleMetodo(metodo);
    if (success) {
      metodosHook.fetchMetodos("", metodosHook.page); // Recargar sin búsqueda
    }
  };

  // Handlers para instancias
  const handleCreateInstancia = async (formData: any) => {
    modalHook.setIsSubmitting(true);
    const metodoId = getMetodoFinancieroId(instanceTab, metodosHook.metodos);
    const success = await instanciasHook.createInstancia(
      formData,
      instanceTab,
      metodoId
    );
    if (success) {
      instanciasHook.fetchInstancias(""); // Recargar sin búsqueda
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleUpdateInstancia = async (formData: any) => {
    if (!modalHook.selectedItem) return;

    modalHook.setIsSubmitting(true);
    const success = await instanciasHook.updateInstancia(
      formData,
      modalHook.selectedItem
    );
    if (success) {
      instanciasHook.fetchInstancias(""); // Recargar sin búsqueda
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleInstancia = async (item: ExtendedItem) => {
    const success = await instanciasHook.toggleInstancia(item);
    if (success) {
      instanciasHook.fetchInstancias(""); // Recargar sin búsqueda
    }
  };

  // Handlers para catálogos
  const handleCreateCatalog = async (formData: any) => {
    modalHook.setIsSubmitting(true);
    const success = await catalogosHook.createCatalogItem(formData, catalogTab);
    if (success) {
      catalogosHook.fetchCatalogos("", catalogosHook.page); // Recargar sin búsqueda
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleUpdateCatalog = async (formData: any) => {
    if (!modalHook.selectedItem?.id) return;

    modalHook.setIsSubmitting(true);
    const success = await catalogosHook.updateCatalogItem(
      formData,
      modalHook.selectedItem.id,
      catalogTab
    );
    if (success) {
      catalogosHook.fetchCatalogos("", catalogosHook.page); // Recargar sin búsqueda
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleCatalog = async (item: any, tipo: CatalogTabType) => {
    const success = await catalogosHook.toggleCatalogItem(item, tipo);
    if (success) {
      catalogosHook.fetchCatalogos("", catalogosHook.page); // Recargar sin búsqueda
      // También actualizar las instancias para reflejar cambios en cascada
      instanciasHook.fetchInstancias(""); // Recargar sin búsqueda
    }
  };

  // Función de filtrado del lado del cliente para métodos financieros
  const getFilteredMetodos = () => {
    if (!searchQuery.trim()) return metodosHook.metodos;
    
    const searchLower = searchQuery.toLowerCase();
    return metodosHook.metodos.filter(metodo => 
      metodo.nombre.toLowerCase().includes(searchLower) ||
      metodo.nombre_display?.toLowerCase().includes(searchLower)
    );
  };

  // Función de filtrado del lado del cliente para catálogos
  const getFilteredCatalogos = () => {
    if (!searchQuery.trim()) {
      return {
        bancos: catalogosHook.bancos,
        billeterasCatalogo: catalogosHook.billeterasCatalogo,
        tarjetasCatalogo: catalogosHook.tarjetasCatalogo
      };
    }

    const searchLower = searchQuery.toLowerCase();
    return {
      bancos: catalogosHook.bancos.filter(banco => 
        banco.nombre.toLowerCase().includes(searchLower) ||
        banco.cvu?.toLowerCase().includes(searchLower)
      ),
      billeterasCatalogo: catalogosHook.billeterasCatalogo.filter(billetera => 
        billetera.nombre.toLowerCase().includes(searchLower)
      ),
      tarjetasCatalogo: catalogosHook.tarjetasCatalogo.filter(tarjeta => 
        tarjeta.marca.toLowerCase().includes(searchLower)
      )
    };
  };

  // Función de búsqueda unificada - ahora solo para casos especiales
  const handleSearch = () => {
    switch (mainTab) {
      case "catalogo":
        metodosHook.fetchMetodos(searchQuery, 1);
        break;
      case "catalogos":
        catalogosHook.fetchCatalogos(searchQuery, 1);
        break;
      case "instancias":
        instanciasHook.fetchInstancias(searchQuery);
        break;
    }
  };

  // Renderizado de formularios
  const renderForm = () => {
    if (mainTab === "catalogo") {
      return (
        <MetodoFinancieroForm
          metodo={modalHook.selectedItem}
          isEditForm={modalHook.editModalOpen}
          onSubmit={
            modalHook.editModalOpen ? handleUpdateMetodo : handleCreateMetodo
          }
          onCancel={
            modalHook.editModalOpen
              ? modalHook.closeEditModal
              : modalHook.closeCreateModal
          }
        />
      );
    }

    if (mainTab === "catalogos") {
      const initialData = modalHook.selectedItem || undefined;

      if (catalogTab === "bancos") {
        return (
          <BancoForm
            onSubmit={
              modalHook.editModalOpen
                ? handleUpdateCatalog
                : handleCreateCatalog
            }
            banco={initialData}
            isSubmitting={modalHook.isSubmitting}
            onCancel={
              modalHook.editModalOpen
                ? modalHook.closeEditModal
                : modalHook.closeCreateModal
            }
          />
        );
      } else if (catalogTab === "billeteras") {
        return (
          <BilleteraDigitalCatalogoForm
            onSubmit={
              modalHook.editModalOpen
                ? handleUpdateCatalog
                : handleCreateCatalog
            }
            billetera={initialData}
            isSubmitting={modalHook.isSubmitting}
            onCancel={
              modalHook.editModalOpen
                ? modalHook.closeEditModal
                : modalHook.closeCreateModal
            }
          />
        );
      } else {
        return (
          <TarjetaCatalogoForm
            onSubmit={
              modalHook.editModalOpen
                ? handleUpdateCatalog
                : handleCreateCatalog
            }
            marca={initialData}
            isSubmitting={modalHook.isSubmitting}
            onCancel={
              modalHook.editModalOpen
                ? modalHook.closeEditModal
                : modalHook.closeCreateModal
            }
          />
        );
      }
    }

    if (mainTab === "instancias") {
      const initialData = modalHook.selectedItem || undefined;

      if (instanceTab === "cuentas") {
        return (
          <CuentaBancariaForm
            onSubmit={
              modalHook.editModalOpen
                ? handleUpdateInstancia
                : handleCreateInstancia
            }
            initialData={initialData}
            isSubmitting={modalHook.isSubmitting}
          />
        );
      } else if (instanceTab === "billeteras digitales") {
        return (
          <BilleteraDigitalForm
            onSubmit={
              modalHook.editModalOpen
                ? handleUpdateInstancia
                : handleCreateInstancia
            }
            initialData={initialData}
            isSubmitting={modalHook.isSubmitting}
          />
        );
      }
      return null;
    }

    return null;
  };

  // Renderizado del contenido principal
  const renderContent = () => {
    const loading =
      metodosHook.loading || instanciasHook.loading || catalogosHook.loading;

    if (mainTab === "catalogo") {
      const filteredMetodos = getFilteredMetodos();
      return (
        <MetodoFinancieroTable
          metodos={filteredMetodos}
          loading={loading}
          onEdit={modalHook.openEditModal}
          onToggle={handleToggleMetodo}
          page={metodosHook.page}
          totalPages={metodosHook.totalPages}
          onPageChange={metodosHook.setPage}
        />
      );
    }

    if (mainTab === "catalogos") {
      const filteredCatalogos = getFilteredCatalogos();
      const hasSearchQuery = searchQuery.trim() !== "";
      
      return (
        <CatalogTable
          bancos={filteredCatalogos.bancos}
          billeterasCatalogo={filteredCatalogos.billeterasCatalogo}
          tarjetasCatalogo={filteredCatalogos.tarjetasCatalogo}
          catalogTab={catalogTab}
          loading={loading}
          onEdit={modalHook.openEditModal}
          onToggle={handleToggleCatalog}
          page={hasSearchQuery ? 1 : catalogosHook.page}
          totalPages={hasSearchQuery ? 1 : catalogosHook.totalPages}
          onPageChange={hasSearchQuery ? undefined : (page: number) => {
            catalogosHook.setPage(page);
            catalogosHook.fetchCatalogos("", page); // Sin búsqueda para paginación del servidor
          }}
        />
      );
    }

    if (mainTab === "instancias") {
      const filteredItems = filterInstances(
        instanciasHook.cuentas,
        instanciasHook.billeteras,
        instanceTab,
        searchQuery,
        instanciasHook.getExtendedItems
      );

      return (
        <InstancesGrid
          items={filteredItems}
          instanceTab={instanceTab}
          search={searchQuery}
          loading={loading}
          onView={modalHook.openViewModal}
          onEdit={modalHook.openEditModal}
          onToggle={handleToggleInstancia}
        />
      );
    }

    return null;
  };

  // Obtener título del modal
  const getModalTitle = () => {
    const action = modalHook.editModalOpen ? "Editar" : "Crear";

    if (mainTab === "catalogo") {
      return `${action} Método Financiero`;
    }

    if (mainTab === "catalogos") {
      return `${action} ${
        catalogTab === "bancos" ? "Banco" : 
        catalogTab === "billeteras" ? "Billetera Digital" :
        "Tarjetas"
      }`;
    }

    if (mainTab === "instancias") {
      const tipo = instanceTab === "cuentas" ? "Cuenta" : 
                  instanceTab === "billeteras digitales" ? "Billetera Digital" :
                  "";
      return `${action} ${tipo} de la Casa`;
    }

    return action;
  };

  // Efecto para cargar datos
  useEffect(() => {
    if (!isLoggedIn()) return;

    if (mainTab === "catalogo") {
      metodosHook.fetchMetodos("", metodosHook.page); // Sin búsqueda inicial
    } else if (mainTab === "catalogos") {
      catalogosHook.fetchCatalogos("", 1); // Sin búsqueda inicial
    } else {
      instanciasHook.fetchInstancias(""); // Sin búsqueda inicial
    }
  }, [isLoggedIn, mainTab, metodosHook.page]); // Quitar searchQuery de las dependencias

  // Este useEffect maneja el filtrado en tiempo real del lado del cliente
  useEffect(() => {
    // Solo re-renderiza cuando cambia searchQuery, sin hacer llamadas al backend
    // El filtrado se hace en las funciones getFilteredMetodos() y getFilteredCatalogos()
  }, [searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Métodos Financieros
        </h1>
      </div>

      {/* Navigation Tabs */}
      <TabNavigation
        mainTab={mainTab}
        setMainTab={setMainTab}
        instanceTab={instanceTab}
        setInstanceTab={setInstanceTab}
        catalogTab={catalogTab}
        setCatalogTab={setCatalogTab}
      />

      {/* Search and Create */}
      <SearchAndCreate
        search={searchQuery}
        setSearch={setSearchQuery}
        onSearch={handleSearch}
        onCreateClick={modalHook.openCreateModal}
        mainTab={mainTab}
        instanceTab={instanceTab}
        catalogTab={catalogTab}
      />

      {/* Content */}
      <div className="card">{renderContent()}</div>

      {/* Modals */}
      <Modal
        isOpen={modalHook.createModalOpen}
        onClose={modalHook.closeCreateModal}
      >
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {getModalTitle()}
          </h2>
          {renderForm()}
        </div>
      </Modal>

      <Modal
        isOpen={modalHook.editModalOpen}
        onClose={modalHook.closeEditModal}
      >
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {getModalTitle()}
          </h2>
          {renderForm()}
        </div>
      </Modal>

      <Modal
        isOpen={modalHook.viewModalOpen}
        onClose={modalHook.closeViewModal}
      >
        <ItemDetailsView
          selectedItem={modalHook.selectedItem}
          mainTab={mainTab}
        />
      </Modal>
    </div>
  );
};

export default MetodosFinancierosPage;
