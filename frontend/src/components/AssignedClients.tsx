import { type User } from "../types/User";

type Props = {
  user: User;
};

const AssignedClients = ({ user }: Props) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Clientes asignados a {user.username}
      </h2>
      
      {user.clientes && user.clientes.length > 0 ? (
        <div className="space-y-3">
          {user.clientes.map((cliente) => (
            <div
              key={cliente.idCliente}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
                  <p className="text-sm text-gray-600">
                    Categoría: <span className="font-medium">{cliente.categoria}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tipo: <span className="font-medium">
                      {cliente.isPersonaFisica ? "Persona física" : "Persona jurídica"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Documento: <span className="font-medium">
                      {cliente.isPersonaFisica ? cliente.cedula : cliente.ruc}
                    </span>
                  </p>
                  {cliente.correo && (
                    <p className="text-sm text-gray-600">
                      Email: <span className="font-medium">{cliente.correo}</span>
                    </p>
                  )}
                  {cliente.telefono && (
                    <p className="text-sm text-gray-600">
                      Teléfono: <span className="font-medium">{cliente.telefono}</span>
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cliente.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-900"
                  }`}
                >
                  {cliente.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Este usuario no tiene clientes asignados.</p>
        </div>
      )}
    </div>
  );
};

export default AssignedClients;
