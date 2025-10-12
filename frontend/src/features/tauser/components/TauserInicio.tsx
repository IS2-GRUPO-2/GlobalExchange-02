import { useState } from "react";
import EtapaLogin from "./EtapaLogin";
import logo from "../../../assets/logo-black.png";

type EtapaActual = "inicio" | "login";

export default function TauserInicio() {
  const [etapaActual, setEtapaActual] = useState<EtapaActual>("inicio");

  const iniciarOperacion = () => setEtapaActual("login");
  const volverInicio = () => setEtapaActual("inicio");

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
              {new Date()
                .toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
                .toUpperCase()}
              ,{" "}
              {new Date().toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              H
            </div>
          </div>
        );

      case "login":
        return <EtapaLogin onVolverInicio={volverInicio} />;

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
