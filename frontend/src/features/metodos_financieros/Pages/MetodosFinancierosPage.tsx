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
  const [search, setSearch] = useState("");

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
      metodosHook.fetchMetodos(search, metodosHook.page);
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
      metodosHook.fetchMetodos(search, metodosHook.page);
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleMetodo = async (metodo: any) => {
    const success = await metodosHook.toggleMetodo(metodo);
    if (success) {
      metodosHook.fetchMetodos(search, metodosHook.page);
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
      instanciasHook.fetchInstancias(search);
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
      instanciasHook.fetchInstancias(search);
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleInstancia = async (item: ExtendedItem) => {
    const success = await instanciasHook.toggleInstancia(item);
    if (success) {
      instanciasHook.fetchInstancias(search);
    }
  };

  // Handlers para catálogos
  const handleCreateCatalog = async (formData: any) => {
    modalHook.setIsSubmitting(true);
    const success = await catalogosHook.createCatalogItem(formData, catalogTab);
    if (success) {
      catalogosHook.fetchCatalogos(search);
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
      catalogosHook.fetchCatalogos(search);
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleCatalog = async (item: any, tipo: CatalogTabType) => {
    const success = await catalogosHook.toggleCatalogItem(item, tipo);
    if (success) {
      catalogosHook.fetchCatalogos(search);
      // También actualizar las instancias para reflejar cambios en cascada
      instanciasHook.fetchInstancias(search);
    }
  };

  // Función de búsqueda unificada
  const handleSearch = () => {
    switch (mainTab) {
      case "catalogo":
        metodosHook.fetchMetodos(search, 1);
        break;
      case "catalogos":
        catalogosHook.fetchCatalogos(search);
        break;
      case "instancias":
        instanciasHook.fetchInstancias(search);
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
      return (
        <MetodoFinancieroTable
          metodos={metodosHook.metodos}
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
      return (
        <CatalogTable
          bancos={catalogosHook.bancos}
          billeterasCatalogo={catalogosHook.billeterasCatalogo}
          tarjetasCatalogo={catalogosHook.tarjetasCatalogo}
          catalogTab={catalogTab}
          loading={loading}
          onEdit={modalHook.openEditModal}
          onToggle={handleToggleCatalog}
        />
      );
    }

    if (mainTab === "instancias") {
      const filteredItems = filterInstances(
        instanciasHook.cuentas,
        instanciasHook.billeteras,
        instanceTab,
        search,
        instanciasHook.getExtendedItems
      );

      return (
        <InstancesGrid
          items={filteredItems}
          instanceTab={instanceTab}
          search={search}
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
      metodosHook.fetchMetodos(search, metodosHook.page);
    } else if (mainTab === "catalogos") {
      catalogosHook.fetchCatalogos(search);
    } else {
      instanciasHook.fetchInstancias(search);
    }
  }, [isLoggedIn, mainTab, search, metodosHook.page]);

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
        search={search}
        setSearch={setSearch}
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
