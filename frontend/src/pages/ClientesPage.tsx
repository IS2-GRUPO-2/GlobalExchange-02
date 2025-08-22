import { useEffect, useState } from "react";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../services/clienteService";
import { type Cliente } from "../types/Cliente";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: "",
    correo: "",
    telefono: "",
    categoria: "MINORISTA",
    direccion: "",
    isPersonaFisica: true,
    isActive: true,
  });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const res = await getClientes();
    setClientes(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateCliente(editId, formData);
      setEditId(null);
    } else {
      await createCliente(formData);
    }
    resetForm();
    fetchClientes();
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      correo: "",
      telefono: "",
      categoria: "MINORISTA",
      direccion: "",
      isPersonaFisica: true,
      isActive: true,
    });
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData(cliente);
    setEditId(cliente.idCliente);
  };

  const handleDelete = async (id: string) => {
    await deleteCliente(id);
    fetchClientes();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Gestión de Clientes</h2>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input
          type="text"
          placeholder="Nombre"
          value={formData.nombre || ""}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={formData.correo || ""}
          onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={formData.telefono || ""}
          onChange={(e) =>
            setFormData({ ...formData, telefono: e.target.value })
          }
          className="w-full rounded border p-2"
        />
        <select
          value={formData.categoria || "MINORISTA"}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          className="w-full rounded border p-2"
        >
          <option value="VIP">VIP</option>
          <option value="CORPORATIVO">Corporativo</option>
          <option value="MINORISTA">Minorista</option>
        </select>

        <textarea
          placeholder="Dirección"
          value={formData.direccion || ""}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          className="w-full rounded border p-2"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {editId ? "Actualizar" : "Crear"}
        </button>
      </form>

      {/* Tabla */}
      <table className="w-full border border-gray-300 text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Correo</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Categoría</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.idCliente} className="border-t">
              <td className="p-2">{c.nombre}</td>
              <td className="p-2">{c.correo}</td>
              <td className="p-2">{c.telefono}</td>
              <td className="p-2">{c.categoria}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.idCliente)}
                  className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
