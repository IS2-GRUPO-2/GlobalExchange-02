import { useEffect, useState } from "react";
import {
  getCategoriaClientes,
  createCategoriaCliente,
  updateCategoriaCliente,
} from "../services/categoriaClienteService";
import { type CategoriaCliente } from "../types/Cliente";
import { Edit, Search, Plus, Check, X, Eye } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import CategoriaClienteForm from "../components/CategoriaClientesForm";
import Can from "../components/Can";
import { CATEGORIAS_CLIENTE } from "../types/perms";

// Type for the form submission data
interface FormCategoriaCliente {
  idCategoria?: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  isActive?: boolean;
}

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  const [selectedCategoria, setSelectedCategoria] =
    useState<CategoriaCliente | null>(null);

  const fetchCategorias = async () => {
    try {
      const params = searchQuery.trim() ? { search: searchQuery.trim() } : {};
      const res = await getCategoriaClientes({ ...params, all: true });
      setCategorias(res.data);
    } catch {
      toast.error("Error al cargar categorías");
    }
  };

  useEffect(() => {
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openCreateModal = (): void => setCreateModalOpen(true);
  const closeCreateModal = (): void => setCreateModalOpen(false);

  const openEditModal = (cat: CategoriaCliente): void => {
    setSelectedCategoria(cat);
    setEditModalOpen(true);
  };
  const closeEditModal = (): void => {
    setEditModalOpen(false);
    setSelectedCategoria(null);
  };

  const openDetailsModal = (cat: CategoriaCliente): void => {
    setSelectedCategoria(cat);
    setDetailsModalOpen(true);
  };
  const closeDetailsModal = (): void => {
    setDetailsModalOpen(false);
    setSelectedCategoria(null);
  };

  const handleCreateCategoria = async (data: FormCategoriaCliente) => {
    try {
      await createCategoriaCliente({
        nombre: data.nombre,
        descripcion: data.descripcion,
        descuento: data.descuento,
        isActive: true,
      });
      toast.success("Categoría creada con éxito!");
      fetchCategorias();
    } catch {
      toast.error("Ha ocurrido un error al crear la categoría.");
    } finally {
      closeCreateModal();
    }
  };

  const handleEditCategoria = async (data: FormCategoriaCliente) => {
    try {
      if (!data.idCategoria) {
        toast.error("ID de categoría no válido");
        return;
      }
      
      await updateCategoriaCliente(data.idCategoria, {
        descripcion: data.descripcion,
        descuento: data.descuento,
        isActive: data.isActive,
      });
      toast.success("Categoría actualizada con éxito!");
      fetchCategorias();
    } catch {
      toast.error("Ha ocurrido un error al actualizar la categoría.");
    } finally {
      closeEditModal();
    }
  };

  const handleToggleActive = async (cat: CategoriaCliente) => {
    try {
      await updateCategoriaCliente(cat.idCategoria, {
        isActive: !cat.isActive,
      });
      toast.success(
        `Categoría ${cat.isActive ? "inactivada" : "activada"} con éxito`
      );
      fetchCategorias();
    } catch {
      toast.error("Ha ocurrido un error al cambiar estado de la categoría.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96 pl-4">
          <div className="absolute inset-y-0 left-0 p-8 pt-5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        <Can anyOf={[CATEGORIAS_CLIENTE.ADD]}>
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            Crear Categoría
          </button>
        </Can>
      </div>


      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Descuento (%)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categorias.map((cat) => (
                <tr key={cat.idCategoria}>
                  <td className="font-medium">{cat.nombre}</td>
                  <td>{cat.descripcion || "-"}</td>
                  <td>{cat.descuento}%</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {cat.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDetailsModal(cat)}
                        className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <Can anyOf={[CATEGORIAS_CLIENTE.CHANGE]}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </Can>
                      <Can anyOf={[CATEGORIAS_CLIENTE.CHANGE]}>
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title={cat.isActive ? "Desactivar" : "Activar"}
                        >
                          {cat.isActive ? (
                            <X size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <CategoriaClienteForm
            onSubmit={handleCreateCategoria}
            onCancel={closeCreateModal}
            isEditForm={false}
            categoria={null}
          />
        </Modal>


        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          {selectedCategoria && (
            <CategoriaClienteForm
              onSubmit={handleEditCategoria}
              onCancel={closeEditModal}
              isEditForm={true}
              categoria={selectedCategoria}
            />
          )}
        </Modal>

        <Modal isOpen={detailsModalOpen} onClose={closeDetailsModal}>
          {selectedCategoria && (
            <div className="p-2">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Detalles de Categoría</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                    <p className="mt-1 text-lg font-semibold">{selectedCategoria.nombre}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Descuento</h3>
                    <p className="mt-1 text-lg font-semibold">{selectedCategoria.descuento}%</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                    <p className="mt-1">{selectedCategoria.descripcion || "-"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                    <span
                      className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedCategoria.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {selectedCategoria.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID</h3>
                    <p className="mt-1 text-sm text-gray-500">{selectedCategoria.idCategoria}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CategoriasPage;
