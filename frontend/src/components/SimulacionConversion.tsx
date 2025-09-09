import { useState, useEffect } from "react";
import { simularConversion, getMetodosDisponibles } from "../services/conversionService";
import { type SimulacionResponse } from "../types/Conversion";
import { getUserClients } from "../services/usuarioService";
import { type Cliente } from "../types/Cliente";
import { type MetodoFinanciero } from "../types/MetodoFinanciero";
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

  // Métodos
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>("");
  

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
        const data = await getDivisas({ es_base: "false" });
        setDivisas(data.results);
        if (data.results.length > 0 && data.results[0].id) {
          setDivisaSeleccionada(data.results[0].id.toString());
        }
      } catch (err) {
        console.error("Error cargando divisas", err);
      }
    };
    fetchDivisas();
  }, []);

  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const data = await getMetodosDisponibles(mapOperacionCasa(accionCliente));
        setMetodos(data);
        if (data.length > 0) setMetodoSeleccionado(data[0].id?.toString() ?? "");
      } catch (err) {
        console.error("Error cargando métodos disponibles", err);
      }
    };
    fetchMetodos();
  }, [accionCliente]);

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
        metodo_id: metodoSeleccionado,
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
              onChange={(e) => {
                setClienteSeleccionado(e.target.value);
                setResultado(null);
              }}
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
              {accionCliente === "compra" ? "Quiero" : "Tengo"}
            </label>
            <select
              id="divisa"
              value={divisaSeleccionada}
              onChange={(e) => {
                setDivisaSeleccionada(e.target.value);
                setResultado(null);
              }}
              className="w-full p-2 border rounded-lg"
            >
              {divisas.map((divisa) => (
                <option key={divisa.id} value={divisa.id}>
                  {divisa.codigo} - {divisa.nombre}
                </option>
              ))}
            </select>
          </div>

          

          {/* Select de Método*/}
          <div className="flex flex-col">
            <label htmlFor="metodo" className="mb-1 text-sm font-medium text-gray-700">
              Método Financiero
            </label>
            <select
              id="metodo"
              value={metodoSeleccionado}
              onChange={(e) => {
                setMetodoSeleccionado(e.target.value);
                setResultado(null);
              }}
              className="w-full p-2 border rounded-lg"
            >
              {metodos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_display ?? m.nombre}
                </option>
              ))}
            </select>
          </div>


                  
          {/* Input monto */}
          <div className="flex flex-col">
            <label htmlFor="monto" className="mb-1 text-sm font-medium text-gray-700">
              Monto ({accionCliente === "compra" ? "PYG" : divisas.find((d) => d.id.toString() === divisaSeleccionada)?.codigo || ""})
            </label>
            <input
              id="monto"
              type="number"
              min={0}
              value={monto}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMonto(value < 0 ? 0 : value);
              }}
              placeholder={
                accionCliente === "compra"
                  ? "Monto en PYG (cliente compra divisa)"
                  : `Monto en ${divisas.find((d) => d.id.toString() === divisaSeleccionada)?.codigo || "divisa"}`
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>

             {/* Select acción cliente */}
          <div className="flex flex-col">
            <label htmlFor="operacion" className="mb-1 text-sm font-medium text-gray-700">
              Operacion
            </label>
            <select
              id="operacion"
              value={accionCliente}
              onChange={(e) => {
                setAccionCliente(e.target.value as "compra" | "venta");
                setResultado(null);
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="compra">Comprar</option>
              <option value="venta">Vender</option>
            </select>
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
            {/* Texto descriptivo */}
            <p className="font-semibold text-lg text-gray-800">
              {accionCliente === "compra"
                ? `Recibirás ${resultado.monto_destino.toLocaleString()} ${resultado.unidad_destino} a cambio de tus ${resultado.monto_origen.toLocaleString()} PYG`
                : `Recibirás ${resultado.monto_destino.toLocaleString()} PYG a cambio de tus ${resultado.monto_origen.toLocaleString()} ${divisas.find((d) => d.id.toString() === divisaSeleccionada)?.codigo}`}
            </p>

            {/* Conversión detallada */}
            <p>
              <strong>Convertiste:</strong>{" "}
              {resultado.monto_origen.toLocaleString()}{" "}
              {accionCliente === "compra" ? "PYG" : divisas.find((d) => d.id.toString() === divisaSeleccionada)?.codigo}
              {" "}→{" "}
              {resultado.monto_destino.toLocaleString()} {resultado.unidad_destino}
            </p>

            <p><strong>Precio base:</strong> {resultado.parametros.precio_base}</p>
            <p><strong>Comisión base:</strong> {resultado.parametros.comision_base}</p>
            <p><strong>Comisión método:</strong> {resultado.parametros.comision_metodo} %</p>
            <p><strong>Descuento categoría:</strong> {resultado.parametros.descuento_categoria} %</p>
            <p><strong>Tasa final:</strong> {resultado.tc_final}</p>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
