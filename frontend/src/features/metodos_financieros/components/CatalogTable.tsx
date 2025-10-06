import React from "react";
import { Edit, X, Check } from "lucide-react";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  TarjetaCatalogo,
  CatalogTabType,
} from "../types/MetodoFinanciero";
import Can from "../../../components/Can";
import { BANCOS, BILLETERAS_DIGITALES_CATALOGO, TARJETAS_CATALOGO } from "../../../types/perms";

interface CatalogTableProps {
  bancos: Banco[];
  billeterasCatalogo: BilleteraDigitalCatalogo[];
  tarjetasCatalogo: TarjetaCatalogo[];
  catalogTab: CatalogTabType;
  loading: boolean;
  onEdit: (item: any) => void;
  onToggle: (item: any, tipo: CatalogTabType) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const CatalogTable: React.FC<CatalogTableProps> = ({
  bancos,
  billeterasCatalogo,
  tarjetasCatalogo,
  catalogTab,
  loading,
  onEdit,
  onToggle,
  page = 1,
  totalPages = 1,
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

  const items = catalogTab === "bancos" ? bancos : 
                catalogTab === "billeteras" ? billeterasCatalogo :
                catalogTab === "tarjetas" ? tarjetasCatalogo : [];

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>{catalogTab === "bancos" ? "Nombre" : catalogTab === "billeteras" ? "Nombre" : catalogTab === "tarjetas" ? "Marca" : ""}</th>
            <th>Comisión Compra</th>
            <th>Comisión Venta</th>
            <th>Personalizada Compra</th>
            <th>Personalizada Venta</th>
            <th>Estado</th>
            <Can anyOf={
              catalogTab === "bancos" ? [BANCOS.CHANGE, BANCOS.DELETE] : 
              catalogTab === "billeteras" ? [BILLETERAS_DIGITALES_CATALOGO.CHANGE, BILLETERAS_DIGITALES_CATALOGO.DELETE] :
              catalogTab === "tarjetas" ? [TARJETAS_CATALOGO.CHANGE, TARJETAS_CATALOGO.DELETE] : []
            }>
              <th>Acciones</th>
            </Can>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8">
                <p className="text-gray-600">
                  No hay{" "}
                  {catalogTab === "bancos" ? "bancos" : 
                   catalogTab === "billeteras" ? "billeteras digitales" :
                   catalogTab === "tarjetas" ? "marcas de tarjetas" : ""}{" "}
                  registrados
                </p>
              </td>
            </tr>
          ) : (
            items.map((item: any) => (
              <tr key={item.id}>
                <td className="font-medium">
                  {catalogTab === "tarjetas" ? item.marca : item.nombre}
                </td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.comision_personalizada_compra
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.comision_personalizada_compra ? "Sí" : "No"}
                  </span>
                </td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.comision_personalizada_venta
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.comision_personalizada_venta ? "Sí" : "No"}
                  </span>
                </td>
                 <td className="text-sm text-gray-900">
                  {item.comision_compra}%
                </td>
                <td className="text-sm text-gray-900">
                  {item.comision_venta}%
                </td>
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
                  <div className="flex items-center space-x-2">
                    <Can anyOf={
                      catalogTab === "bancos" ? [BANCOS.CHANGE] : 
                      catalogTab === "billeteras" ? [BILLETERAS_DIGITALES_CATALOGO.CHANGE] :
                      catalogTab === "tarjetas" ? [TARJETAS_CATALOGO.CHANGE] : []
                    }>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    </Can>
                    <Can anyOf={
                      catalogTab === "bancos" ? (item.is_active ? [BANCOS.DELETE] : [BANCOS.CHANGE]) : 
                      catalogTab === "billeteras" ? (item.is_active ? [BILLETERAS_DIGITALES_CATALOGO.DELETE] : [BILLETERAS_DIGITALES_CATALOGO.CHANGE]) :
                      (item.is_active ? [TARJETAS_CATALOGO.DELETE] : [TARJETAS_CATALOGO.CHANGE])
                    }>
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

      {/* Pagination */}
      {onPageChange && (
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

export { CatalogTable };
