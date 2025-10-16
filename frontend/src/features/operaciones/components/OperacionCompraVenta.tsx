import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { operacionPrivada, getOpPerspectivaCasa } from "../services/operacionService";
import { type CalcularOperacionResponse } from "../types/Operacion";
import type { TransaccionRequest } from "../types/Transaccion";
import { jwtDecode } from "jwt-decode";
import type { Cliente } from "../../clientes/types/Cliente";
import type { DecodedToken } from "../../usuario/types/User";
import type { MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";
import { getClienteActual } from "../../usuario/services/usuarioService";
import {
  crearTransaccion,
  reconfirmarTasa,
  actualizarTransaccion,
  confirmarPago,
  cancelarTransaccion,
} from "../services/transaccionService";   
import { formatNumber } from "../utils/formatNumber";
// Importar las etapas
import EtapaSeleccionDivisas from "./EtapaSeleccionDivisas";
import EtapaSeleccionMetodo from "./EtapaSeleccionMetodo";
import EtapaSeleccionTauser from "./EtapaSeleccionTauser";
import EtapaResultado from "./EtapaResultado";

type EtapaActual = 1 | 2 | 3 | 4;

type ReconfirmPayload = {
  cambio: boolean;
  tasa_anterior: string;
  tasa_actual: string;
  delta_tc: string;
  delta_pct: string;
  monto_destino_anterior: string;
  monto_destino_actual: string;
};

const SIMULADOR_MESSAGE_KIND = "simulador-transferencia-bancaria";
const SIMULADOR_POPUP_NAMES = {
  transferencia: "simulador-transferencia-bancaria-popup",
  billetera: "simulador-billetera-digital-popup",
} as const;

type SimuladorMetodo = keyof typeof SIMULADOR_POPUP_NAMES;

export default function OperacionCompraVenta() {
  // Estado de navegación
  const [etapaActual, setEtapaActual] = useState<EtapaActual>(1);

  // Estados de datos de la operación
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [detalleMetodoSeleccionado, setDetalleMetodoSeleccionado] = useState<number | null>(null);
  const [metodoGenericoSeleccionado, setMetodoGenericoSeleccionado] = useState<number | null>(null);
  const [metodoSeleccionadoInfo, setMetodoSeleccionadoInfo] = useState<MetodoFinanciero | null>(null);

  // Estados para el resultado de la simulación
  const [resultado, setResultado] = useState<CalcularOperacionResponse | null>(null);
  
  // Estados para la operación completa (etapas 4-6)
  const [tauserSeleccionado, setTauserSeleccionado] = useState<string>("");
  const [procesandoTransaccion, setProcesandoTransaccion] = useState(false);
  
  // Nuevo estado para operación desde perspectiva de la casa
  const [opPerspectivaCasa, setOpPerspectivaCasa] = useState<"compra" | "venta" | null>(null);
  
  // Cliente actual
  const [clienteActual, setClienteActual] = useState<Cliente | undefined>(undefined);

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
    setMetodoSeleccionadoInfo(null);
    setTauserSeleccionado("");
    setResultado(null);
    setProcesandoTransaccion(false);
    setTransaccionId(null);
    setModalCambioOpen(false);
    setReconfirm(null);
    setOpPerspectivaCasa(null);
  };

  // Función para manejar cambio de cliente
  const handleClienteChange = (nuevoCliente: Cliente | null, mostrarError: boolean = false) => {
    resetOperacion();
    setClienteActual(nuevoCliente || undefined);

    // Solo mostrar error si se especifica explícitamente
    if (!nuevoCliente && mostrarError) {
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

        // No mostrar error en la carga inicial
        handleClienteChange(clienteActual, false);
      } catch (err) {
        console.error("Error obteniendo cliente actual", err);
        // Solo mostrar error si hay un problema real en la petición
        toast.error("Error al cargar el cliente. Por favor, recarga la página.");
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
      // Mostrar error cuando el usuario cambia manualmente el cliente y no hay ninguno
      handleClienteChange(cliente, true);
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
    // Mantener divisas y monto, solo limpiar método
    setDetalleMetodoSeleccionado(null);
    setMetodoGenericoSeleccionado(null);
    setOpPerspectivaCasa(null);
  };

  // Navegación Etapa 2 -> 3 (selección de terminal) - ETAPA DE RESULTADO ELIMINADA
  const avanzarEtapa3 = async () => {

    if (!detalleMetodoSeleccionado && !metodoGenericoSeleccionado) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }

    try {
      // Realizar la simulación/cálculo de la operación
      const operacionData = {
        cliente_id: clienteActual!.id,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto_origen: monto,
        op_perspectiva_casa: opPerspectivaCasa!,
        detalle_metodo_id: detalleMetodoSeleccionado ?? undefined,
        metodo_id: metodoGenericoSeleccionado ?? undefined,
      };

      const resultado = await operacionPrivada(operacionData);
      setResultado(resultado);
      // Ir directo a selección de terminal (Etapa 3, antes era 4)
      setEtapaActual(3);
    } catch (error: any) {
      toast.error(error.message || "Error al calcular la operación");
    }
  };

  // Navegación retroceder desde etapa 3 (terminal) a 2 (método)
  const retrocederEtapa2 = () => {
    setEtapaActual(2);
    // Mantener todos los datos excepto tauser y resultado
    setTauserSeleccionado("");
    setResultado(null);
  };

  // Navegación cancelar (reiniciar todo desde etapa 1)
  const cancelarOperacion = () => {
    // Si hay transacción pendiente, cancelarla en el backend
    if (transaccionId) {
      cancelarTransaccion(transaccionId).catch(console.error);
    }
    // Resetear todo y volver a la etapa 1
    resetOperacion();
    toast.info("Operación cancelada");
  };

  // Navegación Etapa 3 (terminal) -> 4 (detalle de operación)
  const avanzarEtapa4 = () => {
    if (!tauserSeleccionado) {
      toast.error("Debes seleccionar un terminal");
      return;
    }

    // Reutilizar el resultado calculado al avanzar desde etapa 2
    setEtapaActual(4);
  };

  // Navegación retroceder desde etapa 4 (detalle) a 3 (terminal)
  const retrocederEtapa3 = () => {
    setEtapaActual(3);
    // Mantener todos los datos, solo volver a selección de terminal
  };

  // Navegación Etapa 4 (detalle) -> Confirmar y Pagar (crear transacción)
  const confirmarYPagar = async () => {
    try {
      // Obtener el usuario actual para el operador
      const token = localStorage.getItem("token");
      const userId = jwtDecode<DecodedToken>(token!).user_id;

     

      if (metodoGenericoSeleccionado === null && detalleMetodoSeleccionado === null) {
        toast.error("Error: No hay método financiero seleccionado");
        return;
      }

      if (!resultado) {
        toast.error("No hay resultado calculado");
        return;
      }


      // Crear transacción PENDIENTE al avanzar a términos y condiciones
      const transaccionData: TransaccionRequest = {
        id_user: Number(userId),
        cliente: String(clienteActual!.id),
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

      const transaccionCreadaId = transaccion.id;
      setTransaccionId(transaccionCreadaId);

      await pagarConReconfirmacion(transaccionCreadaId);
    } catch (error: any) {
      toast.error(error.message || "Error al crear la transacción");
    }
  };


  const getMetodoSimulador = (): SimuladorMetodo | null => {
    if (!resultado) return null;
    if (resultado.op_perspectiva_casa !== "venta") return null;
    if (detalleMetodoSeleccionado === null) return null;

    const metodoNombre = metodoSeleccionadoInfo?.nombre;
    if (metodoNombre === "TRANSFERENCIA_BANCARIA") return "transferencia";
    if (metodoNombre === "BILLETERA_DIGITAL") return "billetera";
    return null;
  };

  const abrirSimuladorPago = async (
    metodo: SimuladorMetodo,
  ): Promise<"success" | "cancel" | "rate-change"> => {
    if (!resultado || !transaccionId) {
      return "cancel";
    }

    const url = new URL("/simulador-transaccion-bancaria", window.location.origin);
    url.searchParams.set("transaccionId", String(transaccionId));
    url.searchParams.set("cliente", clienteActual?.nombre ?? "Cliente");
    url.searchParams.set("monto", String(resultado.monto_origen));
    if (resultado.divisa_origen) {
      url.searchParams.set("divisa", resultado.divisa_origen);
    }
    url.searchParams.set("metodo", metodo);

    return new Promise<"success" | "cancel" | "rate-change">((resolve) => {
      const features =
        "width=420,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes";
      const popupName = SIMULADOR_POPUP_NAMES[metodo];
      const popup = window.open(url.toString(), popupName, features);
      if (!popup) {
        const metodoLabel =
          metodo === "transferencia" ? "transferencia bancaria" : "billetera digital";
        toast.error(
          `No se pudo abrir el simulador de ${metodoLabel}. Revisa los bloqueadores de ventanas emergentes.`,
        );
        resolve("cancel");
        return;
      }
      popup.focus();

      let settled = false;

      const finalize = (result: "success" | "cancel" | "rate-change") => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", handleMessage);
        window.clearInterval(closeWatcher);
        resolve(result);
        if (!popup.closed) {
          popup.close();
        }
      };

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const { data } = event;
        if (!data || data.kind !== SIMULADOR_MESSAGE_KIND) return;
        if (data.status === "success") {
          finalize("success");
          return;
        }
        if (data.status === "rate-change") {
          finalize("rate-change");
          return;
        }
        finalize("cancel");
      };

      const closeWatcher = window.setInterval(() => {
        if (popup.closed) {
          finalize("cancel");
        }
      }, 400);

      window.addEventListener("message", handleMessage);
    });
  };

  // === Funciones de pago con reconfirmación ===
  const pagarConReconfirmacion = async (transaccionIdOverride?: number) => {
    const idTransaccion = transaccionIdOverride ?? transaccionId;
    if (!idTransaccion) {
      toast.error("No hay transacciA3n creada");
      return;
    }

    const metodoSimulador = getMetodoSimulador();
    if (metodoSimulador) {
      const resultadoSimulador = await abrirSimuladorPago(metodoSimulador);
      if (resultadoSimulador === "rate-change") {
        try {
          const r = await reconfirmarTasa(idTransaccion);
          setReconfirm(r);
          setModalCambioOpen(true);
        } catch (error) {
          console.error(error);
          toast.error("No se pudo reconfirmar la tasa");
        }
        return;
      }
      if (resultadoSimulador !== "success") {
        return;
      }
    }

    try {
      const r = await reconfirmarTasa(idTransaccion);

      if (!r.cambio) {
        await confirmarPago(idTransaccion, { terminos_aceptados: true });
        toast.success("Pago confirmado. TransacciA3n en proceso.");
        setReconfirm(null);
        setProcesandoTransaccion(true);
        setTimeout(() => resetOperacion(), 2000);
      } else {
        setReconfirm(r);
        setModalCambioOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la transacciA3n");
    }
  };
  const aceptarCambioYConfirmar = async () => {
    if (!transaccionId) return;

    setModalCambioOpen(false);

    const metodoSimulador = getMetodoSimulador();

    if (metodoSimulador) {
      if (reconfirm) {
        const tasaNueva = Number(reconfirm.tasa_actual);
        const montoDestinoNuevo = Number(reconfirm.monto_destino_actual);
        const payload: {
          tasa_actual?: number;
          monto_destino_actual?: number;
        } = {};

        if (!Number.isNaN(tasaNueva)) {
          payload.tasa_actual = tasaNueva;
        }
        if (!Number.isNaN(montoDestinoNuevo)) {
          payload.monto_destino_actual = montoDestinoNuevo;
        }

        try {
          if (Object.keys(payload).length > 0) {
            await actualizarTransaccion(transaccionId, payload);
            setResultado((prev) =>
              prev
                ? {
                    ...prev,
                    tc_final: payload.tasa_actual ?? prev.tc_final,
                    monto_destino: payload.monto_destino_actual ?? prev.monto_destino,
                  }
                : prev
            );
          }
          setReconfirm(null);
        } catch (error) {
          console.error(error);
          toast.error("No se pudo actualizar la transacción con la nueva tasa");
          setModalCambioOpen(true);
          return;
        }
      }

      const resultadoSimulador = await abrirSimuladorPago(metodoSimulador);
      if (resultadoSimulador === "rate-change") {
        try {
          const r = await reconfirmarTasa(transaccionId);
          setReconfirm(r);
        } catch (error) {
          console.error(error);
          toast.error("No se pudo reconfirmar la tasa");
        }
        setModalCambioOpen(true);
        return;
      }
      if (resultadoSimulador !== "success") {
        setModalCambioOpen(true);
        return;
      }
    }

    try {
      await confirmarPago(transaccionId, {
        terminos_aceptados: true,
        acepta_cambio: true,
      });
      toast.success("Pago confirmado. Transacción en proceso.");
      setProcesandoTransaccion(true);
      setTimeout(() => resetOperacion(), 2000);
    } catch (e) {
      console.error(e);
      toast.error("Error al confirmar el pago");
      setModalCambioOpen(true);
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

  const getContainerWidth = () => {
    // Mantener tamaño estable para todas las etapas
    return "w-full max-w-4xl";
  };



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
            metodoSeleccionadoInfo={metodoSeleccionadoInfo}
            onDetalleMetodoChange={setDetalleMetodoSeleccionado}
            onMetodoGenericoChange={setMetodoGenericoSeleccionado}
            onMetodoSeleccionadoChange={setMetodoSeleccionadoInfo}
            onRetroceder={retrocederEtapa1}
            onContinuar={avanzarEtapa3}
            onCancelar={cancelarOperacion}
          />
        ) : null;
      case 3:
        return (
          <EtapaSeleccionTauser
            tauserSeleccionado={tauserSeleccionado}
            setTauserSeleccionado={setTauserSeleccionado}
            onRetroceder={retrocederEtapa2}
            onAvanzar={avanzarEtapa4}
            onCancelar={cancelarOperacion}
          />
        );
      case 4:
        return resultado && (
          <EtapaResultado
            resultado={resultado}
            tauserSeleccionado={tauserSeleccionado}
            onRetroceder={retrocederEtapa3}
            onAvanzar={confirmarYPagar}
            onCancelar={cancelarOperacion}
            mostrarBotonCancelar={true}
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
              <b>{formatNumber(Number(reconfirm.tasa_anterior), 4)}</b> a{" "}
              <b>{formatNumber(Number(reconfirm.tasa_actual), 4)}</b> (
              {formatNumber(Number(reconfirm.delta_pct), 4)}%).
            </p>

            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Monto destino anterior:</span>
                <b>
                  {formatNumber(Number(reconfirm.monto_destino_anterior))}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Monto destino con nueva tasa:</span>
                <b>
                  {formatNumber(Number(reconfirm.monto_destino_actual))}
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

