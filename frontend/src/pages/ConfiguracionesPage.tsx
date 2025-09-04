import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Coins,
  Percent,
  UserCog,
  Wallet,
  FileText,
  CreditCard,
  Tag,
} from "lucide-react";

type ConfigItem = {
  id: string;
  nombre: string;
  descripcion: string;
  icon: JSX.Element;
  path: string;
  habilitado: boolean;
};

const ConfiguracionesPage = () => {
  const navigate = useNavigate();

  const [configItems] = useState<ConfigItem[]>([
    {
      id: "divisas",
      nombre: "Divisas",
      descripcion: "Administrar divisas admitidas y sus denominaciones",
      icon: <Coins className="w-6 h-6 text-blue-600" />,
      path: "/divisas",
      habilitado: true,
    },
    {
      id: "roles",
      nombre: "Roles y permisos",
      descripcion: "Gestionar roles y permisos de los usuarios",
      icon: <UserCog className="w-6 h-6 text-orange-600" />,
      path: "/roles",
      habilitado: true,
    },
    {
      id: "categorias",
      nombre: "Categorías de clientes",
      descripcion: "Administrar categorías existentes",
      icon: <Tag className="w-6 h-6 text-pink-600" />,
      path: "/categorias-clientes",
      habilitado: true,
    },
    {
      id: "tasas",
      nombre: "Tasas de cambio",
      descripcion: "Configurar y actualizar tasas de cambio",
      icon: <Percent className="w-6 h-6 text-green-600" />,
      path: "/configuraciones/tasas",
      habilitado: false,
    },
    {
      id: "metodos",
      nombre: "Métodos de pago/cobro",
      descripcion: "Definir métodos de pago y cobro habilitados",
      icon: <CreditCard className="w-6 h-6 text-purple-600" />,
      path: "/configuraciones/metodos",
      habilitado: false,
    },
    {
      id: "comisiones",
      nombre: "Comisiones",
      descripcion: "Configurar comisiones aplicadas a operaciones",
      icon: <Wallet className="w-6 h-6 text-teal-600" />,
      path: "/configuraciones/comisiones",
      habilitado: false,
    },
    {
      id: "documentos",
      nombre: "Documentos electrónicos",
      descripcion: "Configurar facturación electrónica y reportes",
      icon: <FileText className="w-6 h-6 text-gray-600" />,
      path: "/configuraciones/documentos",
      habilitado: false,
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
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionesPage;
