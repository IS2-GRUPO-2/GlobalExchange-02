import { useState, useEffect } from "react";
import { simularOperacionPrivadaConInstancia } from "../services/simulacionService";
import { type SimulacionResponse } from "../types/Simulacion";
import { getClienteActual } from "../services/usuarioService";
import { type Cliente } from "../features/clientes/types/Cliente";
import type { DecodedToken } from "../types/User";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

// Importar las etapas
import EtapaSeleccionDivisas from "./EtapaSeleccionDivisas";
import EtapaSeleccionMetodo from "./EtapaSeleccionMetodo";
import EtapaResultado from "./EtapaResultado";

type EtapaActual = 1 | 2 | 3;

export default function SimulacionOperacionPrivada() {
  // Estado de navegación
  const [etapaActual, setEtapaActual] = useState<EtapaActual>(1);
  
  // Estados de datos
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [detalleMetodoSeleccionado, setDetalleMetodoSeleccionado] = useState<number | null>(null);
  const [metodoGenericoSeleccionado, setMetodoGenericoSeleccionado] = useState<string>("");
  const [resultado, setResultado] = useState<SimulacionResponse | null>(null);
  
  // Cliente actual
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);

  // Función para resetear la simulación completa
  const resetSimulacion = () => {
    setEtapaActual(1);
    setDivisaOrigen("");
    setDivisaDestino("");
    setMonto(0);
    setDetalleMetodoSeleccionado(null);
    setMetodoGenericoSeleccionado("");
    setResultado(null);
  };

  // Función para manejar cambio de cliente
  const handleClienteChange = (nuevoCliente: Cliente | null) => {
    resetSimulacion();
    setClienteActual(nuevoCliente);
    
    if (!nuevoCliente) {
      toast.error("No tienes un cliente asignado. Contacta a soporte.");
    }
  };

  useEffect(() => {
    const fetchClienteActual = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userId = jwtDecode<DecodedToken>(token).user_id;
        const res = await getClienteActual(Number(userId));
        const { clienteActual } = res.data;
        
        handleClienteChange(clienteActual);

      } catch (err) {
        console.error("Error cargando cliente actual", err);
      }
    };
    fetchClienteActual();
  }, []);

  // Escuchar cambios del cliente desde ClientPicker
  useEffect(() => {
    const handleClienteChangeEvent = (event: CustomEvent) => {
      const { cliente } = event.detail;
      handleClienteChange(cliente); 
    };

    window.addEventListener('clienteActualChanged', handleClienteChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('clienteActualChanged', handleClienteChangeEvent as EventListener);
    };
  }, []);

  // Handlers de navegación
  const avanzarEtapa1 = () => {
    setEtapaActual(2);
  };

  const retrocederEtapa2 = () => {
    setEtapaActual(1);
    setDetalleMetodoSeleccionado(null);
    setMetodoGenericoSeleccionado("");
  };

  const retrocederEtapa3 = () => {
    setEtapaActual(2);
    setResultado(null);
  };

  const nuevaSimulacion = () => {
    resetSimulacion();
  };

  // Handler para simular
  const handleSimular = async () => {
    if (!clienteActual) {
      toast.error("Debes tener un cliente seleccionado para simular");
      return;
    }

    try {
      const res = await simularOperacionPrivadaConInstancia({
        cliente_id: clienteActual.idCliente,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto,
        detalle_metodo_id: detalleMetodoSeleccionado || undefined,
        metodo_id: metodoGenericoSeleccionado ? Number(metodoGenericoSeleccionado) : undefined,
      });
      setResultado(res);
      setEtapaActual(3);
    } catch (err) {
      console.error("Error en simulación", err);
      toast.error("Error al realizar la simulación");
    }
  };

  const getEtapaTitulo = (etapa: EtapaActual) => {
    switch (etapa) {
      case 1: return "Divisas y Monto";
      case 2: return "Método";
      case 3: return "Resultado";
    }
  };

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 1:
        return (
          <EtapaSeleccionDivisas
            divisaOrigen={divisaOrigen}
            divisaDestino={divisaDestino}
            monto={monto}
            clienteActual={clienteActual} // Pasar el cliente actual
            onDivisaOrigenChange={setDivisaOrigen}
            onDivisaDestinoChange={setDivisaDestino}
            onMontoChange={setMonto}
            onAvanzar={avanzarEtapa1}
          />
        );
      case 2:
        return clienteActual ? (
          <EtapaSeleccionMetodo
            clienteId={clienteActual.idCliente}
            divisaOrigen={divisaOrigen}
            divisaDestino={divisaDestino}
            detalleMetodoSeleccionado={detalleMetodoSeleccionado}
            metodoGenericoSeleccionado={metodoGenericoSeleccionado}
            onDetalleMetodoChange={setDetalleMetodoSeleccionado}
            onMetodoGenericoChange={setMetodoGenericoSeleccionado}
            onRetroceder={retrocederEtapa2}
            onSimular={handleSimular}
          />
        ) : null;
      case 3:
        return resultado ? (
          <EtapaResultado
            resultado={resultado}
            onRetroceder={retrocederEtapa3}
            onNuevaSimulacion={nuevaSimulacion}
          />
        ) : null;
    }
  };

  // Determinar el ancho según la etapa
  const getContainerWidth = () => {
    switch (etapaActual) {
      case 1: return "max-w-2xl"; // Etapa 1: más pequeña
      case 2: return "max-w-6xl"; // Etapa 2: más ancha para ver todos los métodos
      case 3: return "max-w-3xl"; // Etapa 3: intermedia
      default: return "max-w-2xl";
    }
  };

  return (
    <section id="convert" className="flex flex-col items-center p-6 select-none">
      <div className={`w-full ${getContainerWidth()} bg-white rounded-xl shadow overflow-hidden border border-gray-200 transition-all duration-300`}>
        {/* Encabezado con pestañas de etapas */}
        <div className="bg-zinc-900 text-white">
          <div className="text-center py-3 border-b border-zinc-700">
            <h2 className="text-lg font-semibold">Simulación de Operación</h2>
          </div>
          
          {/* Navegación de etapas */}
          <div className="flex">
            {([1, 2, 3] as EtapaActual[]).map((etapa) => (
              <div
                key={etapa}
                className={`flex-1 py-4 px-3 text-center text-sm font-medium border-r border-zinc-700 last:border-r-0 ${
                  etapaActual === etapa 
                    ? 'bg-zinc-700 text-white' 
                    : etapaActual > etapa 
                      ? 'bg-zinc-800 text-zinc-300' 
                      : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    etapaActual === etapa 
                      ? 'bg-white text-zinc-900 border-white' 
                      : etapaActual > etapa 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-transparent text-zinc-400 border-zinc-600'
                  }`}>
                    {etapaActual > etapa ? '✓' : etapa}
                  </span>
                  <span className="leading-tight">{getEtapaTitulo(etapa)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido de la etapa actual */}
        <div className="p-6">
          {renderEtapaActual()}
        </div>
      </div>
    </section>
  );
}