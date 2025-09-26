import React from "react";
import { Building2, Smartphone } from "lucide-react";
import MetodoFinancieroCard from "./MetodoFinancieroCard";
import type { ExtendedItem, InstanceTabType } from "../types/MetodoFinanciero";

interface InstancesGridProps {
  items: ExtendedItem[];
  instanceTab: InstanceTabType;
  search: string;
  loading: boolean;
  onView: (item: ExtendedItem) => void;
  onEdit: (item: ExtendedItem) => void;
  onToggle: (item: ExtendedItem) => void;
}

const getInstanceTabIcon = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return <Building2 className="w-5 h-5" />;
    case "billeteras digitales":
      return <Smartphone className="w-5 h-5" />;
  }
};

const getInstanceTabLabel = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return "Cuentas";
    case "billeteras digitales":
      return "Billeteras Digitales";
    default:
      return "";
  }
};

const getInstanceTabSingular = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return "cuenta";
    case "billeteras digitales":
      return "billetera digital";
    default:
      return "";
  }
};

export const InstancesGrid: React.FC<InstancesGridProps> = ({
  items,
  instanceTab,
  search,
  loading,
  onView,
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

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          {getInstanceTabIcon(instanceTab)}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay {getInstanceTabLabel(instanceTab).toLowerCase()} de la casa
        </h3>
        <p className="text-gray-600 mb-4">
          {search
            ? `No se encontraron resultados para "${search}"`
            : `Comienza creando la primera ${getInstanceTabSingular(
                instanceTab
              )} de la casa`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <MetodoFinancieroCard
          key={item.id}
          item={item}
          onView={onView as any}
          onEdit={onEdit as any}
          onToggleActive={onToggle as any}
        />
      ))}
    </div>
  );
};
