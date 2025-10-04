import { useEffect, useState } from "react";
import {
  getTausers,
  createTauser,
  updateTauser,
} from "../services/tauserService";
import type { Tauser } from "../types/Tauser";
import { Edit, Search, Plus, Check, X, Eye } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import TauserForm from "../components/TauserForm";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Can from "../../../components/Can";
import { TAUSER } from "../../../types/perms";

const ConfiguracionTauserPage = () => {
  const [tausers, setTausers] = useState<Tauser[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedTauser, setSelectedTauser] = useState<Tauser | null>(null);

  const fetchTausers = async () => {
    try {
      const params = searchQuery.trim() ? { search: searchQuery.trim() } : {};
      const res = await getTausers({ ...params, all: true });
      // res ya es el array directo, no un objeto con propiedad data
      setTausers(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Error al cargar Tausers");
      setTausers([]);
    }
  };

  useEffect(() => {
    fetchTausers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const openEditModal = (tauser: Tauser) => {
    setSelectedTauser(tauser);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedTauser(null);
  };

  const openDetailsModal = (tauser: Tauser) => {
    setSelectedTauser(tauser);
    setDetailsModalOpen(true);
  };
  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedTauser(null);
  };

  const handleCreateTauser = async (data: Partial<Tauser>) => {
    try {
      await createTauser({ ...data, is_active: true });
      toast.success("Tauser creado con éxito!");
      fetchTausers();
    } catch {
      toast.error("Ha ocurrido un error al crear el Tauser.");
    } finally {
      closeCreateModal();
    }
  };

  const handleEditTauser = async (data: Partial<Tauser>) => {
    try {
      if (!data.id) {
        toast.error("ID de Tauser no válido");
        return;
      }
      await updateTauser(data.id, data);
      toast.success("Tauser actualizado con éxito!");
      fetchTausers();
    } catch {
      toast.error("Ha ocurrido un error al actualizar el Tauser.");
    } finally {
      closeEditModal();
    }
  };

  const handleToggleActiveTauser = async (tauser: Tauser) => {
    try {
      await updateTauser(tauser.id, { is_active: !tauser.is_active });
      toast.success(
        `Tauser ${tauser.is_active ? "inactivado" : "activado"} con éxito`
      );
      fetchTausers();
    } catch {
      toast.error("Ha ocurrido un error al cambiar estado del Tauser.");
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
            placeholder="Buscar Tausers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>
        <Can anyOf={[TAUSER.ADD]}>
          <button onClick={openCreateModal} className="btn-primary flex items-center justify-center">
            <Plus size={18} className="mr-2" />
            Crear Tauser
          </button>
        </Can>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>Departamento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tausers.map((tauser) => (
                <tr key={tauser.id}>
                  <td className="font-medium">{tauser.codigo}</td>
                  <td>{tauser.nombre}</td>
                  <td>{tauser.direccion}</td>
                  <td>{tauser.ciudad}</td>
                  <td>{tauser.departamento}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tauser.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-900"}`}>
                      {tauser.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openDetailsModal(tauser)} className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      <Can anyOf={[TAUSER.CHANGE]}>
                        <button onClick={() => openEditModal(tauser)} className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" title="Editar">
                          <Edit size={16} />
                        </button>
                      </Can>
                      <Can anyOf={[TAUSER.DELETE]}>
                        <button
                          onClick={() => handleToggleActiveTauser(tauser)}
                          className={`p-1 text-gray-500 rounded-full hover:bg-gray-100 ${tauser.is_active ? "hover:text-red-600" : "hover:text-green-600"}`}
                          title={tauser.is_active ? "Inactivar" : "Activar"}
                        >
                          {tauser.is_active ? <X size={16} /> : <Check size={16} />}
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
          <TauserForm onSubmit={handleCreateTauser} onCancel={closeCreateModal} isEditForm={false} tauser={null} />
        </Modal>

        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          {selectedTauser && (
            <TauserForm onSubmit={handleEditTauser} onCancel={closeEditModal} isEditForm={true} tauser={selectedTauser} />
          )}
        </Modal>

        <Modal isOpen={detailsModalOpen} onClose={closeDetailsModal}>
          {selectedTauser && (
            <div className="max-h-[90vh] overflow-y-auto p-2">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Detalles de Tauser</h2>
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Código</h3>
                    <p className="mt-1 text-lg font-semibold">{selectedTauser.codigo}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                    <p className="mt-1 text-lg font-semibold">{selectedTauser.nombre}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Dirección</h3>
                    <p className="mt-1">{selectedTauser.direccion}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ciudad</h3>
                    <p className="mt-1">{selectedTauser.ciudad}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departamento</h3>
                    <p className="mt-1">{selectedTauser.departamento}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Latitud</h3>
                    <p className="mt-1">{selectedTauser.latitud}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Longitud</h3>
                    <p className="mt-1">{selectedTauser.longitud}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                    <span className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTauser.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-900"}`}>
                      {selectedTauser.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID</h3>
                    <p className="mt-1 text-sm text-gray-500">{selectedTauser.id}</p>
                  </div>
                </div>
                {/* Ubicación en el mapa (desplegable) */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-gray-700 font-semibold">Ver ubicación en el mapa</summary>
                  <div className="h-64 w-full mt-4">
                    <MapContainer
                      center={[
                        selectedTauser.latitud || -25.263739,
                        selectedTauser.longitud || -57.575926,
                      ] as [number, number]}
                      zoom={13}
                      className="h-full w-full rounded-md border"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[selectedTauser.latitud, selectedTauser.longitud] as [number, number]}
                        icon={new L.Icon({
                          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                        }) as any}
                      />
                    </MapContainer>
                  </div>
                </details>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={closeDetailsModal} className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
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

export default ConfiguracionTauserPage;