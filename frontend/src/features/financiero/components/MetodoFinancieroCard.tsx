import React from "react";
import {
  CreditCard,
  Building2,
  Smartphone,
  Edit,
  X,
  Check,
  Eye,
} from "lucide-react";
import type {
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
} from "../types/MetodoFinanciero";
import { BILLETERAS_DIGITALES, CUENTAS_BANCARIAS, TARJETAS} from "../../../types/perms";
import Can from "../../../components/Can";

type MetodoFinancieroItem = CuentaBancaria | BilleteraDigital | Tarjeta;

interface MetodoFinancieroCardProps {
  item: MetodoFinancieroItem & {
    tipo: "cuentas" | "billeteras digitales" | "tarjetas";
    is_active: boolean;
    desactivado_por_catalogo?: boolean;
  };
  onView: (item: MetodoFinancieroItem) => void;
  onEdit: (item: MetodoFinancieroItem) => void;
  onToggleActive: (item: MetodoFinancieroItem) => void;
}

const MetodoFinancieroCard: React.FC<MetodoFinancieroCardProps> = ({
  item,
  onView,
  onEdit,
  onToggleActive,
}) => {
  const getIcon = () => {
    switch (item.tipo) {
      case "cuentas":
        return <Building2 className="w-6 h-6 text-blue-600" />;
      case "billeteras digitales":
        return <Smartphone className="w-6 h-6 text-blue-600" />;
      case "tarjetas":
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-blue-600" />;
    }
  };

  const getTitle = () => {
    switch (item.tipo) {
      case "cuentas":
        const cuenta = item as CuentaBancaria;
        return cuenta.banco_nombre || `Banco ID: ${cuenta.banco}`;
      case "billeteras digitales":
        const billetera = item as BilleteraDigital;
        return billetera.plataforma_nombre || `Plataforma ID: ${billetera.plataforma}`;
      case "tarjetas":
        const tarjeta = item as any;
        return `**** ${tarjeta.last4}`;
      default:
        return "Método Financiero";
    }
  };

  const getBodyInfo = () => {
    switch (item.tipo) {
      case "cuentas":
        const cuenta = item as CuentaBancaria;
        return (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Titular: </span>
              <span className="text-sm text-gray-900">{cuenta.titular}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">CBU/CVU: </span>
              <span className="text-sm text-gray-900">***{cuenta.cbu_cvu.slice(-4)}</span>
            </div>
          </div>
        );
      case "billeteras digitales":
        const billetera = item as BilleteraDigital;
        return (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Usuario: </span>
              <span className="text-sm text-gray-900">{billetera.usuario_id || billetera.email}</span>
            </div>
            {billetera.telefono && (
              <div>
                <span className="text-sm font-medium text-gray-700">Teléfono: </span>
                <span className="text-sm text-gray-900">{billetera.telefono}</span>
              </div>
            )}
          </div>
        );
      case "tarjetas":
        const tarjeta = item as Tarjeta;
        return (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Titular: </span>
              <span className="text-sm text-gray-900">{tarjeta.titular}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Vencimiento: </span>
              <span className="text-sm text-gray-900">
                {tarjeta.exp_month.toString().padStart(2, '0')}/{tarjeta.exp_year}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getChangePerm = () => {
    switch (item.tipo) {
      case "cuentas":
        return [CUENTAS_BANCARIAS.CHANGE];
      case "billeteras digitales":
        return [BILLETERAS_DIGITALES.CHANGE];
      case "tarjetas":
        return [TARJETAS.CHANGE];
      default:
        return [];
    }
  };

  const getDeletePerm = () => {
    switch (item.tipo) {
      case "cuentas":
        return [CUENTAS_BANCARIAS.DELETE];
      case "billeteras digitales":
        return [BILLETERAS_DIGITALES.DELETE];
      case "tarjetas":
        return [TARJETAS.DELETE];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
      <div className="p-4">
        {/* Header: Status + Icon + Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
            </div>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                item.is_active
                  ? "bg-green-100 text-green-800"
                  : item.desactivado_por_catalogo
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {item.is_active
                ? "Activo"
                : item.desactivado_por_catalogo
                ? "Desactivado por catálogo"
                : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Cuerpo: Información secundaria relevante */}
        <div className="mb-4">
          {getBodyInfo()}
        </div>

        {/* Footer: Acciones */}
        <div className="flex items-center justify-start space-x-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(item)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ver detalles"
          >
            <Eye size={14} />
            <span>Ver</span>
          </button>

          <Can anyOf={getChangePerm()}>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar"
            >
              <Edit size={14} />
              <span>Editar</span>
            </button>
          </Can>

          <Can anyOf={item.is_active ? getDeletePerm() : getChangePerm()}>
            <button
              onClick={() => onToggleActive(item)}
              disabled={!item.is_active && item.desactivado_por_catalogo}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                !item.is_active && item.desactivado_por_catalogo
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : item.is_active
                  ? "text-red-600 hover:bg-red-50"
                  : "text-green-600 hover:bg-green-50"
              }`}
              title={
                !item.is_active && item.desactivado_por_catalogo
                  ? "No se puede reactivar - Desactivado por administrador (catálogo)"
                  : item.is_active
                  ? "Desactivar"
                  : "Activar"
              }
            >
              {item.is_active ? <X size={14} /> : <Check size={14} />}
              <span>
                {!item.is_active && item.desactivado_por_catalogo
                  ? "Desactivado por catálogo"
                  : item.is_active
                  ? "Desactivar"
                  : "Activar"}
              </span>
            </button>
          </Can>
        </div>
      </div>
    </div>
  );
};

export default MetodoFinancieroCard;
