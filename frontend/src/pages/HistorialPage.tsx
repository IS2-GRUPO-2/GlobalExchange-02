import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { Cliente } from "../features/clientes/types/Cliente";
import { useAuth } from "../context/useAuth";
import { getClienteActual } from "../services/usuarioService";
import { getHistorialTransacciones } from "../services/clienteService";
import type { TransaccionDetalle } from "../types/Transaccion";
import { formatNumberDecimals } from "../utils/format";

const HistorialPage = () => {
  const [clienteActual, setClienteActual] = useState<Cliente | null>();
  const [transacciones, setTransacciones] = useState<TransaccionDetalle[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const handleClienteChangeEvent = (event: CustomEvent) => {
      const { cliente } = event.detail;
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
  }, []);

  const fetchHistorial = async () => {
    if (!clienteActual) return;
    console.log("fetchHistorial llamado");
    try {
      const res = await getHistorialTransacciones(clienteActual?.idCliente!);
      setTransacciones(res.data);
    } catch (err) {
      toast.error("Error cargando transacciones");
    }
  };

  const handleClienteChange = (nuevoCliente: Cliente | null) => {
    setClienteActual(nuevoCliente);

    if (!nuevoCliente) {
      toast.error("No tienes un cliente asignado. Contacta a soporte.");
    }
  };

  useEffect(() => {
    const fetchClienteActual = async () => {
      try {
        const res = await getClienteActual(user!.id);
        const { clienteActual } = res.data;

        handleClienteChange(clienteActual);
      } catch (err) {
        console.error("Error obteniendo cliente actual", err);
      }
    };
    fetchClienteActual();
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [clienteActual]);

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
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
                <td>{transaccion.estado.toUpperCase()}</td>
                <td>
                  {transaccion.operador_detalle.first_name}{" "}
                  {transaccion.operador_detalle.last_name}
                </td>
                <td>{transaccion.metodo_financiero_detalle.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialPage;
