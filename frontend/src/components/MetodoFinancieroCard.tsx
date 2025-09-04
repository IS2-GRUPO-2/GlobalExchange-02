import React from 'react';
import { CreditCard, Building2, Smartphone, Edit, X, Check, Eye } from 'lucide-react';
import type { CuentaBancaria, BilleteraDigital, Tarjeta } from '../types/MetodoFinanciero';

type MetodoFinancieroItem = CuentaBancaria | BilleteraDigital | Tarjeta;

interface MetodoFinancieroCardProps {
  item: MetodoFinancieroItem & { tipo: 'cuentas' | 'billeteras' | 'tarjetas'; is_active: boolean };
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
      case 'billeteras':
        return <Smartphone className="w-6 h-6 text-green-600" />;
      case 'tarjetas':
        return <CreditCard className="w-6 h-6 text-purple-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTitle = () => {
    switch (item.tipo) {
      case 'cuentas':
        return (item as CuentaBancaria).banco;
      case 'billeteras':
        return (item as BilleteraDigital).plataforma;
      case 'tarjetas':
        return `**** ${(item as Tarjeta).last4}`;
      default:
        return 'Método Financiero';
    }
  };

  const getSubtitle = () => {
    switch (item.tipo) {
      case 'cuentas':
        const cuenta = item as CuentaBancaria;
        return `${cuenta.titular} - ${cuenta.numero_cuenta}`;
      case 'billeteras':
        const billetera = item as BilleteraDigital;
        return `${billetera.usuario_id} - ${billetera.email}`;
      case 'tarjetas':
        const tarjeta = item as Tarjeta;
        return `${tarjeta.titular} - ${tarjeta.brand}`;
      default:
        return '';
    }
  };

  const getDetails = () => {
    switch (item.tipo) {
      case 'cuentas':
        const cuenta = item as CuentaBancaria;
        return `CBU/CVU: ${cuenta.cbu_cvu}`;
      case 'billeteras':
        const billetera = item as BilleteraDigital;
        return billetera.telefono ? `Tel: ${billetera.telefono}` : '';
      case 'tarjetas':
        const tarjeta = item as Tarjeta;
        return `Exp: ${tarjeta.exp_month.toString().padStart(2, '0')}/${tarjeta.exp_year}`;
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border transition-all hover:shadow-lg ${
      !item.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'
    }`}>
      <div className="p-4">
        {/* Header con icono y estado */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {getSubtitle()}
              </p>
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

        {/* Detalles */}
        {getDetails() && (
          <div className="mb-3">
            <p className="text-sm text-gray-500">
              {getDetails()}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
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
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              item.is_active
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={item.is_active ? 'Desactivar' : 'Activar'}
          >
            {item.is_active ? <X size={14} /> : <Check size={14} />}
            <span>{item.is_active ? 'Desactivar' : 'Activar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetodoFinancieroCard;
