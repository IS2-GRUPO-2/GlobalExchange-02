import { useState, useEffect } from "react";
import { type User } from "../../../types/User";
import { toast } from "react-toastify";
import { getUsuariosAsignados } from "../../../services/clienteService";
import { type Cliente } from "../../../types/Cliente";

type Props = {
  cliente: Cliente;
};

const AssignedUsers = ({ cliente }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<boolean>(true);

  const fetchUsers = async () => {
    try {
      const res = await getUsuariosAsignados(cliente.idCliente);
      setUsers(res.data);
      setPending(false);
    } catch (err) {
      toast.error("Ha ocurrido un error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Usuarios asignados
      </h2>
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre de usuario</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Correo</th>
                <th>Estado</th>
              </tr>
            </thead>
            {pending ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <div>Buscando usuarios...</div>
                  </td>
                </tr>
              </tbody>
            ) : users.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <div>No hay usuarios asignados</div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 min-h-md">
                {users.map((usuario: User) => (
                  <tr key={usuario.id}>
                    <td className="font-medium">{usuario.username}</td>
                    <td>{usuario.first_name}</td>
                    <td>{usuario.last_name}</td>
                    <td>{usuario.email}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usuario.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {usuario.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignedUsers;
