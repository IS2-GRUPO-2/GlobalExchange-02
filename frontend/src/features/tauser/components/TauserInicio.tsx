import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { Cliente } from "../../clientes/types/Cliente";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import { useTauserAuth } from "../context/useTauserAuth";
import { useSelectedTauserStore, type SelectedTauser } from "../store/useSelectedTauser";
import DateTimeDisplay from "./DateTimeDisplay";
import EtapaLogin from "./EtapaLogin";
import EtapaCliente from "./EtapaCliente";
import EtapaOperacionesPendientes from "./EtapaOperacionesPendientes";
import { EtapaProcesarOperacion } from "./EtapaProcesarOperacion";
import { OperacionResumen } from "./OperacionResumen";
import { SeleccionTauser } from "./SeleccionTauser";
import { TauserBanner } from "./TauserBanner";
import { useTauserInactividad } from "../hooks/useInactividad";
import { toast } from "react-toastify";
import LogoutButton from "./LogoutButton";

 type EtapaActual =
  | "seleccionar-tauser"
  | "bienvenida"
  | "login"
  | "clientes"
  | "operaciones"
  | "procesar"
  | "resumen";

export default function TauserInicio() {
  const { user, isLoggedIn, logoutTauser } = useTauserAuth();
  const { selectedTauser, setSelectedTauser } = useSelectedTauserStore();

  const [etapaActual, setEtapaActual] = useState<EtapaActual>(
    selectedTauser ? "bienvenida" : "seleccionar-tauser"
  );
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [transaccionActual, setTransaccionActual] = useState<TransaccionDetalle | null>(null);
  const [transaccionResumen, setTransaccionResumen] = useState<TransaccionDetalle | null>(null);
  const [finalizada, setFinalizada] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const resetSesion = useCallback(() => {
    setClienteActual(null);
    setTransaccionActual(null);
    setTransaccionResumen(null);
    setFinalizada(false);
    setCountdown(null);
  }, []);

  const handleLogoutFlow = useCallback(() => {
    logoutTauser();
    resetSesion();
    setEtapaActual("login");
  }, [logoutTauser, resetSesion]);

  useTauserInactividad(etapaActual !== "seleccionar-tauser", handleLogoutFlow, 30000);

  useEffect(() => {
    if (finalizada && countdown === null) {
      setCountdown(10);
    }
  }, [finalizada, countdown]);

  useEffect(() => {
    if (!finalizada || countdown === null) return;
    if (countdown === 0) {
      handleLogoutFlow();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((prev) => (prev ?? 1) - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, finalizada, handleLogoutFlow]);

  const bannerTauser = useMemo<SelectedTauser | null>(() => selectedTauser ?? null, [selectedTauser]);

  useEffect(() => {
    setEtapaActual(selectedTauser ? "bienvenida" : "seleccionar-tauser");
  }, [selectedTauser]);

  const irABienvenida = () => {
    if (!bannerTauser) {
      toast.info("Selecciona una terminal para continuar.");
      return;
    }
    setEtapaActual("bienvenida");
  };

  const handleSeleccionTauser = (tauser: SelectedTauser) => {
    setSelectedTauser(tauser);
    setEtapaActual("bienvenida");
  };

  const handleCambiarTauser = useCallback(() => {
    logoutTauser();
    resetSesion();
    setSelectedTauser(null);
    setEtapaActual("seleccionar-tauser");
  }, [logoutTauser, resetSesion, setSelectedTauser]);

  const handleInicioOperacion = () => {
    if (!bannerTauser) {
      toast.warning("Selecciona una terminal antes de continuar.");
      return;
    }
    if (isLoggedIn()) {
      setEtapaActual("clientes");
    } else {
      setEtapaActual("login");
    }
  };

  const handleLoginExitoso = () => {
    setEtapaActual("clientes");
  };

  const handleSeleccionCliente = (cliente: Cliente) => {
    setClienteActual(cliente);
    setTransaccionActual(null);
    setTransaccionResumen(null);
    setEtapaActual("operaciones");
  };

  const handleSeleccionTransaccion = (transaccion: TransaccionDetalle) => {
    setTransaccionActual(transaccion);
    setTransaccionResumen(null);
    setEtapaActual("procesar");
  };

  const handleOperacionProcesada = (transaccionActualizada: TransaccionDetalle) => {
    setTransaccionResumen(transaccionActualizada);
    setTransaccionActual(null);
    setCountdown(null);
    setFinalizada(transaccionActualizada.estado === "completada");
    setEtapaActual("resumen");
  };

  const handleOperacionCancelada = () => {
    setTransaccionActual(null);
    setTransaccionResumen(null);
    setEtapaActual("operaciones");
  };

  const handleVolverClientes = () => {
    setTransaccionActual(null);
    setTransaccionResumen(null);
    setFinalizada(false);
    setCountdown(null);
    setEtapaActual("clientes");
  };

  const renderContenido = () => {
    switch (etapaActual) {
      case "seleccionar-tauser":
        return (
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Selecciona tu terminal</h1>
            <SeleccionTauser onSeleccionar={handleSeleccionTauser} />
          </div>
        );
      case "bienvenida":
        return (
          <div className="flex flex-col items-center justify-center gap-8 py-10">
            <h1 className="text-4xl font-bold text-[var(--foreground)] text-center">
              Bienvenido a Global Exchange
            </h1>
            <button
              onClick={handleInicioOperacion}
              className="px-10 py-4 rounded-full bg-[var(--primary)] text-white text-xl font-semibold shadow-lg hover:scale-105 transition"
            >
              TOQUE PARA EMPEZAR
            </button>
            <DateTimeDisplay className="text-[var(--muted-foreground)]" />
          </div>
        );
      case "login":
        return (
          <div className="flex justify-center">
            <EtapaLogin onVolverInicio={irABienvenida} onAutenticacionExitosa={handleLoginExitoso} />
          </div>
        );
      case "clientes":
        return <EtapaCliente onSelectCliente={handleSeleccionCliente} tauser={bannerTauser} />;
      case "operaciones":
        return (
          <EtapaOperacionesPendientes
            cliente={clienteActual}
            tauser={bannerTauser}
            onVolver={handleVolverClientes}
            onSeleccionar={handleSeleccionTransaccion}
          />
        );
      case "procesar":
        return (
          <EtapaProcesarOperacion
            transaccion={transaccionActual!}
            tauser={bannerTauser!}
            onCancelar={() => setEtapaActual("operaciones")}
            onProcesada={handleOperacionProcesada}
            onCancelada={handleOperacionCancelada}
          />
        );
      case "resumen":
        return (
          <OperacionResumen
            transaccion={transaccionResumen!}
            tauser={bannerTauser!}
            onVolverClientes={handleVolverClientes}
            onCerrarSesion={handleLogoutFlow}
            onFinalizada={() => setFinalizada(true)}
            finalizada={finalizada}
            cuentaRegresiva={countdown}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ToastContainer position="top-center" theme="light" autoClose={4000} newestOnTop closeOnClick />
      {bannerTauser && etapaActual !== "seleccionar-tauser" && (
        <div className="relative w-full flex justify-center">
          <TauserBanner tauser={bannerTauser} />
          <div className="absolute top-6 right-8 flex gap-3">
            {etapaActual === "bienvenida" && (
              <button
                onClick={handleCambiarTauser}
                className="px-4 py-2 rounded-2xl border border-[var(--border)] bg-white text-[var(--primary)] hover:bg-[var(--accent)] transition"
              >
                Cambiar terminal
              </button>
            )}
            {isLoggedIn() && <LogoutButton onLogout={handleLogoutFlow} />}
          </div>
        </div>
      )}
      <main className="px-4 sm:px-8 pb-16 flex flex-col items-center">{renderContenido()}</main>
    </div>
  );
}
