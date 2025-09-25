import React from "react";
import { Edit, X, Check } from "lucide-react";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  CatalogTabType,
} from "../types/MetodoFinanciero";
import Can from "../../../components/Can";
import { BANCOS, BILLETERAS_DIGITALES_CATALOGO } from "../../../types/perms";

interface CatalogTableProps {
  bancos: Banco[];
  billeterasCatalogo: BilleteraDigitalCatalogo[];
  catalogTab: CatalogTabType;
  loading: boolean;
  onEdit: (item: any) => void;
  onToggle: (item: any, tipo: CatalogTabType) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  bancos,
  billeterasCatalogo,
  catalogTab,
  loading,
  onEdit,
  onToggle,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    );
  }

  const items = catalogTab === "bancos" ? bancos : billeterasCatalogo;

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Fecha Creación</th>
            <Can anyOf={catalogTab === "bancos" ? [BANCOS.CHANGE, BANCOS.DELETE] : [BILLETERAS_DIGITALES_CATALOGO.CHANGE, BILLETERAS_DIGITALES_CATALOGO.DELETE]}>
              <th>Acciones</th>
            </Can>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8">
                <p className="text-gray-600">
                  No hay{" "}
                  {catalogTab === "bancos" ? "bancos" : "billeteras digitales"}{" "}
                  registrados
                </p>
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.nombre}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  {item.fecha_creacion
                    ? new Date(item.fecha_creacion).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Can anyOf={catalogTab === "bancos" ? [BANCOS.CHANGE] : [BILLETERAS_DIGITALES_CATALOGO.CHANGE]}>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    </Can>
                    <Can anyOf={catalogTab === "bancos" ? (item.is_active? [BANCOS.DELETE] : [BANCOS.CHANGE]) : (item.is_active? [BILLETERAS_DIGITALES_CATALOGO.DELETE] : [BILLETERAS_DIGITALES_CATALOGO.CHANGE])}>
                      <button
                        onClick={() => onToggle(item, catalogTab)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        title={item.is_active ? "Desactivar" : "Activar"}
                      >
                        {item.is_active ? <X size={16} /> : <Check size={16} />}
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
