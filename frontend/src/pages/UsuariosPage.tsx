import { useEffect, useState } from "react";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../services/usuarioService";
import { type User } from "../types/User";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    is_staff: false,
    is_active: true,
  });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const res = await getUsuarios();
    setUsuarios(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateUsuario(editId, formData);
      setEditId(null);
    } else {
      await createUsuario(formData);
    }
    resetForm();
    fetchUsuarios();
  };

  const resetForm = () => {
    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      is_staff: false,
      is_active: true,
    });
  };

  const handleEdit = (User: User) => {
    setFormData(User);
    setEditId(User.id);
  };

  const handleDelete = async (id: string) => {
    await deleteUsuario(id);
    fetchUsuarios();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input
          type="text"
          placeholder="Username"
          value={formData.username || ""}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full rounded border p-2"
          required
        />
        <input
          type="text"
          placeholder="Nombre"
          value={formData.first_name || ""}
          onChange={(e) =>
            setFormData({ ...formData, first_name: e.target.value })
          }
          className="w-full rounded border p-2"
        />
        <input
          type="text"
          placeholder="Apellido"
          value={formData.last_name || ""}
          onChange={(e) =>
            setFormData({ ...formData, last_name: e.target.value })
          }
          className="w-full rounded border p-2"
        />
        <input
          type="email"
          placeholder="Correo"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded border p-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={formData.password || ""}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full rounded border p-2"
          required={!editId} // obligatorio solo al crear
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_staff || false}
            onChange={(e) =>
              setFormData({ ...formData, is_staff: e.target.checked })
            }
          />
          <span>Staff</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_active || false}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
          />
          <span>Activo</span>
        </label>

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
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Apellido</th>
            <th className="p-2 border">Correo</th>
            <th className="p-2 border">Staff</th>
            <th className="p-2 border">Activo</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.first_name}</td>
              <td className="p-2">{u.last_name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.is_staff ? "Sí" : "No"}</td>
              <td className="p-2">{u.is_active ? "Sí" : "No"}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleEdit(u)}
                  className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
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
