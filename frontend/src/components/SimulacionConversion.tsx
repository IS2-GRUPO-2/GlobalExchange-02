import { useState, useEffect } from "react";
import { simularConversion } from "../services/conversionService";
import { type SimulacionResponse } from "../types/Conversion";
import { getUserClients } from "../services/usuarioService";
import { type Cliente } from "../types/Cliente";
import { getDivisas } from "../services/divisaService";
import { type Divisa } from "../types/Divisa";
import type { DecodedToken } from "../types/User";
import { jwtDecode } from "jwt-decode";

export default function SimulacionConversion() {
  const [monto, setMonto] = useState<number>(0);
  const [resultado, setResultado] = useState<SimulacionResponse | null>(null);

  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");

  // Divisas
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [divisaSeleccionada, setDivisaSeleccionada] = useState<string>("");

  // Acción desde perspectiva del cliente
  const [accionCliente, setAccionCliente] = useState<"compra" | "venta">("compra");

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userId = jwtDecode<DecodedToken>(token).user_id;
        const res = await getUserClients(Number(userId));
        const data = res.data;
        setClientes(data);
        if (data.length > 0) setClienteSeleccionado(data[0].idCliente);
      } catch (err) {
        console.error("Error cargando clientes", err);
      }
    };
    fetchClientes();
  }, []);

  useEffect(() => {
    const fetchDivisas = async () => {
      try {
        const data = await getDivisas();
        const filtradas = data.results.filter((d) => !d.es_base);
        setDivisas(filtradas);
        if (filtradas.length > 0 && filtradas[0].id) {
          setDivisaSeleccionada(filtradas[0].id.toString());
        }
      } catch (err) {
        console.error("Error cargando divisas", err);
      }
    };
    fetchDivisas();
  }, []);

  const mapOperacionCasa = (accion: "compra" | "venta") => {
    return accion === "compra" ? "venta" : "compra";
  };

  const handleSimular = async () => {
    if (!clienteSeleccionado || !divisaSeleccionada) {
      alert("Debes seleccionar cliente y divisa");
      return;
    }
    try {
      const res = await simularConversion({
        cliente_id: clienteSeleccionado,
        divisa_id: divisaSeleccionada,
        monto,
        metodo_pago: "metalico",
        operacion: mapOperacionCasa(accionCliente),
      });
      setResultado(res);
    } catch (err) {
      console.error("Error en simulación", err);
    }
  };

  return (
    <section id="convert" className="p-8 flex flex-col items-center">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Simulación de Conversión
        </h2>
        <div className="space-y-4">
          {/* Select cliente */}
          <div className="flex flex-col">
            <label htmlFor="cliente" className="mb-1 text-sm font-medium text-gray-700">
              Cliente
            </label>
            <select
              id="cliente"
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Select divisa */}
          <div className="flex flex-col">
            <label htmlFor="divisa" className="mb-1 text-sm font-medium text-gray-700">
              Divisa
            </label>
            <select
              id="divisa"
              value={divisaSeleccionada}
              onChange={(e) => setDivisaSeleccionada(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {divisas.map((divisa) => (
                <option key={divisa.id} value={divisa.id}>
                  {divisa.codigo} - {divisa.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Select acción cliente */}
          <div className="flex flex-col">
            <label htmlFor="accion" className="mb-1 text-sm font-medium text-gray-700">
              Acción
            </label>
            <select
              id="accion"
              value={accionCliente}
              onChange={(e) => setAccionCliente(e.target.value as "compra" | "venta")}
              className="w-full p-2 border rounded-lg"
            >
              <option value="compra">Comprar</option>
              <option value="venta">Vender</option>
            </select>
          </div>

          {/* Input monto */}
          <div className="flex flex-col">
            <label htmlFor="monto" className="mb-1 text-sm font-medium text-gray-700">
              Monto
            </label>
            <input
              id="monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              placeholder={
                accionCliente === "compra"
                  ? "Monto en PYG (cliente compra divisa)"
                  : "Monto en divisa extranjera (cliente vende)"
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleSimular}
            className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Simular
          </button>

          {/* Resultado */}
          {resultado && (
            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>Precio base:</strong> {resultado.parametros.precio_base}
              </p>
              <p>
                <strong>Comisión base:</strong> {resultado.parametros.comision_base}
              </p>
              <p>
                <strong>Descuento categoría:</strong> {resultado.parametros.descuento_categoria} %
              </p>
              <p>
                <strong>Tasa final:</strong> {resultado.tc_final}
              </p>
              <p>
                <strong>Monto destino:</strong> {resultado.monto_destino}{" "}
                {resultado.unidad_destino}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
