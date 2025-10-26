import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getHistorialTransacciones } from "../features/clientes/services/clienteService";
import type { TransaccionDetalle } from "../features/operaciones/types/Transaccion";
import { formatNumberDecimals } from "../utils/format";
import { useClientStore } from "../hooks/useClientStore";
import { estadosTransaccion } from "../types/EstadosTransaccion";
import { tipoMetodoDisplay } from "../features/metodos_financieros/types/MetodoFinanciero";
import { downloadFacturaPDF } from "../features/operaciones/services/transaccionService";
import { FileText } from "lucide-react";
const getEstadoConfig = (estado: string) => {
  return (
    estadosTransaccion.find((e) => e.estado === estado) || estadosTransaccion[0]
  );
};

const getTipoDisplay = (tipo: string) => {
  return tipoMetodoDisplay.find((t) => t.tipo === tipo) || tipoMetodoDisplay[0];
};

const HistorialPage = () => {
  const [transacciones, setTransacciones] = useState<TransaccionDetalle[]>([]);
  const { selectedClient } = useClientStore();

  const fetchHistorial = async () => {
    if (!selectedClient) return;
    console.log("fetchHistorial llamado");
    try {
      const res = await getHistorialTransacciones(selectedClient.id!);
      setTransacciones(res.data);
    } catch (err) {
      toast.error("Error cargando transacciones");
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [selectedClient]);

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Historial de Transacciones
        </h1>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha de inicio</th>
              <th>Operación</th>
              <th>Tasa</th>
              <th>Monto origen</th>
              <th>Monto destino</th>
              <th>Tauser</th>
              <th>Estado</th>
              <th>Operador</th>
              <th>Método financiero</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transacciones.map((transaccion: TransaccionDetalle) => (
              <tr key={transaccion.id}>
                <td>
                  {new Date(transaccion.fecha_inicio).toLocaleString("es-PY", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>

                <td>{transaccion.operacion.toUpperCase()}</td>
                <td>{formatNumberDecimals(transaccion.tasa_aplicada, 2)}PYG</td>
                <td>
                  {formatNumberDecimals(transaccion.monto_origen, 2)}
                  {transaccion.divisa_origen_detalle.codigo}
                </td>
                <td>
                  {formatNumberDecimals(transaccion.monto_destino, 2)}
                  {transaccion.divisa_destino_detalle.codigo}
                </td>
                <td>{transaccion.tauser_detalle.codigo}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getEstadoConfig(transaccion.estado).bgColor
                    } ${getEstadoConfig(transaccion.estado).textColor}`}
                  >
                    {getEstadoConfig(transaccion.estado).read}
                  </span>
                </td>
                <td>
                  {transaccion.id_user_detalle.first_name}{" "}
                  {transaccion.id_user_detalle.last_name}
                </td>
                <td>
                  {
                    getTipoDisplay(transaccion.metodo_financiero_detalle.nombre)
                      .display
                  }
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    {transaccion.estado === "en_proceso" && (
                      <button
                        onClick={() =>
                          downloadFacturaPDF(transaccion.id).catch(() =>
                            toast.error("No se pudo descargar la factura")
                          )
                        }
                        className="text-sm text-gray-500 hover:text-blue-600 font-medium"
                        title="Descargar factura"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialPage;
