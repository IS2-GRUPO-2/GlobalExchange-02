import React from 'react';
import { CreditCard, Building2, Smartphone, Edit, X, Check, Eye } from 'lucide-react';
import type { CuentaBancaria, BilleteraDigital, Tarjeta } from '../types/MetodoFinanciero';

type MetodoFinancieroItem = CuentaBancaria | BilleteraDigital | Tarjeta;

interface MetodoFinancieroCardProps {
  item: MetodoFinancieroItem & { 
    tipo: 'cuentas' | 'billeteras digitales' | 'tarjetas'; 
    is_active: boolean; 
    desactivado_por_catalogo?: boolean;
  };
  onView: (item: MetodoFinancieroItem) => void;
  onEdit: (item: MetodoFinancieroItem) => void;
  onToggleActive: (item: MetodoFinancieroItem) => void;
  isAdminView?: boolean;
}

const MetodoFinancieroCard: React.FC<MetodoFinancieroCardProps> = ({
  item,
  onView,
  onEdit,
  onToggleActive,
  isAdminView = false
}) => {
  const getIcon = () => {
    switch (item.tipo) {
      case 'cuentas':
        return <Building2 className="w-6 h-6 text-blue-600" />;
      case 'billeteras digitales':
        return <Smartphone className="w-6 h-6 text-blue-600" />;
      case 'tarjetas':
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-blue-600" />;
    }
  };

  const getTitle = () => {
    switch (item.tipo) {
      case 'cuentas':
        const cuenta = item as CuentaBancaria;
        return cuenta.banco_nombre || `Banco ID: ${cuenta.banco}`;
      case 'billeteras digitales':
        const billetera = item as BilleteraDigital;
        return billetera.plataforma_nombre || `Plataforma ID: ${billetera.plataforma}`;
      case 'tarjetas':
        return `**** ${(item as Tarjeta).last4}`;
      default:
        return 'Método Financiero';
    }
  };

  const getBodyInfo = () => {
    switch (item.tipo) {
      case 'cuentas':
        const cuenta = item as CuentaBancaria;
        return (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Titular: </span>
              <span className="text-sm text-gray-900">{cuenta.titular}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">CBU/CVU: </span>
              <span className="text-sm text-gray-900">{cuenta.cbu_cvu.slice(-4)}</span>
            </div>
          </div>
        );
      case 'billeteras digitales':
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
      case 'tarjetas':
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

  return (
    <div className={`bg-white rounded-lg shadow-md border transition-all hover:shadow-lg ${
      !item.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'
    }`}>
      <div className="p-4">
        {/* Header: Ícono + Nombre principal + Badge de estado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {getTitle()}
              </h3>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {item.is_active ? 'Activo' : 'Inactivo'}
          </span>
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
          
          <button
            onClick={() => onEdit(item)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Editar"
          >
            <Edit size={14} />
            <span>Editar</span>
          </button>

          <button
            onClick={() => onToggleActive(item)}
            disabled={!item.is_active && item.desactivado_por_catalogo}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              !item.is_active && item.desactivado_por_catalogo
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : item.is_active
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={
              !item.is_active && item.desactivado_por_catalogo
                ? 'No se puede reactivar - Desactivado por administrador (catálogo)'
                : item.is_active ? 'Desactivar' : 'Activar'
            }
          >
            {item.is_active ? <X size={14} /> : <Check size={14} />}
            <span>
              {!item.is_active && item.desactivado_por_catalogo
                ? 'Desactivado por catálogo'
                : item.is_active ? 'Desactivar' : 'Activar'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetodoFinancieroCard;
