import React from "react";
import { Plus, Search } from "lucide-react";
import type {
  MainTabType,
  InstanceTabType,
  CatalogTabType,
} from "../types/MetodoFinanciero";
import { BANCOS, BILLETERAS_DIGITALES, BILLETERAS_DIGITALES_CATALOGO, CUENTAS_BANCARIAS, METODOS_FINANCIEROS, TARJETAS_CATALOGO } from "../../../types/perms";
import Can from "../../../components/Can";

interface SearchAndCreateProps {
  search: string;
  setSearch: (search: string) => void;
  onSearch: () => void;
  onCreateClick: () => void;
  mainTab: MainTabType;
  instanceTab?: InstanceTabType;
  catalogTab?: CatalogTabType;
}

const getInstanceTabLabel = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return "Cuentas Bancarias";
    case "billeteras digitales":
      return "Billeteras Digitales";
    default:
      return "";
  }
};

const getInstanceTabSingularTitle = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return "Cuenta";
    case "billeteras digitales":
      return "Billetera Digital";
    default:
      return "";
  }
};

export const SearchAndCreate: React.FC<SearchAndCreateProps> = ({
  search,
  setSearch,
  onSearch,
  onCreateClick,
  mainTab,
  instanceTab,
  catalogTab,
}) => {
  const getPlaceholder = () => {
    if (mainTab === "catalogo") return "Buscar métodos...";
    if (mainTab === "catalogos") return `Buscar ${catalogTab}...`;
    if (mainTab === "instancias" && instanceTab)
      return `Buscar ${getInstanceTabLabel(instanceTab).toLowerCase()}...`;
    return "Buscar...";
  };

  const getCreateButtonText = () => {
    if (mainTab === "catalogo") return "Crear Método Financiero";
    if (mainTab === "catalogos") {
      if (catalogTab === "bancos") return "Crear Banco";
      if (catalogTab === "billeteras") return "Crear Billetera Digital";
      if (catalogTab === "tarjetas") return "Crear Tarjeta";
    }
    if (mainTab === "instancias" && instanceTab)
      return `Crear ${getInstanceTabSingularTitle(instanceTab)}`;
    return "Crear";
  };

  const getCreatePermision = () => {
    if (mainTab === "catalogo") 
      return [METODOS_FINANCIEROS.ADD];
    if (mainTab === "catalogos") {
      if (catalogTab === "bancos") return [BANCOS.ADD];
      if (catalogTab === "billeteras") return [BILLETERAS_DIGITALES_CATALOGO.ADD];
      if (catalogTab === "tarjetas") return [TARJETAS_CATALOGO.ADD];
    }
    if (mainTab === "instancias") {
      if (instanceTab === "cuentas") return [CUENTAS_BANCARIAS.ADD];
      if (instanceTab === "billeteras digitales") return [BILLETERAS_DIGITALES.ADD];
    }
    return [];
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="relative w-full sm:w-64 md:w-96">
        <div className="flex w-full sm:w-64 md:w-96 gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <Can anyOf={getCreatePermision()}>
        <button
          onClick={onCreateClick}
          className="btn-primary flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" />
          {getCreateButtonText()}
        </button>
      </Can>
    </div>
  );
};
