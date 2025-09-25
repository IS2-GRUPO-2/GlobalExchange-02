import React from "react";
import { Building2, Smartphone, CreditCard } from "lucide-react";
import type {
  MainTabType,
  InstanceTabType,
  CatalogTabType,
} from "../types/MetodoFinanciero";
import Can from "../../../components/Can";
import { BANCOS, BILLETERAS_DIGITALES, BILLETERAS_DIGITALES_CATALOGO, CUENTAS_BANCARIAS, METODOS_FINANCIEROS, TARJETAS_CATALOGO } from "../../../types/perms";

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

const getInstanceViewPerm = (tab: InstanceTabType) => {
  switch (tab) {
    case "cuentas":
      return [CUENTAS_BANCARIAS.VIEW];
    case "billeteras digitales":
      return [BILLETERAS_DIGITALES.VIEW];
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
            <Can anyOf={[METODOS_FINANCIEROS.VIEW]}>
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
            </Can>
            <Can anyOf={[BANCOS.VIEW, BILLETERAS_DIGITALES_CATALOGO.VIEW, TARJETAS_CATALOGO.VIEW]}>
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
            </Can>
            <Can anyOf={[CUENTAS_BANCARIAS.VIEW, BILLETERAS_DIGITALES.VIEW]}>
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
            </Can>
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
                  <Can key={tab} anyOf={getInstanceViewPerm(tab)}>
                    <button
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
                  </Can>
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
              <Can anyOf={[BANCOS.VIEW]}>
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
              </Can>
              <Can anyOf={[BILLETERAS_DIGITALES_CATALOGO.VIEW]}>
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
              </Can>
              <Can anyOf={[TARJETAS_CATALOGO.VIEW]}>
                <button
                  onClick={() => setCatalogTab("tarjetas")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    catalogTab === "tarjetas"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Tarjetas</span>
                </button>
              </Can>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
