import { Check, Coins, Edit, Plus, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { type Divisa } from "../types/Divisa";
import {
  createDenominacion,
  createDivisa,
  deactivateDivisa,
  getDivisas,
  updateDivisa,
} from "../services/divisaService";
import Modal from "../components/Modal";
import DivisaForm, { type DivisaFormData } from "../components/DivisaForm";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import DenominacionesDivisa, {
  type DenominacionFormData,
} from "../components/DenominacionesDivisa";

const DivisasPage = () => {
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDivisa, setSelectedDivisa] = useState<Divisa | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [denominacionesModalOpen, setDenominacionesModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const openCreateModal = () => {
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  const openEditModal = (divisa: Divisa) => {
    setSelectedDivisa(divisa);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedDivisa(null);
    setEditModalOpen(false);
  };

  const openDenominacionesModal = (divisa: Divisa) => {
    setSelectedDivisa(divisa);
    setDenominacionesModalOpen(true);
  };

  const closeDenominacionesModal = () => {
    setSelectedDivisa(null);
    setDenominacionesModalOpen(false);
  };

  const fetchDivisas = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getDivisas({ page, search });
      setDivisas(res.results);
      let currentPageSize = pageSize;
      if (!pageSize && res.results.length > 0) {
        currentPageSize = res.results.length;
        setPageSize(currentPageSize);
      }

      if (res.count && currentPageSize) {
        setTotalPages(Math.ceil(res.count / currentPageSize));
        console.log(totalPages);
      }
    } catch (err) {
      setErr("Error al cargar divisas");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDivisa = async (divisaData: DivisaFormData) => {
    let divisa: Divisa = {
      nombre: divisaData.nombre,
      codigo: divisaData.codigo,
      simbolo: divisaData.simbolo,
      max_digitos: divisaData.max_digitos,
      precision: divisaData.precision,
      is_active: true,
      es_base: divisaData.es_base ?? false,
    };

    try {
      const res = await createDivisa(divisa);
      if (res.status === 201) {
        toast.success("Divisa creada con éxito!");
        fetchDivisas();
      }
    } catch (err) {
      toast.error("Ha ocurrido un error al crear la divisa.");
    } finally {
      closeCreateModal();
    }
  };

  const handleUpdateDivisa = async (divisaData: DivisaFormData) => {
    let divisa: Divisa = {
      nombre: divisaData.nombre,
      codigo: divisaData.codigo,
      simbolo: divisaData.simbolo,
      max_digitos: divisaData.max_digitos,
      precision: divisaData.precision,
      is_active: true,
    };

    try {
      const res = await updateDivisa(divisa, selectedDivisa?.id!);
      if (res.status === 200) {
        toast.success("Divisa actualizada con éxito!");
        fetchDivisas();
      }
    } catch (err) {
      toast.error("Ha ocurrido un error al actualizar la divisa.");
    } finally {
      closeCreateModal();
    }
  };

  const handleDeactivateDivisa = async (id: number) => {
    try {
      const res = await deactivateDivisa(id);
      if (res.status === 200) toast.success("Divisa desactivada con éxito");
      fetchDivisas();
    } catch (e) {
      toast.error("Ha ocurrido un error");
    }
  };

  const handleActivateDivisa = async (divisa: Divisa) => {
    divisa.is_active = true;
    try {
      const res = await updateDivisa(divisa, divisa.id!);
      if (res.status === 200) {
        toast.success("Divisa activada con éxito!");
        fetchDivisas();
      }
    } catch (e) {
      toast.error("Ha ocurrido un error");
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

  useEffect(() => {
    fetchDivisas();
  }, [page, isLoggedIn]);

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96 pl-4">
          <div className="flex w-full sm:w-64 md:w-96 gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar divisa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    fetchDivisas();
                  }
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => {
                setPage(1);
                fetchDivisas();
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
          Agregar Divisa
        </button>
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
              {loading ? (
                <tr>
                  <td>
                    <div>Cargando</div>
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td>
                    <div>Ha ocurrido un error</div>
                  </td>
                </tr>
              ) : divisas === undefined ? (
                <tr>
                  <td>
                    <div>No hay datos</div>
                  </td>
                </tr>
              ) : (
                divisas.map((divisa: Divisa) => (
                  <tr key={divisa.id}>
                    <td className="font-medium">{divisa.nombre}</td>
                    <td>{divisa.codigo}</td>
                    <td>{divisa.simbolo}</td>
                    <td>{divisa.max_digitos}</td>
                    <td>{divisa.precision}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          divisa.es_base ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
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
                        <button
                          onClick={() => openEditModal(divisa)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={
                            divisa.is_active
                              ? () => handleDeactivateDivisa(divisa.id!)
                              : () => handleActivateDivisa(divisa)
                          }
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title={divisa.is_active ? "Desactivar" : "Activar"}
                        >
                          {divisa.is_active ? (
                            <X size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => openDenominacionesModal(divisa)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Gestionar denominaciones"
                        >
                          <Coins size={16} />
                        </button>
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
                        onClick={() =>
                          setPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={page === totalPages}
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

        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <DivisaForm
            onSubmit={handleCreateDivisa}
            onCancel={closeCreateModal}
            isEditForm={false}
            divisa={null}
          />
        </Modal>
        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          <DivisaForm
            onSubmit={handleUpdateDivisa}
            onCancel={closeEditModal}
            isEditForm={true}
            divisa={selectedDivisa!}
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
    </div>
  );
};

export default DivisasPage;
