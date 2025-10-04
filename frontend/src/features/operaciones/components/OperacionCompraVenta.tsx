import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { operacionPrivada, getOpPerspectivaCasa } from "../services/operacionService";
import { type CalcularOperacionResponse } from "../types/Operacion";
import type { Cliente } from "../../../types/Cliente";
import type { TransaccionRequest } from "../types/Transaccion";
import type { DecodedToken } from "../../../types/User";
import { jwtDecode } from "jwt-decode";
import { getClienteActual } from "../../../services/usuarioService";
import {
  crearTransaccion,
  reconfirmarTasa,
  confirmarPago,
  cancelarTransaccion,
} from "../services/transaccionService";   
// Importar las etapas
import EtapaSeleccionDivisas from "./EtapaSeleccionDivisas";
import EtapaSeleccionMetodo from "./EtapaSeleccionMetodo";
import EtapaSeleccionTauser from "./EtapaSeleccionTauser";
import EtapaResultado from "./EtapaResultado";
import EtapaTerminosCondiciones from "./EtapaTerminosCondiciones";

type EtapaActual = 1 | 2 | 3 | 4 | 5 | 6;

type ReconfirmPayload = {
  cambio: boolean;
  tasa_anterior: string;
  tasa_actual: string;
  delta_tc: string;
  delta_pct: string;
  monto_destino_anterior: string;
  monto_destino_actual: string;
};

