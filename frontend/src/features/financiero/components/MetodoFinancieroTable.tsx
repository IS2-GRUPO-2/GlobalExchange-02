import React from "react";
import { Edit, X, Check } from "lucide-react";
import { type MetodoFinanciero } from "../types/MetodoFinanciero";
import Can from "../../../components/Can";
import { METODOS_FINANCIEROS } from "../../../types/perms";

interface MetodoFinancieroTableProps {
  metodos: MetodoFinanciero[];
  loading: boolean;
  onEdit: (metodo: MetodoFinanciero) => void;
  onToggle: (metodo: MetodoFinanciero) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getDisplayName = (nombre: string): string => {
  switch (nombre) {
    case "BILLETERA_DIGITAL":
      return "Billetera Digital";
    case "TRANSFERENCIA_BANCARIA":
      return "Transferencia Bancaria";
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito";
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito";
    default:
      return nombre
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
};

export const MetodoFinancieroTable: React.FC<MetodoFinancieroTableProps> = ({
  metodos,
  loading,
  onEdit,
  onToggle,
  page,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Permite Cobro</th>
            <th>Permite Pago</th>
            <th>Comisión Cobro</th>
            <th>Comisión Pago</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {metodos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8">
                <p className="text-gray-600">No hay métodos financieros</p>
              </td>
            </tr>
          ) : (
            metodos.map((metodo) => (
              <tr key={metodo.id}>
                <td className="font-medium">{getDisplayName(metodo.nombre)}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      metodo.permite_cobro
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {metodo.permite_cobro ? "Sí" : "No"}
                  </span>
                </td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      metodo.permite_pago
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {metodo.permite_pago ? "Sí" : "No"}
                  </span>
                </td>
                <td>{metodo.comision_cobro_porcentaje}%</td>
                <td>{metodo.comision_pago_porcentaje}%</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      metodo.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {metodo.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Can anyOf={[METODOS_FINANCIEROS.CHANGE]}>
                      <button
                        onClick={() => onEdit(metodo)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    </Can>
                    <Can anyOf={metodo.is_active ? [METODOS_FINANCIEROS.DELETE] : [METODOS_FINANCIEROS.CHANGE]}>
                      <button
                        onClick={() => onToggle(metodo)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        title={metodo.is_active ? "Desactivar" : "Activar"}
                      >
                        {metodo.is_active ? <X size={16} /> : <Check size={16} />}
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {metodos.length > 0 && (
        <div className="flex justify-between items-center mt-4 pt-4">
          <div className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 btn-primary disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 btn-primary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
