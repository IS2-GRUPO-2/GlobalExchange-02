import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Coins,
  Percent,
  UserCog,
  FileText,
  CreditCard,
  Tag,
  Users,
  User,
  Monitor,
  Shield
} from "lucide-react";
import { CATEGORIAS_CLIENTE, CLIENTES, DIVISAS, METODOS_FINANCIEROS, ROLES, TASAS, USUARIOS, TAUSER , METODOS_FINANCIEROS_DETALLE} from "../types/perms";
import Can from "../components/Can";

type ConfigItem = {
  id: string;
  nombre: string;
  descripcion: string;
  icon: React.ReactElement;
  path: string;
  habilitado: boolean;
  permisos: string[];
};

const ConfiguracionesPage = () => {
  const navigate = useNavigate();

  const [configItems] = useState<ConfigItem[]>([
    {
      id: "usuarios",
      nombre: "Usuarios",
      descripcion: "Administrar usuarios del sistema",
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      path: "/usuarios",
      habilitado: true,
      permisos: [USUARIOS.VIEW],
    },
    {
      id: "clientes",
      nombre: "Clientes",
      descripcion: "Gestionar clientes registrados",
      icon: <User className="w-6 h-6 text-emerald-600" />,
      path: "/clientes",
      habilitado: true,
      permisos: [CLIENTES.VIEW],
    },
    {
      id: "divisas",
      nombre: "Divisas",
      descripcion: "Administrar divisas admitidas y sus denominaciones",
      icon: <Coins className="w-6 h-6 text-blue-600" />,
      path: "/divisas",
      habilitado: true,
      permisos: [DIVISAS.VIEW],
    },
    {
      id: "roles",
      nombre: "Roles y permisos",
      descripcion: "Gestionar roles y permisos de los usuarios",
      icon: <UserCog className="w-6 h-6 text-orange-600" />,
      path: "/roles",
      habilitado: true,
      permisos: [ROLES.VIEW],
    },
    {
      id: "categorias",
      nombre: "Categorías de clientes",
      descripcion: "Administrar categorías existentes",
      icon: <Tag className="w-6 h-6 text-pink-600" />,
      path: "/categorias-clientes",
      habilitado: true,
      permisos: [CATEGORIAS_CLIENTE.VIEW],
    },
    {
      id: "cotizaciones",
      nombre: "Cotizaciones",
      descripcion: "Configurar y actualizar cotizaciones",
      icon: <Percent className="w-6 h-6 text-green-600" />,
      path: "/cotizaciones",
      habilitado: true,
      permisos: [TASAS.VIEW],
    },
    {
      id: "metodos",
      nombre: "Gestión de métodos financieros",
      descripcion: "Definir métodos de pago y cobro habilitados",
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      path: "/metodos-financieros",
      habilitado: true,
      permisos: [METODOS_FINANCIEROS.VIEW],
    },
    {
      id: "metodosCliente",
      nombre: "Métodos de pago/cobro",
      descripcion: "Definir métodos de pago y cobro habilitados",
      icon: <CreditCard className="w-6 h-6 text-purple-600" />,
      path: "/metodos-financieros-cliente",
      habilitado: true,
      permisos: [METODOS_FINANCIEROS_DETALLE.VIEW],
    },
    {
      id: "tausers",
      nombre: "Tausers",
      descripcion: "Configurar tausers para operaciones financieras",
      icon: <Monitor className="w-6 h-6 text-yellow-600" />,
      path: "/configuracion-tausers",
      habilitado: true,
      permisos: [TAUSER.VIEW],
    },
    {
      id: "mfa",
      nombre: "Autenticación de Dos Factores (MFA)",
      descripcion: "Configurar la seguridad de tu cuenta con MFA",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      path: "/settings/security",
      habilitado: true,
      permisos: [], // Todos los usuarios pueden acceder a su propia configuración MFA
    },
    {
      id: "documentos",
      nombre: "Documentos electrónicos",
      descripcion: "Configurar facturación electrónica y reportes",
      icon: <FileText className="w-6 h-6 text-gray-600" />,
      path: "/configuraciones/documentos",
      habilitado: false,
      permisos: [],
    },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} /> Configuraciones
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {configItems.map((item) => (
          item.permisos.length > 0 ? (
            <Can key={item.id} allOf={item.permisos}>
              <div
                onClick={() => item.habilitado && navigate(item.path)}
                className={`relative p-6 bg-white rounded-xl shadow transition ${
                  item.habilitado
                    ? "cursor-pointer hover:shadow-lg"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <div>
                    <h2 className="text-lg font-semibold">{item.nombre}</h2>
                    <p className="text-sm text-gray-500">{item.descripcion}</p>
                  </div>
                </div>

                {!item.habilitado && (
                  <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Próximamente
                  </span>
                )}
              </div>
            </Can>
          ) : (
            <div
              key={item.id}
              onClick={() => item.habilitado && navigate(item.path)}
              className={`relative p-6 bg-white rounded-xl shadow transition ${
                item.habilitado
                  ? "cursor-pointer hover:shadow-lg"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <div>
                  <h2 className="text-lg font-semibold">{item.nombre}</h2>
                  <p className="text-sm text-gray-500">{item.descripcion}</p>
                </div>
              </div>

              {!item.habilitado && (
                <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  Próximamente
                </span>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionesPage;
