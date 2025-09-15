import { useState, useEffect } from "react";
import {
  simularConversion,
  getMetodosDisponibles,
} from "../services/conversionService";
import { type SimulacionResponse } from "../types/Conversion";
import { getUserClients } from "../services/usuarioService";
import { type Cliente } from "../types/Cliente";
import { type MetodoFinanciero } from "../types/MetodoFinanciero";
import { getDivisasConTasa, getDivisas } from "../services/divisaService";
import { type Divisa } from "../types/Divisa";
import type { DecodedToken } from "../types/User";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export default function SimulacionConversion() {
  const [monto, setMonto] = useState<number>(0);
  const [resultado, setResultado] = useState<SimulacionResponse | null>(null);

  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");

  // Divisas
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [divisaBase, setDivisaBase] = useState<Divisa | null>(null);
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");

  // Métodos
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>("");

  // Operación inferida desde backend
  const [operacionCasa, setOperacionCasa] = useState<"compra" | "venta" | null>(
    null
  );

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
        const data = await getDivisasConTasa({});
        // const data = await getDivisas({})
        setDivisas(data.results);

        const base = data.results.find((d: Divisa) => d.es_base);
        if (base) setDivisaBase(base);
      } catch (err) {
        console.error("Error cargando divisas con tasa", err);
      }
    };
    fetchDivisas();
  }, []);

  // Cargar métodos al cambiar divisa origen/destino
  useEffect(() => {
    const fetchMetodos = async () => {
      if (!divisaOrigen || !divisaDestino) return;
      try {
        const data = await getMetodosDisponibles(
          Number(divisaOrigen),
          Number(divisaDestino)
        );
        setMetodos(data.metodos);
        setOperacionCasa(data.operacion_casa);
        if (data.metodos.length > 0) {
          setMetodoSeleccionado(data.metodos[0].id?.toString() ?? "");
        }
      } catch (err) {
        console.error("Error cargando métodos disponibles", err);
      }
    };
    fetchMetodos();
  }, [divisaOrigen, divisaDestino]);

  const handleSimular = async () => {
    if (
      !clienteSeleccionado ||
      !divisaOrigen ||
      !divisaDestino ||
      !metodoSeleccionado
    ) {
      toast.error("Debes seleccionar cliente, divisas y método");
      return;
    }
    try {
      const res = await simularConversion({
        cliente_id: clienteSeleccionado,
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto,
        metodo_id: Number(metodoSeleccionado),
      });
      setResultado(res);
    } catch (err) {
      console.error("Error en simulación", err);
    }
  };

  return (
    <section id="convert" className="flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {/* Encabezado */}
        <div className="bg-zinc-900 text-white text-center py-3 rounded-t-xl">
          <h2 className="text-lg font-semibold">Simulación de Conversión</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Select Cliente */}
          <div className="flex flex-col">
            <label
              htmlFor="cliente"
              className="mb-1 text-sm font-medium text-gray-700"
            >
              Cliente
            </label>
            <select
              id="cliente"
              value={clienteSeleccionado}
              onChange={(e) => {
                setClienteSeleccionado(e.target.value);
                setResultado(null);
              }}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-700 focus:outline-none text-sm"
            >
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Divisas Origen/Destino */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">De</label>
              <select
                value={divisaOrigen}
                onChange={(e) => {
                  setDivisaOrigen(e.target.value);
                  setResultado(null);

                  const origen = divisas.find((d) => d.id.toString() === e.target.value);
                  if (origen && origen.es_base && divisaBase && divisaDestino.es_base) {
                    setDivisaDestino("");
                  }
                }}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-700 focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {(() => {
                  // si en destino hay extranjera, limitar origen solo a base
                  const destino = divisas.find((d) => d.id.toString() === divisaDestino);
                  if (destino && !destino.es_base && divisaBase) {
                    return (
                      <option key={divisaBase.id} value={divisaBase.id}>
                        {divisaBase.codigo} - {divisaBase.nombre}
                      </option>
                    );
                  }
                  // caso normal
                  return divisas
                    .filter((divisa) => divisa.id.toString() !== divisaDestino)
                    .map((divisa) => (
                      <option key={divisa.id} value={divisa.id}>
                        {divisa.codigo} - {divisa.nombre}
                      </option>
                    ));
                })()}
              </select>
            </div>

            {/* Botón swap */}
            <button
              type="button"
              onClick={() => {
                const temp = divisaOrigen;
                setDivisaOrigen(divisaDestino);
                setDivisaDestino(temp);
                setResultado(null);
              }}
              className="bg-gray-700 text-white rounded-full p-2 hover:bg-gray-900 self-end"
            >
              ⇆
            </button>

            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">A</label>
              <select
                value={divisaDestino}
                onChange={(e) => {
                  setDivisaDestino(e.target.value);
                  setResultado(null);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-700 focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {(() => {
                  // si en origen hay extranjera, limitar destino solo a base
                  const origen = divisas.find((d) => d.id.toString() === divisaOrigen);
                  if (origen && !origen.es_base && divisaBase) {
                    return (
                      <option key={divisaBase.id} value={divisaBase.id}>
                        {divisaBase.codigo} - {divisaBase.nombre}
                      </option>
                    );
                  }
                  // caso normal
                  return divisas
                    .filter((divisa) => divisa.id.toString() !== divisaOrigen)
                    .map((divisa) => (
                      <option key={divisa.id} value={divisa.id}>
                        {divisa.codigo} - {divisa.nombre}
                      </option>
                    ));
                })()}
              </select>
            </div>
          </div>

          {/* Select Método */}
          <div className="flex flex-col">
            <label
              htmlFor="metodo"
              className="mb-1 text-sm font-medium text-gray-700"
            >
              {operacionCasa === "venta"
                ? "Método de Pago"
                : operacionCasa === "compra"
                ? "Método de Cobro"
                : "Método Financiero"}
            </label>
            <select
              id="metodo"
              value={metodoSeleccionado}
              onChange={(e) => {
                setMetodoSeleccionado(e.target.value);
                setResultado(null);
              }}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-700 focus:outline-none text-sm"
            >
              {metodos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_display ?? m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Input monto vistoso */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
            <label
              htmlFor="monto"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cantidad en{" "}
              {divisas.find((d) => d.id.toString() === divisaOrigen)?.nombre ||
                "Divisa origen"}
            </label>
            <input
              id="monto"
              type="number"
              min={0}
              value={monto === 0 ? "" : monto}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 0 || e.target.value === "") {
                  setMonto(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              placeholder="Ingrese el monto"
              className="w-full text-2xl font-semibold text-gray-900 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-gray-500">
              {divisas.find((d) => d.id.toString() === divisaOrigen)?.codigo ||
                ""}
            </span>
          </div>

          {/* Botón calcular */}
          <button
            onClick={handleSimular}
            className="w-full bg-zinc-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-700"
          >
            Simular
          </button>

          {/* Resultado */}
          {resultado && (
            <div className="mt-6 space-y-4 text-gray-700 border-t pt-4">
              {/* Tipo de operación (cliente) */}
              <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-3 text-center font-semibold text-base">
                Operación: {resultado.operacion_cliente.toUpperCase()}
              </div>

              {/* Conversión realizada */}
              <div className="text-center text-lg font-bold text-gray-900">
                {resultado.monto_origen.toLocaleString()}{" "}
                {resultado.divisa_origen} →{" "}
                {resultado.monto_destino.toLocaleString()}{" "}
                {resultado.divisa_destino}
              </div>

              {/* Detalles */}
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Precio base:</strong>{" "}
                  {resultado.parametros.precio_base}
                </p>
                <p>
                  <strong>Comisión base:</strong>{" "}
                  {resultado.parametros.comision_base}
                </p>
                {"descuento_categoria" in resultado.parametros && (
                  <p>
                    <strong>Descuento categoría:</strong>{" "}
                    {resultado.parametros.descuento_categoria}%
                  </p>
                )}
                <p>
                  <strong>Comisión método:</strong>{" "}
                  {resultado.parametros.comision_metodo}%
                </p>
                <p>
                  <strong>Tasa final:</strong> {resultado.tc_final}
                </p>
                <p>
                  <strong>Método:</strong> {resultado.metodo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
