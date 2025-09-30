import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import type { Cliente } from "../features/clientes/types/Cliente";
import type {
  OperacionCompleta,
  TransaccionRequest,
} from "../types/Transaccion";
import type { DecodedToken } from "../types/User";
import { jwtDecode } from "jwt-decode";
import { getClienteActual } from "../services/usuarioService";
import {
  simularOperacionCompleta,
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

type EtapaActual = 1 | 2 | 3 | 4 | 5;
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

  // Estados de datos - reutilizando los de simulación
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [detalleMetodoSeleccionado, setDetalleMetodoSeleccionado] = useState<
    number | null
  >(null);
  const [metodoGenericoSeleccionado, setMetodoGenericoSeleccionado] =
    useState<string>("");

  // Estados nuevos para la operación
  const [tauserSeleccionado, setTauserSeleccionado] = useState<string>("");
  const [resultado, setResultado] = useState<OperacionCompleta | null>(null);
  const [procesandoTransaccion, setProcesandoTransaccion] = useState(false);

  // Cliente actual
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);

  // Estados nuevos para reconfirmación y transacción
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
    setMetodoGenericoSeleccionado("");
    setTauserSeleccionado("");
    setResultado(null);
    setProcesandoTransaccion(false);
    // limpiar nuevos estados
    setTransaccionId(null);
    setModalCambioOpen(false);
    setReconfirm(null);
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

    window.addEventListener(
      "clienteActualChanged",
      handleClienteChangeEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "clienteActualChanged",
        handleClienteChangeEvent as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const avanzarEtapa2 = async () => {
    if (!clienteActual) {
      toast.error("Debes tener un cliente seleccionado");
      return;
    }
    // La simulación “real” la hacemos luego de elegir TAUSER
    setEtapaActual(3);
  };

  const retrocederEtapa3 = () => {
    setEtapaActual(2);
    setTauserSeleccionado("");
  };

  const avanzarEtapa3 = async () => {
    if (!clienteActual || !tauserSeleccionado) {
      toast.error("Debes seleccionar un terminal");
      return;
    }

    try {
      // 1) Simulación completa (con TAUSER)
      const simulacionData = {
        cliente_id: clienteActual.idCliente,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto,
        detalle_metodo_id: detalleMetodoSeleccionado ?? undefined,
        metodo_id: metodoGenericoSeleccionado
          ? Number(metodoGenericoSeleccionado)
          : undefined,
      };

      const operacionCompleta = await simularOperacionCompleta(
        simulacionData,
        tauserSeleccionado
      );
      setResultado(operacionCompleta);

      // 2) Crear transacción PENDIENTE (sin T&C)
      const transaccionData: TransaccionRequest = {
        cliente_id: clienteActual.idCliente,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto,
        detalle_metodo_id: detalleMetodoSeleccionado ?? undefined,
        metodo_id: metodoGenericoSeleccionado
          ? Number(metodoGenericoSeleccionado)
          : undefined,
        tauser_id: tauserSeleccionado,
        terminos_aceptados: false,
      };

      const transaccion = await crearTransaccion(transaccionData);
      setTransaccionId(transaccion.id);

      // 3) Avanzar al resumen
      setEtapaActual(4);
    } catch (err) {
      console.error("Error en operación completa", err);
      toast.error("Error al procesar la operación");
    }
  };

  const retrocederEtapa4 = () => {
    setEtapaActual(3);
    setResultado(null);
    // Opcional: cancelar transacción pendiente si se vuelve atrás:
    // if (transaccionId) cancelarTransaccion(transaccionId);
    // setTransaccionId(null);
  };

  const avanzarEtapa4 = () => {
    setEtapaActual(5);
  };

  const retrocederEtapa5 = () => {
    setEtapaActual(4);
  };

  // === Nuevo flujo de pago con reconfirmación
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
      toast.success("Aceptaste la nueva cotización. Transacción en proceso.");
      setModalCambioOpen(false);
      setProcesandoTransaccion(true);
      setTimeout(() => resetOperacion(), 2000);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo confirmar el pago con la nueva cotización");
    }
  };

  const cancelarPorCambio = async () => {
    if (!transaccionId) return;
    try {
      await cancelarTransaccion(transaccionId);
      toast.info("Transacción cancelada por cambio de cotización");
      setModalCambioOpen(false);
      resetOperacion();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cancelar la transacción");
    }
  };

  const getEtapaTitulo = (etapa: EtapaActual) => {
    switch (etapa) {
      case 1:
        return "Paso 1: Divisas y Monto";
      case 2:
        return "Paso 2: Método de Pago/Cobro";
      case 3:
        return "Paso 3: Terminal de Autoservicio";
      case 4:
        return "Paso 4: Resumen de Operación";
      case 5:
        return "Paso 5: Términos y Condiciones";
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
            clienteActual={clienteActual}
            onDivisaOrigenChange={setDivisaOrigen}
            onDivisaDestinoChange={setDivisaDestino}
            onMontoChange={setMonto}
            onAvanzar={avanzarEtapa1}
          />
        );
      case 2:
        return (
          <EtapaSeleccionMetodo
            clienteId={clienteActual?.idCliente || ""}
            divisaOrigen={divisaOrigen}
            divisaDestino={divisaDestino}
            detalleMetodoSeleccionado={detalleMetodoSeleccionado}
            metodoGenericoSeleccionado={metodoGenericoSeleccionado}
            onDetalleMetodoChange={setDetalleMetodoSeleccionado}
            onMetodoGenericoChange={setMetodoGenericoSeleccionado}
            onRetroceder={retrocederEtapa2}
            onSimular={avanzarEtapa2}
            esOperacionReal={true}
          />
        );
      case 3:
        return (
          <EtapaSeleccionTauser
            tauserSeleccionado={tauserSeleccionado}
            onTauserChange={setTauserSeleccionado}
            onRetroceder={retrocederEtapa3}
            onAvanzar={avanzarEtapa3}
          />
        );
      case 4:
        return resultado ? (
          <EtapaResultado
            resultado={resultado}
            onRetroceder={retrocederEtapa4}
            onContinuar={avanzarEtapa4}
            esOperacionReal={true}
          />
        ) : null;
      case 5:
        return resultado ? (
          <EtapaTerminosCondiciones
            resultado={resultado}
            transaccionId={transaccionId!}
            onRetroceder={retrocederEtapa5}
            onPagar={pagarConReconfirmacion}
          />
        ) : null;
    }
  };

  // Determinar el ancho según la etapa
  const getContainerWidth = () => {
    switch (etapaActual) {
      case 1:
      case 2:
        return "w-full max-w-2xl";
      case 3:
        return "w-full max-w-3xl";
      case 4:
      case 5:
        return "w-full max-w-4xl";
      default:
        return "w-full max-w-2xl";
    }
  };

  if (procesandoTransaccion) {
    return (
      <section className="flex flex-col items-center p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Creando Transacción...
          </h3>
          <p className="text-sm text-gray-600">
            Por favor espera mientras procesamos tu solicitud
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
        {/* Header con progreso */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Operación de Compra y Venta
          </h2>

          {/* Indicador de progreso */}
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 5 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= etapaActual
                      ? "bg-zinc-900 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      step < etapaActual ? "bg-zinc-900" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <h3 className="text-lg font-medium text-gray-700 text-center">
            {getEtapaTitulo(etapaActual)}
          </h3>
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
