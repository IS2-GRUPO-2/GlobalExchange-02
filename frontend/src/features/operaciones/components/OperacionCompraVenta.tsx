import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { operacionPrivada } from "../services/operacionService";
import { type CalcularOperacionResponse } from "../types/Operacion";
import type {
  TransaccionRequest,
  Transaccion,
  TransaccionDetalle,
} from "../types/Transaccion";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "../../usuario/types/User";
import type {
  MetodoFinanciero,
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
} from "../../metodos_financieros/types/MetodoFinanciero";
import {
  crearTransaccion,
  reconfirmarTasa,
  actualizarTransaccion,
  confirmarPago,
  cancelarTransaccion,
  stripeCheckout,
} from "../services/transaccionService";
import { formatNumber } from "../utils/formatNumber";
// Importar las etapas
import EtapaConfiguracionOperacion from "./EtapaConfiguracionOperacion";
import EtapaResultado from "./EtapaResultado";
import EtapaPago from "./EtapaPago";
import EtapaComprobante from "./EtapaComprobante";
import { useClientStore } from "../../../hooks/useClientStore";

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
  const navigate = useNavigate();
  // Estado de navegaciÃ³n
  const [etapaActual, setEtapaActual] = useState<EtapaActual>(1);

  // Estados de datos de la operaciÃ³n
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [detalleMetodoSeleccionado, setDetalleMetodoSeleccionado] = useState<
    number | null
  >(null);
  const [metodoGenericoSeleccionado, setMetodoGenericoSeleccionado] = useState<
    number | null
  >(null);
  const [metodoSeleccionadoInfo, setMetodoSeleccionadoInfo] =
    useState<MetodoFinanciero | null>(null);
  const [detalleMetodoSeleccionadoInfo, setDetalleMetodoSeleccionadoInfo] =
    useState<CuentaBancaria | BilleteraDigital | Tarjeta | null>(null);

  // Estados para el resultado de la simulaciÃ³n
  const [resultado, setResultado] = useState<CalcularOperacionResponse | null>(
    null
  );

  // Estados para la operaciÃ³n completa (etapas 4-6)
  const [tauserSeleccionado, setTauserSeleccionado] = useState<string>("");
  const [procesandoTransaccion, setProcesandoTransaccion] = useState(false);
  const [pagando, setPagando] = useState(false);
  const creandoTransaccionRef = useRef(false);
  const procesamientoTimeoutRef = useRef<number | null>(null);

  // Nuevo estado para operaciÃ³n desde perspectiva de la casa
  const [opPerspectivaCasa, setOpPerspectivaCasa] = useState<
    "compra" | "venta" | null
  >(null);

  // Cliente actual
  const { selectedClient } = useClientStore();

  // Estados para reconfirmaciÃ³n y transacciÃ³n
  const [transaccionId, setTransaccionId] = useState<number | null>(null);
  const [modalCambioOpen, setModalCambioOpen] = useState(false);
  const [reconfirm, setReconfirm] = useState<ReconfirmPayload | null>(null);
  const [transaccionResumen, setTransaccionResumen] = useState<
    Transaccion | TransaccionDetalle | null
  >(null);

  // FunciÃ³n para resetear la operaciÃ³n completa
  const resetOperacion = () => {
    if (procesamientoTimeoutRef.current !== null) {
      window.clearTimeout(procesamientoTimeoutRef.current);
      procesamientoTimeoutRef.current = null;
    }
    setEtapaActual(1);
    setDivisaOrigen("");
    setDivisaDestino("");
    setMonto(0);
    setDetalleMetodoSeleccionado(null);
    setDetalleMetodoSeleccionadoInfo(null);
    setMetodoGenericoSeleccionado(null);
    setMetodoSeleccionadoInfo(null);
    setTauserSeleccionado("");
    setResultado(null);
    setProcesandoTransaccion(false);
    setPagando(false);
    setTransaccionResumen(null);
    creandoTransaccionRef.current = false;
    setTransaccionId(null);
    setModalCambioOpen(false);
    setReconfirm(null);
    setOpPerspectivaCasa(null);
  };

  useEffect(() => {
    return () => {
      if (procesamientoTimeoutRef.current !== null) {
        window.clearTimeout(procesamientoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    resetOperacion();
  }, [selectedClient]);

  // ========== FUNCIONES DE NAVEGACION ===========

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

  const continuarConfiguracion = async () => {
    if (!divisaOrigen || !divisaDestino || monto <= 0) {
      toast.error("Completa todos los campos");
      return;
    }
    if (!selectedClient) {
      toast.error("Debes tener un cliente seleccionado");
      return;
    }
    if (!opPerspectivaCasa) {
      toast.error("No se pudo determinar el tipo de operación");
      return;
    }
    if (!detalleMetodoSeleccionado && !metodoGenericoSeleccionado) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }
    if (!tauserSeleccionado) {
      toast.error("Debes seleccionar un terminal");
      return;
    }

    try {
      const operacionData = {
        cliente_id: selectedClient!.id,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto: monto,
        op_perspectiva_casa: opPerspectivaCasa!,
        detalle_metodo_id: detalleMetodoSeleccionado ?? undefined,
        metodo_id: metodoGenericoSeleccionado ?? undefined,
      };

      const resultadoCalculado = await operacionPrivada(operacionData);
      setResultado(resultadoCalculado);
      setEtapaActual(2);
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        "Error al calcular la operación";
      toast.error(mensaje);
    }
  };

  const volverAConfiguracion = () => {
    setEtapaActual(1);
  };

  // NavegaciÃ³n Etapa 4 (detalle) -> Confirmar y Pagar (crear transacciÃ³n)
  const getMetodoPago = ():
    | "transferencia"
    | "billetera"
    | "tarjeta"
    | "stripe"
    | null => {
    const metodoNombre = metodoSeleccionadoInfo?.nombre;
    if (metodoNombre === "TRANSFERENCIA_BANCARIA") return "transferencia";
    if (metodoNombre === "BILLETERA_DIGITAL") return "billetera";
    if (metodoNombre === "TARJETA") return "tarjeta";
    if (metodoNombre === "STRIPE") return "stripe";
    return null;
  };

  const requierePago = () => {
    if (!resultado) return false;
    if (resultado.op_perspectiva_casa !== "venta") return false;
    return getMetodoPago() !== null;
  };

  const mostrarProcesandoYComprobante = () => {
    if (procesamientoTimeoutRef.current !== null) {
      window.clearTimeout(procesamientoTimeoutRef.current);
    }
    setProcesandoTransaccion(true);
    procesamientoTimeoutRef.current = window.setTimeout(() => {
      setProcesandoTransaccion(false);
      procesamientoTimeoutRef.current = null;
      setEtapaActual(4);
    }, 1500);
  };

  const getMetodoSimulador = (): SimuladorMetodo | null => {
    const metodo = getMetodoPago();
    if (metodo === "transferencia" || metodo === "billetera") {
      return metodo;
    }
    return null;
  };

  const confirmarYPagar = async () => {
    const requierePagoOperacion = requierePago();
    try {
      if (creandoTransaccionRef.current) {
        return;
      }

      if (!resultado) {
        toast.error("No hay resultado calculado");
        return;
      }

      if (
        metodoGenericoSeleccionado === null &&
        detalleMetodoSeleccionado === null
      ) {
        toast.error("Error: No hay metodo financiero seleccionado");
        return;
      }

      if (transaccionId) {
        if (requierePagoOperacion) {
          setEtapaActual(3);
        } else if (transaccionResumen) {
          mostrarProcesandoYComprobante();
        }
        return;
      }

      const token = localStorage.getItem("token");
      const userId = jwtDecode<DecodedToken>(token!).user_id;

      const transaccionData: TransaccionRequest = {
        id_user: Number(userId),
        cliente: String(selectedClient!.id),
        operacion: opPerspectivaCasa!,
        tasa_aplicada: resultado.tc_final,
        tasa_inicial: resultado.tc_final,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto_origen: resultado.monto_origen,
        monto_destino: resultado.monto_destino,
        metodo_financiero: metodoGenericoSeleccionado ?? undefined,
        metodo_financiero_detalle: detalleMetodoSeleccionado ?? undefined,
        tauser: tauserSeleccionado,
        estado: "pendiente",
      };

      creandoTransaccionRef.current = true;
      const transaccion = await crearTransaccion(transaccionData);
      setTransaccionId(transaccion.id);
      setTransaccionResumen(transaccion);

      if (requierePagoOperacion) {
        setEtapaActual(3);
      } else {
        toast.success("Transaccion creada correctamente");
        mostrarProcesandoYComprobante();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear la transaccion");
    } finally {
      creandoTransaccionRef.current = false;
    }
  };

  const abrirSimuladorPago = async (
    metodo: SimuladorMetodo,
    idTransaccion: number
  ): Promise<"success" | "cancel" | "rate-change"> => {
    if (!resultado) {
      return "cancel";
    }

    const url = new URL(
      "/simulador-transaccion-bancaria",
      window.location.origin
    );
    url.searchParams.set("transaccionId", String(idTransaccion));
    url.searchParams.set("cliente", selectedClient?.nombre ?? "Cliente");
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
          metodo === "transferencia"
            ? "transferencia bancaria"
            : "billetera digital";
        toast.error(
          "No se pudo abrir el simulador de " +
            metodoLabel +
            ". Revisa los bloqueadores de ventanas emergentes."
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

  const pagarConReconfirmacion = async (
    transaccionIdOverride?: number
  ): Promise<TransaccionDetalle | null> => {
    const idTransaccion = transaccionIdOverride ?? transaccionId;
    if (!idTransaccion) {
      toast.error("No hay transaccion creada");
      return null;
    }

    const metodoSimulador = getMetodoSimulador();
    if (metodoSimulador) {
      const resultadoSimulador = await abrirSimuladorPago(
        metodoSimulador,
        idTransaccion
      );
      if (resultadoSimulador === "rate-change") {
        try {
          const r = await reconfirmarTasa(idTransaccion);
          setReconfirm(r);
          setModalCambioOpen(true);
        } catch (error) {
          console.error(error);
          toast.error("No se pudo reconfirmar la tasa");
        }
        return null;
      }
      if (resultadoSimulador !== "success") {
        return null;
      }
    }

    try {
      const r = await reconfirmarTasa(idTransaccion);

      if (!r.cambio) {
        if (metodoSeleccionadoInfo?.nombre === "STRIPE") {
          console.log("Metodo seleccionado stripe");
          const res = await stripeCheckout(idTransaccion, {
            terminos_aceptados: true,
          });
          window.location.href = res.url;
          return null;
        }
        const detalle = await confirmarPago(idTransaccion, {
          terminos_aceptados: true,
        });
        toast.success("Pago confirmado. Transaccion en proceso.");
        setReconfirm(null);
        return detalle;
      }

      setReconfirm(r);
      setModalCambioOpen(true);
      return null;
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la transaccion");
      return null;
    }
  };

  const aceptarCambioYConfirmar = async () => {
    if (!transaccionId) return;

    setModalCambioOpen(false);
    setPagando(true);

    try {
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
                      monto_destino:
                        payload.monto_destino_actual ?? prev.monto_destino,
                    }
                  : prev
              );
            }
            setReconfirm(null);
          } catch (error) {
            console.error(error);
            toast.error(
              "No se pudo actualizar la transaccion con la nueva tasa"
            );
            setModalCambioOpen(true);
            return;
          }
        }

        const resultadoSimulador = await abrirSimuladorPago(
          metodoSimulador,
          transaccionId
        );
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

      const detalle = await confirmarPago(transaccionId, {
        terminos_aceptados: true,
        acepta_cambio: true,
      });
      toast.success("Pago confirmado. Transaccion en proceso.");
      setReconfirm(null);
      setTransaccionResumen(detalle);
      mostrarProcesandoYComprobante();
    } catch (error) {
      console.error(error);
      toast.error("Error al confirmar el pago");
      setModalCambioOpen(true);
    } finally {
      setPagando(false);
    }
  };

  const cancelarPorCambio = async () => {
    if (!transaccionId) return;
    try {
      await cancelarTransaccion(transaccionId);
      setModalCambioOpen(false);
      setPagando(false);
      toast.info("Transaccion cancelada debido al cambio de tasa");
      resetOperacion();
    } catch (e) {
      console.error(e);
      toast.error("Error al cancelar la transaccion");
    }
  };

  const manejarPago = async () => {
    if (!transaccionId || pagando) return;

    setPagando(true);
    try {
      const detalle = await pagarConReconfirmacion(transaccionId);
      if (detalle) {
        setTransaccionResumen(detalle);
        mostrarProcesandoYComprobante();
      }
    } finally {
      setPagando(false);
    }
  };

  const manejarCancelarPago = async () => {
    if (!transaccionId) {
      resetOperacion();
      return;
    }
    try {
      await cancelarTransaccion(transaccionId);
      toast.info("Transaccion cancelada");
      resetOperacion();
    } catch (error) {
      console.error(error);
      toast.error("Error al cancelar la transaccion");
    }
  };

  const irAlHistorial = () => {
    resetOperacion();
    navigate("/historial-transacciones");
  };

  const iniciarNuevaOperacion = () => {
    resetOperacion();
    navigate("/operaciones");
  };

  // ========== FUNCIONES DE UTILIDAD ==========

  const getContainerWidth = () => {
    // Mantener tamaÃ±o estable para todas las etapas
    return "w-full max-w-4xl";
  };

  // ========== RENDER ==========

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 1:
        return (
          <EtapaConfiguracionOperacion
            divisaOrigen={divisaOrigen}
            setDivisaOrigen={setDivisaOrigen}
            divisaDestino={divisaDestino}
            setDivisaDestino={setDivisaDestino}
            monto={monto}
            setMonto={setMonto}
            clienteActual={selectedClient ?? null}
            opPerspectivaCasa={opPerspectivaCasa}
            setOpPerspectivaCasa={setOpPerspectivaCasa}
            detalleMetodoSeleccionado={detalleMetodoSeleccionado}
            setDetalleMetodoSeleccionado={setDetalleMetodoSeleccionado}
            detalleMetodoSeleccionadoInfo={detalleMetodoSeleccionadoInfo}
            setDetalleMetodoSeleccionadoInfo={setDetalleMetodoSeleccionadoInfo}
            metodoGenericoSeleccionado={metodoGenericoSeleccionado}
            setMetodoGenericoSeleccionado={setMetodoGenericoSeleccionado}
            metodoSeleccionadoInfo={metodoSeleccionadoInfo}
            setMetodoSeleccionadoInfo={setMetodoSeleccionadoInfo}
            tauserSeleccionado={tauserSeleccionado}
            setTauserSeleccionado={setTauserSeleccionado}
            onCancelar={cancelarOperacion}
            onContinuar={continuarConfiguracion}
          />
        );
      case 2:
        return (
          resultado && (
            <EtapaResultado
              resultado={resultado}
              tauserSeleccionado={tauserSeleccionado}
              onRetroceder={volverAConfiguracion}
              onAvanzar={confirmarYPagar}
              onCancelar={cancelarOperacion}
              mostrarBotonCancelar={true}
              botonAvanzarLabel={
                tauserSeleccionado
                  ? requierePago()
                    ? "Ir a Pagar"
                    : "Confirmar"
                  : undefined
              }
            />
          )
        );
      case 3: {
        const metodoPago = getMetodoPago();
        if (!metodoPago || !resultado) return null;
        return (
          <EtapaPago
            tipo={metodoPago}
            montoOrigen={resultado.monto_origen}
            divisaOrigen={resultado.divisa_origen}
            detalleClienteSeleccionado={detalleMetodoSeleccionadoInfo}
            onPagar={manejarPago}
            onCancelar={manejarCancelarPago}
            pagando={pagando}
          />
        );
      }
      case 4:
        return resultado && transaccionResumen ? (
          <EtapaComprobante
            transaccion={transaccionResumen}
            resultado={resultado}
            metodoSeleccionado={metodoSeleccionadoInfo?.nombre ?? null}
            detalleMetodoSeleccionado={detalleMetodoSeleccionadoInfo}
            tauserSeleccionado={tauserSeleccionado}
            onVerHistorial={irAlHistorial}
            onNuevaOperacion={iniciarNuevaOperacion}
          />
        ) : null;
      default:
        return null;
    }
  };
  if (!selectedClient) {
    return (
      <section className="flex flex-col items-center p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Cargando cliente...
          </h3>
          <p className="text-sm text-gray-600">
            Espera mientras obtenemos tu informaciÃ³n
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
            Procesando transacciÃ³n...
          </h3>
          <p className="text-sm text-gray-600">
            Tu operaciÃ³n se estÃ¡ procesando
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="operacion"
      className="flex flex-col items-center p-6 select-none"
    >
      <div
        className={`${getContainerWidth()} bg-white rounded-lg shadow-lg p-6 transition-all duration-300`}
      >
        {/* Contenido de la etapa actual */}
        <div className="min-h-[400px]">{renderEtapaActual()}</div>
      </div>

      {/* Modal de cambio de cotizaciÃ³n */}
      {modalCambioOpen && reconfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              La cotizaciÃ³n cambiÃ³
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              La tasa pasÃ³ de{" "}
              <b>{formatNumber(Number(reconfirm.tasa_anterior), 4)}</b> a{" "}
              <b>{formatNumber(Number(reconfirm.tasa_actual), 4)}</b> (
              {formatNumber(Number(reconfirm.delta_pct), 4)}%).
            </p>

            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Monto destino anterior:</span>
                <b>{formatNumber(Number(reconfirm.monto_destino_anterior))}</b>
              </div>
              <div className="flex justify-between">
                <span>Monto destino con nueva tasa:</span>
                <b>{formatNumber(Number(reconfirm.monto_destino_actual))}</b>
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
                Aceptar nueva cotizaciÃ³n
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


