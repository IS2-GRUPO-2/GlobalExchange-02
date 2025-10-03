import React from "react";
import type {
  MainTabType,
  MetodoFinanciero,
  CuentaBancaria,
  BilleteraDigital,
  ExtendedItem,
} from "../types/MetodoFinanciero";
import { getDisplayName } from "../utils/metodosFinancierosUtils";

interface ItemDetailsViewProps {
  selectedItem: any;
  mainTab: MainTabType;
}

export const ItemDetailsView: React.FC<ItemDetailsViewProps> = ({
  selectedItem,
  mainTab,
}) => {
  if (!selectedItem) return null;

  if (mainTab === "catalogo") {
    const metodo = selectedItem as MetodoFinanciero;
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Detalles del Método Financiero
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <p className="text-gray-900">{getDisplayName(metodo.nombre)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                metodo.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {metodo.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Permite Cobro
            </label>
            <p className="text-gray-900">
              {metodo.permite_cobro ? "Sí" : "No"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Permite Pago
            </label>
            <p className="text-gray-900">{metodo.permite_pago ? "Sí" : "No"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comisión Cobro
            </label>
            <p className="text-gray-900">{metodo.comision_cobro_porcentaje}%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comisión Pago
            </label>
            <p className="text-gray-900">{metodo.comision_pago_porcentaje}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedItem.tipo) {
    switch (selectedItem.tipo) {
      case "cuentas":
        const cuenta = selectedItem as CuentaBancaria & ExtendedItem;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Detalles de Cuenta Bancaria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Banco
                </label>
                <p className="text-gray-900">
                  {cuenta.banco_nombre || `Banco ID: ${cuenta.banco}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titular
                </label>
                <p className="text-gray-900">{cuenta.titular}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Cuenta
                </label>
                <p className="text-gray-900">{cuenta.numero_cuenta}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CBU/CVU
                </label>
                <p className="text-gray-900">{cuenta.cbu_cvu}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cuenta.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {cuenta.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        );

      case "billeteras digitales":
        const billetera = selectedItem as BilleteraDigital & ExtendedItem;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Detalles de Billetera Digital
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plataforma
                </label>
                <p className="text-gray-900">
                  {billetera.plataforma_nombre ||
                    `Plataforma ID: ${billetera.plataforma}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Usuario ID
                </label>
                <p className="text-gray-900">{billetera.usuario_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="text-gray-900">{billetera.email}</p>
              </div>
              {billetera.telefono && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <p className="text-gray-900">{billetera.telefono}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    billetera.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {billetera.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-600">Detalles de instancia de la casa</div>
        );
    }
  }

  return (
    <div className="text-gray-600">Detalles del elemento seleccionado</div>
  );
};
