import { useState } from "react";
import logo from "../../../assets/logo-black.png";
import EtapaLogin from "./EtapaLogin";
import EtapaCliente from "./EtapaCliente";
import EtapaOperacionesPendientes from "./EtapaOperacionesPendientes";
import { useTauserAuth } from "../context/useTauserAuth";
import type { Cliente } from "../../clientes/types/Cliente";
import LogoutButton from "./LogoutButton";
import DateTimeDisplay from "./DateTimeDisplay";

type EtapaActual = "inicio" | "login" | "clientes" | "operaciones_pendientes";

export default function TauserInicio() {
  const [etapaActual, setEtapaActual] = useState<EtapaActual>("inicio");
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const { logoutTauser } = useTauserAuth();

  const iniciarOperacion = () => setEtapaActual("login");
  const volverInicio = () => setEtapaActual("inicio");
  const avanzarAClientes = () => setEtapaActual("clientes");
  const avanzarAOperacionesPendientes = (cliente: Cliente) => {
    setClienteActual(cliente);
    setEtapaActual("operaciones_pendientes");
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    logoutTauser();
    volverInicio();
  };
  
  // Componente reutilizable para el logo superior izquierdo
  const LogoHeader = () => (
    <div className="absolute top-4 left-4">
      <img
        src={logo}
        alt="Global Exchange"
        className="w-40 object-contain"
      />
    </div>
  );
  
  const renderEtapaActual = () => {
    switch (etapaActual) {
      case "inicio":
        return (
          <div className="flex flex-col items-center justify-center h-full relative overflow-hidden select-none">
            <LogoHeader />

            {/* Título principal */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
              Bienvenido a Global Exchange
            </h1>

            {/* Botón principal */}
            <button
              onClick={iniciarOperacion}
              className="bg-black text-white px-8 py-3 rounded-full text-lg font-medium shadow-md hover:shadow-lg hover:bg-gray-800 transition-all duration-200"
            >
              TOQUE PARA EMPEZAR
            </button>

            <DateTimeDisplay />
          </div>
        );

      case "login":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <LogoHeader />
            <EtapaLogin
              onVolverInicio={volverInicio}
              onAutenticacionExitosa={avanzarAClientes}
            />
            <DateTimeDisplay />
          </div>
        );

      case "clientes":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <LogoHeader />
            <LogoutButton onLogout={handleLogout} />
            <div className="w-full flex justify-center mt-8">
              <EtapaCliente onSelectCliente={avanzarAOperacionesPendientes} />
            </div>
            <DateTimeDisplay />
          </div>
        );

      case "operaciones_pendientes":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <LogoHeader />
            <LogoutButton onLogout={handleLogout} />
            <div className="w-full flex justify-center mt-8">
              <EtapaOperacionesPendientes 
                cliente={clienteActual} 
                onVolver={() => setEtapaActual("clientes")} 
              />
            </div>
            <DateTimeDisplay />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white text-black overflow-hidden">
      <div className="h-full flex flex-col">{renderEtapaActual()}</div>
    </div>
  );
}