export default function OperacionCompraVenta() {
  // Estado de navegación
  const [etapaActual, setEtapaActual] = useState<EtapaActual>(1);

  // Estados de datos de la operación
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [detalleMetodoSeleccionado, setDetalleMetodoSeleccionado] = useState<number | null>(null);
  const [metodoGenericoSeleccionado, setMetodoGenericoSeleccionado] = useState<number | null>(null);

  // Estados para el resultado de la simulación (etapa 3)
  const [resultado, setResultado] = useState<CalcularOperacionResponse | null>(null);
  
  // Estados para la operación completa (etapas 4-6)
  const [tauserSeleccionado, setTauserSeleccionado] = useState<string>("");
  const [procesandoTransaccion, setProcesandoTransaccion] = useState(false);
  
  // Nuevo estado para operación desde perspectiva de la casa
  const [opPerspectivaCasa, setOpPerspectivaCasa] = useState<"compra" | "venta" | null>(null);
  
  // Cliente actual
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);

  // Estados para reconfirmación y transacción
  const [transaccionId, setTransaccionId] = useState<number | null>(null);
  const [modalCambioOpen, setModalCambioOpen] = useState(false);
  const [reconfirm, setReconfirm] = useState<ReconfirmPayload | null>(null);

  // Función para resetear la operación completa
  const resetOperacion = () => {
    setEtapaActual(1);
    setDivisaOrigen("");
    setDivisaDestino("");
    setMonto(0);
    setDetalleMetodoSeleccionado(null);
    setMetodoGenericoSeleccionado(null);
    setTauserSeleccionado("");
    setResultado(null);
    setProcesandoTransaccion(false);
    setTransaccionId(null);
    setModalCambioOpen(false);
    setReconfirm(null);
    setOpPerspectivaCasa(null);
  };

  // Función para manejar cambio de cliente
  const handleClienteChange = (nuevoCliente: Cliente | null) => {
    resetOperacion();
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
        console.error("Error obteniendo cliente actual", err);
      }
    };
    fetchClienteActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escuchar cambios del cliente desde ClientPicker
  useEffect(() => {
    const handleClienteChangeEvent = (event: Event) => {
      const custom = event as CustomEvent;
      const { cliente } = custom.detail || {};
      handleClienteChange(cliente);
    };

    window.addEventListener("clienteActualChanged", handleClienteChangeEvent as EventListener);

    return () => {
      window.removeEventListener("clienteActualChanged", handleClienteChangeEvent as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== FUNCIONES DE NAVEGACIÓN ==========

  // Navegación Etapa 1 -> 2
  const avanzarEtapa2 = async () => {
    if (!divisaOrigen || !divisaDestino || monto <= 0) {
      toast.error("Completa todos los campos");
      return;
    }
    if (!clienteActual) {
      toast.error("Debes tener un cliente seleccionado");
      return;
    }
    
    try {
      // Obtener operación desde perspectiva de la casa
      const { op_perspectiva_casa } = await getOpPerspectivaCasa(
        Number(divisaOrigen),
        Number(divisaDestino)
      );
      setOpPerspectivaCasa(op_perspectiva_casa);
      setEtapaActual(2);
    } catch (error: any) {
      toast.error(error.message || "Error al determinar tipo de operación");
    }
  };

  // Navegación retroceder desde etapa 2 a 1
  const retrocederEtapa1 = () => {
    setEtapaActual(1);
    setDetalleMetodoSeleccionado(null);
    setMetodoGenericoSeleccionado(null);
  };

  // Navegación Etapa 2 -> 3 (calcular simulación)
  const avanzarEtapa3 = async () => {

    if (!detalleMetodoSeleccionado && !metodoGenericoSeleccionado) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }

    try {
      // Realizar la simulación/cálculo de la operación
      const operacionData = {
        cliente_id: clienteActual.idCliente,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto_origen: monto,
        op_perspectiva_casa: opPerspectivaCasa!,
        detalle_metodo_id: detalleMetodoSeleccionado ?? undefined,
        metodo_id: metodoGenericoSeleccionado ?? undefined,
      };

      const resultado = await operacionPrivada(operacionData);
      setResultado(resultado);
      setEtapaActual(3);
    } catch (error: any) {
      toast.error(error.message || "Error al calcular la operación");
    }
  };

  

  // Navegación retroceder desde etapa 3 a 2
  const retrocederEtapa2 = () => {
    setEtapaActual(2);
    setResultado(null);
  };

  // Navegación cancelar (volver a etapa 1)
  const cancelarOperacion = () => {
    resetOperacion();
  };

  // Navegación Etapa 3 -> 4 (selección de tauser)
  const avanzarEtapa4 = () => {
    setEtapaActual(4);
  };

  // Navegación retroceder desde etapa 4 a 3
  const retrocederEtapa3 = () => {
    setEtapaActual(3);
    setTauserSeleccionado("");
  };

  // Navegación Etapa 4 -> 5 (detalle de operación)
  const avanzarEtapa5 = () => {
    if (!tauserSeleccionado) {
      toast.error("Debes seleccionar un terminal");
      return;
    }

    // Reutilizar el resultado de la etapa 3, sin recalcular
    // La etapa 5 obtendrá la info del tauser por su cuenta
    setEtapaActual(5);
  };

  // Navegación retroceder desde etapa 5 a 4
  const retrocederEtapa4 = () => {
    setEtapaActual(4);
    // Opcional: cancelar transacción pendiente
    if (transaccionId) {
      cancelarTransaccion(transaccionId).catch(console.error);
      setTransaccionId(null);
    }
  };

  // Navegación Etapa 5 -> 6 (términos y condiciones)
  const avanzarEtapa6 = async () => {
    try {
      // Obtener el usuario actual para el operador
      const token = localStorage.getItem("token");
      const userId = jwtDecode<DecodedToken>(token!).user_id;

     

      if (metodoGenericoSeleccionado === null && detalleMetodoSeleccionado === null) {
        toast.error("Error: No hay método financiero seleccionado");
        return;
      }


      // Crear transacción PENDIENTE al avanzar a términos y condiciones
      const transaccionData: TransaccionRequest = {
        operador: userId,
        cliente: clienteActual!.idCliente,
        operacion: opPerspectivaCasa!,
        tasa_aplicada: resultado.tc_final,
        tasa_inicial: resultado.tc_final, // Usar tc_final como tasa inicial también
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto_origen: resultado.monto_origen,
        monto_destino: resultado.monto_destino,
        metodo_financiero: metodoGenericoSeleccionado ?? undefined,
        metodo_financiero_detalle: detalleMetodoSeleccionado ?? undefined,
        tauser: tauserSeleccionado,
        estado: "pendiente",
      };
      console.log(transaccionData);

      const transaccion = await crearTransaccion(transaccionData);
      console.log(transaccion);

      setTransaccionId(transaccion.id);
      setEtapaActual(6);
    } catch (error: any) {
      toast.error(error.message || "Error al crear la transacción");
    }
  };

  // Navegación retroceder desde etapa 6 a 5
  const retrocederEtapa5 = () => {
    // Cancelar transacción pendiente al retroceder desde términos y condiciones
    if (transaccionId) {
      cancelarTransaccion(transaccionId).catch(console.error);
      setTransaccionId(null);
    }
    setEtapaActual(5);
  };

  // === Funciones de pago con reconfirmación ===
  const pagarConReconfirmacion = async () => {
    if (!transaccionId) {
      toast.error("No hay transacción creada");
      return;
    }
    try {
      const r = await reconfirmarTasa(transaccionId);
      if (!r.cambio) {
        await confirmarPago(transaccionId, { terminos_aceptados: true });
        toast.success("Pago confirmado. Transacción en proceso.");
        setProcesandoTransaccion(true);
        setTimeout(() => resetOperacion(), 2000);
      } else {
        setReconfirm(r);
        setModalCambioOpen(true);
      }
    } catch (e) {
      console.error(e);
      toast.error("No se pudo reconfirmar la tasa");
    }
  };

  const aceptarCambioYConfirmar = async () => {
    if (!transaccionId) return;
    try {
      await confirmarPago(transaccionId, {
        terminos_aceptados: true,
        acepta_cambio: true,
      });
      toast.success("Pago confirmado. Transacción en proceso.");
      setModalCambioOpen(false);
      setProcesandoTransaccion(true);
      setTimeout(() => resetOperacion(), 2000);
    } catch (e) {
      console.error(e);
      toast.error("Error al confirmar el pago");
    }
  };

  const cancelarPorCambio = async () => {
    if (!transaccionId) return;
    try {
      await cancelarTransaccion(transaccionId);
      setModalCambioOpen(false);
      toast.info("Transacción cancelada debido al cambio de tasa");
      resetOperacion();
    } catch (e) {
      console.error(e);
      toast.error("Error al cancelar la transacción");
    }
  };

  // ========== FUNCIONES DE UTILIDAD ==========

  const getTitulo = () => {
    switch (etapaActual) {
      case 1: return "Compra y Venta de Divisas";
      case 2: return "Selección de Método";
      case 3: return "Resultado de Operación";
      case 4: return "Selección de Terminal";
      case 5: return "Detalle de Operación";
      case 6: return "Términos y Condiciones";
      default: return "Operación";
    }
  };

  const getContainerWidth = () => {
    switch (etapaActual) {
      case 1:
      case 2:
      case 4:
        return "w-full max-w-2xl";
      case 3:
      case 5:
        return "w-full max-w-4xl";
      case 6:
        return "w-full max-w-3xl";
      default:
        return "w-full max-w-2xl";
    }
  };

  const getEtapasInfo = () => [
    { numero: 1, texto: "Divisas", activo: etapaActual >= 1 },
    { numero: 2, texto: "Método", activo: etapaActual >= 2 },
    { numero: 3, texto: "Resultado", activo: etapaActual >= 3 },
    { numero: 4, texto: "Terminal", activo: etapaActual >= 4 },
    { numero: 5, texto: "Detalle", activo: etapaActual >= 5 },
    { numero: 6, texto: "Términos", activo: etapaActual >= 6 },
  ];

  // ========== RENDER ==========

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 1:
        return (
          <EtapaSeleccionDivisas
            divisaOrigen={divisaOrigen}
            setDivisaOrigen={setDivisaOrigen}
            divisaDestino={divisaDestino}
            setDivisaDestino={setDivisaDestino}
            monto={monto}
            setMonto={setMonto}
            clienteActual={clienteActual}
            onContinuar={avanzarEtapa2}
          />
        );
      case 2:
        return opPerspectivaCasa ? (
          <EtapaSeleccionMetodo
            opPerspectivaCasa={opPerspectivaCasa}
            detalleMetodoSeleccionado={detalleMetodoSeleccionado}
            metodoGenericoSeleccionado={metodoGenericoSeleccionado}
            onDetalleMetodoChange={setDetalleMetodoSeleccionado}
            onMetodoGenericoChange={setMetodoGenericoSeleccionado}
            onRetroceder={retrocederEtapa1}
            onContinuar={avanzarEtapa3}
          />
        ) : null;
      case 3:
        return (
           <EtapaResultado
            resultado={resultado}
            onRetroceder={retrocederEtapa2}
            onAvanzar={avanzarEtapa4}
            onCancelar={cancelarOperacion}
            mostrarBotonCancelar={true}
          />
        );
      case 4:
        return (
          <EtapaSeleccionTauser
            tauserSeleccionado={tauserSeleccionado}
            setTauserSeleccionado={setTauserSeleccionado}
            onRetroceder={retrocederEtapa3}
            onAvanzar={avanzarEtapa5}
          />
        );
      case 5:
        return (
          <EtapaResultado
            resultado={resultado}
            tauserSeleccionado={tauserSeleccionado}
            onRetroceder={retrocederEtapa4}
            onAvanzar={avanzarEtapa6}
          />
        );
      case 6:
        return (
          <EtapaTerminosCondiciones
            resultado={resultado}
            tauserSeleccionado={tauserSeleccionado}
            onRetroceder={retrocederEtapa5}
            onPagar={pagarConReconfirmacion}
          />
        );
      default:
        return null;
    }
  };

  if (!clienteActual) {
    return (
      <section className="flex flex-col items-center p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Cargando cliente...
          </h3>
          <p className="text-sm text-gray-600">
            Espera mientras obtenemos tu información
          </p>
        </div>
      </section>
    );
  }

  if (procesandoTransaccion) {
    return (
      <section className="flex flex-col items-center p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Procesando transacción...
          </h3>
          <p className="text-sm text-gray-600">
            Tu operación se está procesando
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="operacion" className="flex flex-col items-center p-6 select-none">
      <div className={`${getContainerWidth()} bg-white rounded-lg shadow-lg p-6 transition-all duration-300`}>
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {getTitulo()}
          </h2>

          {/* Indicador de progreso */}
          <div className="flex justify-between mb-2">
            {getEtapasInfo().map((step, index) => (
              <div key={step.numero} className={`flex items-center ${index < 5 ? "flex-1" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.activo 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {step.numero}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.activo ? "text-blue-600" : "text-gray-500"
                }`}>
                  {step.texto}
                </span>
                {index < 5 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    etapaActual > step.numero ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido de la etapa actual */}
        <div className="min-h-[400px]">{renderEtapaActual()}</div>

    
      </div>

      {/* Modal de cambio de cotización */}
      {modalCambioOpen && reconfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              La cotización cambió
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              La tasa pasó de{" "}
              <b>{Number(reconfirm.tasa_anterior).toLocaleString("es-PY")}</b> a{" "}
              <b>{Number(reconfirm.tasa_actual).toLocaleString("es-PY")}</b> (
              {Number(reconfirm.delta_pct).toFixed(4)}%).
            </p>

            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Monto destino anterior:</span>
                <b>
                  {Number(reconfirm.monto_destino_anterior).toLocaleString(
                    "es-PY"
                  )}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Monto destino con nueva tasa:</span>
                <b>
                  {Number(reconfirm.monto_destino_actual).toLocaleString(
                    "es-PY"
                  )}
                </b>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelarPorCambio}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={aceptarCambioYConfirmar}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700"
              >
                Aceptar nueva cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}