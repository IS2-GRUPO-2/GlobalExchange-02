import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  getCasaCuentasBancarias,
  getCasaBilleterasDigitales,
} from "../../metodos_financieros/services/metodoFinancieroService";
import type {
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
} from "../../metodos_financieros/types/MetodoFinanciero";
import { formatNumber } from "../utils/formatNumber";

type MetodoPago = "transferencia" | "billetera" | "tarjeta" | "stripe";

interface EtapaPagoProps {
  tipo: MetodoPago;
  montoOrigen: number;
  divisaOrigen: string;
  detalleClienteSeleccionado:
    | CuentaBancaria
    | BilleteraDigital
    | Tarjeta
    | null;
  onPagar: () => void;
  onCancelar: () => void;
  pagando: boolean;
}

const filtrarActivos = <
  T extends {
    metodo_financiero_detalle?: { is_active?: boolean } | number;
    is_active?: boolean;
  }
>(
  items: T[]
) => {
  return items.filter((item) => {
    const detalle = item.metodo_financiero_detalle;
    if (typeof detalle === "object" && detalle !== null) {
      return detalle.is_active !== false;
    }
    if (typeof item.is_active === "boolean") {
      return item.is_active;
    }
    return true;
  });
};

export default function EtapaPago({
  tipo,
  montoOrigen,
  divisaOrigen,
  detalleClienteSeleccionado,
  onPagar,
  onCancelar,
  pagando,
}: EtapaPagoProps) {
  const [cuentasCasa, setCuentasCasa] = useState<CuentaBancaria[]>([]);
  const [billeterasCasa, setBilleterasCasa] = useState<BilleteraDigital[]>([]);
  const [cargandoInstancias, setCargandoInstancias] = useState(false);

  useEffect(() => {
    let activo = true;
    const cargarInstanciasCasa = async () => {
      if (tipo === "transferencia") {
        setCargandoInstancias(true);
        try {
          const data = await getCasaCuentasBancarias();
          if (!activo) return;
          setCuentasCasa(filtrarActivos(data));
        } catch (error) {
          console.error(error);
          toast.error("No se pudieron cargar las cuentas bancarias de la casa");
        } finally {
          if (activo) {
            setCargandoInstancias(false);
          }
        }
      } else if (tipo === "billetera") {
        setCargandoInstancias(true);
        try {
          const data = await getCasaBilleterasDigitales();
          if (!activo) return;
          setBilleterasCasa(filtrarActivos(data));
        } catch (error) {
          console.error(error);
          toast.error("No se pudieron cargar las billeteras de la casa");
        } finally {
          if (activo) {
            setCargandoInstancias(false);
          }
        }
      } else {
        setCuentasCasa([]);
        setBilleterasCasa([]);
        setCargandoInstancias(false);
      }
    };

    cargarInstanciasCasa();
    return () => {
      activo = false;
    };
  }, [tipo]);

  const titulo = useMemo(() => {
    switch (tipo) {
      case "transferencia":
        return "Pago por transferencia bancaria";
      case "billetera":
        return "Pago con billetera digital";
      case "tarjeta":
        return "Pago con tarjeta";
      default:
        return "Pago";
    }
  }, [tipo]);

  const renderDetalleMetodo = () => {
    if (tipo === "transferencia") {
      if (cargandoInstancias) {
        return (
          <p className="text-sm text-gray-600">Cargando cuentas bancarias...</p>
        );
      }
      if (cuentasCasa.length === 0) {
        return (
          <p className="text-sm text-gray-600">
            No hay cuentas bancarias activas configuradas para la casa.
          </p>
        );
      }
      return (
        <div className="space-y-3">
          {cuentasCasa.map((cuenta) => (
            <div
              key={cuenta.id}
              className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm"
            >
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Banco:</span>{" "}
                {cuenta.banco_nombre ?? "No especificado"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">
                  Número de cuenta:
                </span>{" "}
                {cuenta.numero_cuenta
                  ? `**** ${cuenta.numero_cuenta.slice(-4)}`
                  : "No disponible"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Titular:</span>{" "}
                {cuenta.titular ?? "No especificado"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">CBU/ CVU:</span>{" "}
                {cuenta.cbu_cvu ?? "No especificado"}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (tipo === "billetera") {
      if (cargandoInstancias) {
        return (
          <p className="text-sm text-gray-600">
            Cargando billeteras digitales...
          </p>
        );
      }
      if (billeterasCasa.length === 0) {
        return (
          <p className="text-sm text-gray-600">
            No hay billeteras digitales activas configuradas para la casa.
          </p>
        );
      }
      return (
        <div className="space-y-3">
          {billeterasCasa.map((billetera) => (
            <div
              key={billetera.id}
              className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm"
            >
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Plataforma:</span>{" "}
                {billetera.plataforma_nombre ?? "No especificado"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Usuario:</span>{" "}
                {billetera.usuario_id ??
                  billetera.alias_billetera ??
                  "No disponible"}
              </p>
              {billetera.email && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Email:</span>{" "}
                  {billetera.email}
                </p>
              )}
              {billetera.telefono && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Teléfono:</span>{" "}
                  {billetera.telefono}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    const tarjeta = detalleClienteSeleccionado as Tarjeta | null;
    if (!tarjeta) {
      return (
        <p className="text-sm text-gray-600">
          No se encontró la información de la tarjeta seleccionada.
        </p>
      );
    }
    return (
      <div className="rounded-lg border border-gray-200 p-5 bg-white shadow-sm space-y-2">
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Marca:</span>{" "}
          {tarjeta.marca_nombre ?? tarjeta.brand ?? "N/D"}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Terminación:</span>{" "}
          {tarjeta.last4 ? `**** ${tarjeta.last4}` : tarjeta.payment_method_id}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Titular:</span>{" "}
          {tarjeta.titular ?? "No especificado"}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Vencimiento:</span>{" "}
          {tarjeta.exp_month && tarjeta.exp_year
            ? `${tarjeta.exp_month}/${tarjeta.exp_year}`
            : "No disponible"}
        </p>
      </div>
    );
  };

  const descripcionMetodo = useMemo(() => {
    switch (tipo) {
      case "transferencia":
        return "Utiliza los datos de las cuentas bancarias de la casa para realizar la transferencia.";
      case "billetera":
        return "Utiliza las billeteras digitales disponibles para completar el pago.";
      case "tarjeta":
        return "Confirma el pago utilizando la tarjeta seleccionada.";
      default:
        return "";
    }
  }, [tipo]);

  return (
    <div className="space-y-6 select-none">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{titulo}</h3>
        <p className="text-sm text-gray-600">{descripcionMetodo}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <p className="text-sm text-gray-600 mb-1">Monto a pagar</p>
        <p className="text-2xl font-semibold text-gray-900">
          {formatNumber(montoOrigen, 2)} {divisaOrigen}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Detalles</h4>
        {renderDetalleMetodo()}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancelar}
          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          disabled={pagando}
        >
          Cancelar
        </button>
        <button
          onClick={onPagar}
          disabled={pagando || cargandoInstancias}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            pagando || cargandoInstancias
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
        >
          {pagando ? "Procesando..." : "Pagar"}
        </button>
      </div>
    </div>
  );
}
