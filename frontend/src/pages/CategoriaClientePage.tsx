import { useEffect, useState } from "react";
import { Edit, Search } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import { getCategoriaClientes, updateCategoriaCliente } from "../services/categoriaClienteService";
import EditCategoriaForm from "../components/EditCategoriaClientesForm"; 
interface CategoriaCliente {
  idCategoria: string;
  nombre: string;
  descripcion: string;
  descuento: number;
}

interface EditCategoriaFormData {
  idCategoria: string;
  descripcion: string;
  descuento: number;
}

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaCliente | null>(null);

  const fetchCategorias = async () => {
    try {
      const res = await getCategoriaClientes(searchQuery); 
      setCategorias(res.data);
    } catch (err) {
      toast.error("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [searchQuery]);

  const openEditModal = (categoria: CategoriaCliente) => {
    setSelectedCategoria(categoria);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedCategoria(null);
  };

  const handleEditCategoria = async (data: EditCategoriaFormData) => {
    try {
      const res = await updateCategoriaCliente(data.idCategoria, {
        descripcion: data.descripcion,
        descuento: data.descuento,
      }); // ✅ nombre correcto
      if (res.status === 200) {
        toast.success("Categoría actualizada con éxito");
        fetchCategorias();
      }
    } catch (err) {
      toast.error("Error al actualizar la categoría");
    } finally {
      closeEditModal();
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
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Descuento (%)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categorias.map((cat) => (
                <tr key={cat.idCategoria}>
                  <td className="font-medium">{cat.nombre}</td>
                  <td>{cat.descripcion || "-"}</td>
                  <td>{cat.descuento}</td>
                  <td>
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          {selectedCategoria && (
            <EditCategoriaForm
              categoria={selectedCategoria}
              onSubmit={handleEditCategoria}
              onCancel={closeEditModal}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CategoriasPage;
