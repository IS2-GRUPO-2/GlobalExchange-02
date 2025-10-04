import { Check, Coins, Edit, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { type Divisa } from "../features/divisas/types/Divisa";
import { createDenominacion } from "../features/divisas/services/divisaService";
import Modal from "../components/Modal";
import DivisaForm, { type DivisaFormData } from "../components/DivisaForm";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import DenominacionesDivisa, {
  type DenominacionFormData,
} from "../components/DenominacionesDivisa";
import { useModal } from "../hooks/useModal";
import { useDivisa } from "../features/divisas/hooks/useDivisa";
import SearchBar from "../components/SearchBar";
import type { Tab } from "../types/Tab";
import Sidebar from "../components/Sidebar";
import LimiteConfigForm from "../features/divisas/components/LimiteConfigForm";
import Can from "../components/Can";
import { DENOMINACIONES, DIVISAS, LIMITES_DIVISA_CONFIG } from "../types/perms";

const DivisasPage = () => {
  const tabs: Tab[] = [
    { key: "divisas", icon: "fal fa-coins", label: "Divisas" },
    { key: "configs", icon: "fal fa-cog", label: "Configuración" },
  ];

  const [search, setSearch] = useState("");
  const [selectedDivisa, setSelectedDivisa] = useState<Divisa | null>(null);
  const [denominacionesModalOpen, setDenominacionesModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);
  const { isLoggedIn } = useAuth();
  const divisasHook = useDivisa();
  const modalHook = useModal();

  const openDenominacionesModal = (divisa: Divisa) => {
    setSelectedDivisa(divisa);
    setDenominacionesModalOpen(true);
  };

  const closeDenominacionesModal = () => {
    setSelectedDivisa(null);
    setDenominacionesModalOpen(false);
  };

  const handleCreateDivisa = async (divisaData: DivisaFormData) => {
    modalHook.setIsSubmitting(true);
    const success = await divisasHook.createDivisaHook(divisaData);
    if (success) {
      divisasHook.fetchDivisas();
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleUpdateDivisa = async (divisaData: DivisaFormData) => {
    modalHook.setIsSubmitting(true);
    const success = await divisasHook.updateDivisaHook(
      divisaData,
      modalHook.selectedItem!
    );
    if (success) {
      divisasHook.fetchDivisas();
      modalHook.closeEditModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleDivisa = async (divisa: Divisa) => {
    const success = await divisasHook.toggleDivisa(divisa);
    if (success) {
      divisasHook.fetchDivisas(search, divisasHook.page);
    }
  };

  const handleCreateDenominacion = async (
    denominacionData: DenominacionFormData
  ) => {
    try {
      const res = await createDenominacion(
        denominacionData.denominacion,
        selectedDivisa?.id!
      );
      if (res.status === 201) {
        toast.success("Denominacion creada con éxito!");
      }
    } catch (e) {
      toast.error("Ha ocurrido un error creando la denominación.");
    }
  };

  const onSearch = () => {
    divisasHook.setPage(1);
    divisasHook.fetchDivisas(search, divisasHook.page);
  };

  useEffect(() => {
    divisasHook.fetchDivisas(search, divisasHook.page);
  }, [divisasHook.page, isLoggedIn]);

  return (
    <div className="bg-gray-50 min-h-screen flex">
      <Sidebar
        header="Divisas"
        isLeftSidebarCollapsed={isSidebarCollapsed}
        changeIsLeftSidebarCollapsed={setIsSidebarCollapsed}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        items={tabs}
      ></Sidebar>
      <div className={`flex-1 transition-all duration-500 p-6`}>
        {selectedTab.key === "divisas" && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex w-full sm:w-64 md:w-96 gap-2">
                <SearchBar
                  search={search}
                  setSearch={setSearch}
                  onSearch={onSearch}
                />
              </div>
              <Can anyOf={[DIVISAS.ADD]}>
                <button
                  onClick={modalHook.openCreateModal}
                  className="btn-primary flex items-center justify-center"
                >
                  <Plus size={18} className="mr-2" />
                  Crear Divisa
                </button>
              </Can>
            </div>

            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Símbolo</th>
                      <th>Máx. dígitos</th>
                      <th>Precisión</th>
                      <th>Base</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {divisasHook.loading ? (
                      <tr>
                        <td>
                          <div>Cargando</div>
                        </td>
                      </tr>
                    ) : divisasHook.err ? (
                      <tr>
                        <td>
                          <div>Ha ocurrido un error</div>
                        </td>
                      </tr>
                    ) : divisasHook.divisas === undefined ? (
                      <tr>
                        <td>
                          <div>No hay datos</div>
                        </td>
                      </tr>
                    ) : (
                      divisasHook.divisas.map((divisa: Divisa) => (
                        <tr key={divisa.id}>
                          <td className="font-medium">{divisa.nombre}</td>
                          <td>{divisa.codigo}</td>
                          <td>{divisa.simbolo}</td>
                          <td>{divisa.max_digitos}</td>
                          <td>{divisa.precision}</td>
                          <td>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                divisa.es_base
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {divisa.es_base ? "Sí" : "No"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                divisa.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-900"
                              }`}
                            >
                              {divisa.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <Can anyOf={[DIVISAS.CHANGE]}>
                                <button
                                  onClick={() =>
                                    modalHook.openEditModal(divisa)
                                  }
                                  className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                              </Can>
                              <Can anyOf={[DIVISAS.DELETE]}>
                                <button
                                  onClick={() => handleToggleDivisa(divisa)}
                                  className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                                  title={
                                    divisa.is_active ? "Desactivar" : "Activar"
                                  }
                                >
                                  {divisa.is_active ? (
                                    <X size={16} />
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </button>
                              </Can>
                              <Can anyOf={[DENOMINACIONES.VIEW]}>
                                <button
                                  onClick={() =>
                                    openDenominacionesModal(divisa)
                                  }
                                  className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                  title="Gestionar denominaciones"
                                >
                                  <Coins size={16} />
                                </button>
                              </Can>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7}>
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-gray-600">
                            Página {divisasHook.page} de{" "}
                            {divisasHook.totalPages}
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={() =>
                                divisasHook.setPage((p) => Math.max(p - 1, 1))
                              }
                              disabled={divisasHook.page === 1}
                              className="px-3 py-1 btn-primary disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() =>
                                divisasHook.setPage((p) =>
                                  Math.min(p + 1, divisasHook.totalPages)
                                )
                              }
                              disabled={
                                divisasHook.page === divisasHook.totalPages
                              }
                              className="px-3 py-1 btn-primary disabled:opacity-50"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Modal
                isOpen={modalHook.createModalOpen}
                onClose={modalHook.closeCreateModal}
              >
                <DivisaForm
                  onSubmit={handleCreateDivisa}
                  onCancel={modalHook.closeCreateModal}
                  isEditForm={false}
                  divisa={null}
                />
              </Modal>
              <Modal
                isOpen={modalHook.editModalOpen}
                onClose={modalHook.closeEditModal}
              >
                <DivisaForm
                  onSubmit={handleUpdateDivisa}
                  onCancel={modalHook.closeEditModal}
                  isEditForm={true}
                  divisa={modalHook.selectedItem}
                />
              </Modal>
              <Modal
                isOpen={denominacionesModalOpen}
                onClose={closeDenominacionesModal}
              >
                <DenominacionesDivisa
                  divisa={selectedDivisa!}
                  onSubmit={handleCreateDenominacion}
                  onCancel={() => {}}
                />
              </Modal>
            </div>
          </>
        )}
        {selectedTab.key === "configs" && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Configuraciones</h2>
            <Can
              anyOf={[LIMITES_DIVISA_CONFIG.CHANGE, LIMITES_DIVISA_CONFIG.VIEW]}
            >
              <div>
                <LimiteConfigForm></LimiteConfigForm>
              </div>
            </Can>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisasPage;
