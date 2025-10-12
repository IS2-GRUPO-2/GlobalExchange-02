import { useState, useEffect } from "react";
import logo from "../../../assets/logo-black.png";
import EtapaLogin from "./EtapaLogin";
import EtapaCliente from "./EtapaCliente";
import { getFormattedDateTime } from "../../../utils/date";

type EtapaActual = "inicio" | "login" | "clientes"; // Preparado para la siguiente etapa

export default function TauserInicio() {
  const [etapaActual, setEtapaActual] = useState<EtapaActual>("inicio");
  const [fechaHora, setFechaHora] = useState(new Date());

  // Actualizar fecha y hora cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setFechaHora(new Date());
    }, 1000*60);

    return () => clearInterval(interval);
  }, []);

  const iniciarOperacion = () => setEtapaActual("login");
  const volverInicio = () => setEtapaActual("inicio");
  const avanzarAClientes = () => setEtapaActual("clientes"); // Para la siguiente etapa

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case "inicio":
        return (
          <div className="flex flex-col items-center justify-center h-full relative overflow-hidden select-none">
            {/* Logo superior izquierdo */}
            <div className="absolute top-4 left-4">
              <img
                src={logo}
                alt="Global Exchange"
                className="w-40 object-contain"
              />
            </div>

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

            {/* Fecha y hora */}
            <div className="absolute bottom-8 text-sm text-gray-600">
              {getFormattedDateTime(fechaHora).formattedDate},{" "}
              {getFormattedDateTime(fechaHora).formattedTime}
            </div>
          </div>
        );

      case "login":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            {/* Logo superior izquierdo */}
            <div className="absolute top-4 left-4">
              <img
                src={logo}
                alt="Global Exchange"
                className="w-40 object-contain"
              />
            </div>
            <EtapaLogin
              onVolverInicio={volverInicio}
              onAutenticacionExitosa={avanzarAClientes}
            />
            {/* Fecha y hora */}
            <div className="absolute bottom-8 text-sm text-gray-600">
              {getFormattedDateTime(fechaHora).formattedDate},{" "}
              {getFormattedDateTime(fechaHora).formattedTime}
            </div>
          </div>
        );

      case "clientes":
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            {/* Logo superior izquierdo */}
            <div className="absolute top-4 left-4">
              <img
                src={logo}
                alt="Global Exchange"
                className="w-40 object-contain"
              />
            </div>
            <div className="w-full flex justify-center mt-8">
              <EtapaCliente />
            </div>
            {/* Fecha y hora */}
            <div className="absolute bottom-8 text-sm text-gray-600">
              {getFormattedDateTime(fechaHora).formattedDate},{" "}
              {getFormattedDateTime(fechaHora).formattedTime}
            </div>
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