import React from "react";
import { Building2, Smartphone } from "lucide-react";
import type {
  MainTabType,
  InstanceTabType,
  CatalogTabType,
} from "../types/MetodoFinanciero";

interface TabNavigationProps {
  mainTab: MainTabType;
  setMainTab: (tab: MainTabType) => void;
  instanceTab?: InstanceTabType;
  setInstanceTab?: (tab: InstanceTabType) => void;
  catalogTab?: CatalogTabType;
  setCatalogTab?: (tab: CatalogTabType) => void;
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
  }
};

export const TabNavigation: React.FC<TabNavigationProps> = ({
  mainTab,
  setMainTab,
  instanceTab,
  setInstanceTab,
  catalogTab,
  setCatalogTab,
}) => {
  return (
    <>
      {/* Main Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMainTab("catalogo")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === "catalogo"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Catálogo de Métodos Financieros
            </button>
            <button
              onClick={() => setMainTab("catalogos")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === "catalogos"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Catálogos de Entidades
            </button>
            <button
              onClick={() => setMainTab("instancias")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mainTab === "instancias"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Instancias de la Casa
            </button>
          </nav>
        </div>
      </div>

      {/* Instance Tabs */}
      {mainTab === "instancias" && instanceTab && setInstanceTab && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(["cuentas", "billeteras digitales"] as InstanceTabType[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setInstanceTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      instanceTab === tab
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {getInstanceTabIcon(tab)}
                    <span>{getInstanceTabLabel(tab)}</span>
                  </button>
                )
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Catalog Tabs */}
      {mainTab === "catalogos" && catalogTab && setCatalogTab && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCatalogTab("bancos")}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  catalogTab === "bancos"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Bancos</span>
              </button>
              <button
                onClick={() => setCatalogTab("billeteras")}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  catalogTab === "billeteras"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>Billeteras Digitales</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
