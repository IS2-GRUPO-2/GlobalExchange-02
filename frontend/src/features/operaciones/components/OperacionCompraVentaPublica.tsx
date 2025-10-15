import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { operacionPublica, getOpPerspectivaCasa } from "../services/operacionService";
import { getMetodosFinancierosPorOperacion } from "../../metodos_financieros/services/metodoFinancieroService";
import { type CalcularOperacionResponse } from "../types/Operacion";
import { type Divisa } from "../../divisas/types/Divisa";
import { type MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";
import { getDivisasConTasa } from "../../divisas/services/divisaService";
import { formatInputNumber, unformatInputNumber, formatNumber } from "../utils/formatNumber";

type EtapaActual = 1 | 2 | 3;

export default function OperacionCompraVentaPublica() {
  // Estado de navegación
  const [etapaActual, setEtapaActual] = useState<EtapaActual>(1);

  // Estados de datos de la operación
  const [divisaOrigen, setDivisaOrigen] = useState<string>("");
  const [divisaDestino, setDivisaDestino] = useState<string>("");
  const [monto, setMonto] = useState<number>(0);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>("");

  // Estados para divisas y métodos
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [divisaBase, setDivisaBase] = useState<Divisa | null>(null);
  
  // Estado para operación desde perspectiva de la casa
  const [opPerspectivaCasa, setOpPerspectivaCasa] = useState<"compra" | "venta" | null>(null);
  
  // Estado para el resultado
  const [resultado, setResultado] = useState<CalcularOperacionResponse | null>(null);

  // Cargar divisas al inicio
  useEffect(() => {
    const fetchDivisas = async () => {
      try {
        const data = await getDivisasConTasa({});
        setDivisas(data.results);

        const base = data.results.find((d: Divisa) => d.es_base);
        if (base) setDivisaBase(base);
      } catch (err) {
        console.error("Error cargando divisas con tasa", err);
        toast.error("Error al cargar las divisas disponibles");
      }
    };
    fetchDivisas();
  }, []);

  // Función para resetear la operación completa
  const resetOperacion = () => {
    setEtapaActual(1);
    setDivisaOrigen("");
    setDivisaDestino("");
    setMonto(0);
    setMetodoSeleccionado("");
    setOpPerspectivaCasa(null);
    setResultado(null);
  };

  // ========== FUNCIONES DE NAVEGACIÓN ==========

  // Navegación Etapa 1 -> 2
  const avanzarEtapa2 = async () => {
    if (!divisaOrigen || !divisaDestino || monto <= 0) {
      toast.error("Completa todos los campos");
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

  // Navegación Etapa 2 -> 3 (calcular simulación)
  const avanzarEtapa3 = async () => {
    if (!metodoSeleccionado) {
      toast.error("Debes seleccionar un método");
      return;
    }

    try {
      const res = await operacionPublica({
        divisa_origen: Number(divisaOrigen),
        divisa_destino: Number(divisaDestino),
        monto_origen: monto,
        op_perspectiva_casa: opPerspectivaCasa!,
        metodo_id: Number(metodoSeleccionado),
      });
      setResultado(res);
      setEtapaActual(3);
    } catch (error: any) {
      toast.error(error.message || "Error al calcular la operación");
    }
  };

  // Navegación retroceder desde etapa 2 a 1
  const retrocederEtapa1 = () => {
    setEtapaActual(1);
    setMetodoSeleccionado("");
    setOpPerspectivaCasa(null);
  };

//   // Navegación retroceder desde etapa 3 a 2
//   const retrocederEtapa2 = () => {
//     setEtapaActual(2);
//     setResultado(null);
//   };

  return (
    <section className="flex flex-col items-center select-none">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 transition-all duration-500 ease-in-out min-h-[425px]">
        
        {/* ETAPA 1: Selección de Divisas y Monto */}
        {etapaActual === 1 && (
          <EtapaSeleccionDivisasPublica
            divisas={divisas}
            divisaBase={divisaBase}
            divisaOrigen={divisaOrigen}
            setDivisaOrigen={setDivisaOrigen}
            divisaDestino={divisaDestino}
            setDivisaDestino={setDivisaDestino}
            monto={monto}
            setMonto={setMonto}
            onContinuar={avanzarEtapa2}
          />
        )}

        {/* ETAPA 2: Selección de Método Financiero */}
        {etapaActual === 2 && opPerspectivaCasa && (
          <EtapaSeleccionMetodoPublica
            opPerspectivaCasa={opPerspectivaCasa}
            metodoSeleccionado={metodoSeleccionado}
            setMetodoSeleccionado={setMetodoSeleccionado}
            onRetroceder={retrocederEtapa1}
            onContinuar={avanzarEtapa3}
          />
        )}

        {/* ETAPA 3: Resultado */}
        {etapaActual === 3 && resultado && (
          <EtapaResultadoPublica
            resultado={resultado}
            opPerspectivaCasa={opPerspectivaCasa!}
            onNuevaOperacion={resetOperacion}
          />
        )}

      </div>
    </section>
  );
}

// ========== COMPONENTES DE ETAPAS ==========

interface EtapaSeleccionDivisasPublicaProps {
  divisas: Divisa[];
  divisaBase: Divisa | null;
  divisaOrigen: string;
  setDivisaOrigen: (valor: string) => void;
  divisaDestino: string;
  setDivisaDestino: (valor: string) => void;
  monto: number;
  setMonto: (valor: number) => void;
  onContinuar: () => void;
}

function EtapaSeleccionDivisasPublica({
  divisas,
  divisaBase,
  divisaOrigen,
  setDivisaOrigen,
  divisaDestino,
  setDivisaDestino,
  monto,
  setMonto,
  onContinuar
}: EtapaSeleccionDivisasPublicaProps) {
  // Estado para el input formateado
  const [montoDisplay, setMontoDisplay] = useState<string>("");

  // Sincronizar monto con display formateado cuando cambia externamente
  useEffect(() => {
    if (monto === 0) {
      setMontoDisplay("");
    } else if (monto > 0) {
      setMontoDisplay(formatInputNumber(monto.toString()));
    }
  }, [monto]);

  const handleSwapDivisas = () => {
    const temp = divisaOrigen;
    setDivisaOrigen(divisaDestino);
    setDivisaDestino(temp);
  };

  const puedeAvanzar = divisaOrigen && divisaDestino && monto > 0;

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Simulación de Operación
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona las divisas y el monto para simular tu operación
        </p>
      </div>

      {/* Divisas Origen/Destino */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            De
          </label>
          <select
            value={divisaOrigen}
            onChange={(e) => {
              setDivisaOrigen(e.target.value);
              
              const origen = divisas.find((d) => d.id?.toString() === e.target.value);
              const destino = divisas.find((d) => d.id?.toString() === divisaDestino);
              if (origen && origen.es_base && divisaBase && destino?.es_base) {
                setDivisaDestino("");
              }
            }}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Seleccionar...</option>
            {(() => {
              // Si en destino hay extranjera, limitar origen solo a base
              const destino = divisas.find((d) => d.id?.toString() === divisaDestino);
              if (destino && !destino.es_base && divisaBase) {
                return (
                  <option key={divisaBase.id} value={divisaBase.id}>
                    {divisaBase.codigo} - {divisaBase.nombre}
                  </option>
                );
              }
              // Caso normal
              return divisas
                .filter((divisa) => divisa.id?.toString() !== divisaDestino)
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
          onClick={handleSwapDivisas}
          className="bg-gray-700 text-white rounded-full p-2 hover:bg-gray-900 self-end transition-colors"
          disabled={!divisaOrigen || !divisaDestino}
        >
          ⇆
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            A
          </label>
          <select
            value={divisaDestino}
            onChange={(e) => {
              setDivisaDestino(e.target.value);
            }}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Seleccionar...</option>
            {(() => {
              // Si en origen hay extranjera, limitar destino solo a base
              const origen = divisas.find((d) => d.id?.toString() === divisaOrigen);
              if (origen && !origen.es_base && divisaBase) {
                return (
                  <option key={divisaBase.id} value={divisaBase.id}>
                    {divisaBase.codigo} - {divisaBase.nombre}
                  </option>
                );
              }
              // Caso normal
              return divisas
                .filter((divisa) => divisa.id?.toString() !== divisaOrigen)
                .map((divisa) => (
                  <option key={divisa.id} value={divisa.id}>
                    {divisa.codigo} - {divisa.nombre}
                  </option>
                ));
            })()}
          </select>
        </div>
      </div>

      {/* Input monto */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
        <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
          Cantidad en {divisas.find((d) => d.id?.toString() === divisaOrigen)?.nombre || "Divisa origen"}
        </label>
        <input
          id="monto"
          type="text"
          value={montoDisplay}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Desformatear para obtener el número puro
            const unformatted = unformatInputNumber(inputValue);
            
            // Validar que sea un número válido
            if (unformatted === "" || /^\d+$/.test(unformatted)) {
              setMontoDisplay(formatInputNumber(unformatted));
              setMonto(unformatted === "" ? 0 : Number(unformatted));
            }
          }}
          onKeyDown={(e) => {
            // Prevenir caracteres no deseados
            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "," || e.key === "+") {
              e.preventDefault();
            }
          }}
          placeholder="Ingrese el monto"
          className="w-full text-2xl font-semibold text-gray-900 text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md py-2"
        />
        <span className="text-sm text-gray-500">
          {divisas.find((d) => d.id?.toString() === divisaOrigen)?.codigo || ""}
        </span>
      </div>

      {/* Botón continuar */}
      <div className="flex justify-center">
        <button
          onClick={onContinuar}
          disabled={!puedeAvanzar}
          className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
            puedeAvanzar
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

interface EtapaSeleccionMetodoPublicaProps {
  opPerspectivaCasa: "compra" | "venta";
  metodoSeleccionado: string;
  setMetodoSeleccionado: (valor: string) => void;
  onRetroceder: () => void;
  onContinuar: () => void;
}

function EtapaSeleccionMetodoPublica({
  opPerspectivaCasa,
  metodoSeleccionado,
  setMetodoSeleccionado,
  onRetroceder,
  onContinuar
}: EtapaSeleccionMetodoPublicaProps) {
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [loading, setLoading] = useState(false);

  // Inferir operación desde perspectiva del cliente
  const getOperacionCliente = (opCasa: "compra" | "venta"): "compra" | "venta" => {
    return opCasa === "compra" ? "venta" : "compra";
  };

  // Cargar métodos disponibles
  useEffect(() => {
    const fetchMetodos = async () => {
      setLoading(true);
      try {
        const metodosData = await getMetodosFinancierosPorOperacion(opPerspectivaCasa);
        setMetodos(metodosData);
        
        // Seleccionar automáticamente el primer método
        if (metodosData.length > 0) {
          setMetodoSeleccionado(metodosData[0].id!.toString());
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar métodos disponibles");
      } finally {
        setLoading(false);
      }
    };

    fetchMetodos();
  }, [opPerspectivaCasa, setMetodoSeleccionado]);

  const operacionCliente = getOperacionCliente(opPerspectivaCasa);
  
  const getTituloMetodo = () => {
    return operacionCliente === "compra" ? "Método de Pago" : "Método de Cobro";
  };

  const getDescripcionMetodo = () => {
    return operacionCliente === "compra" 
      ? "Selecciona cómo vas a pagar por la divisa que quieres comprar"
      : "Selecciona cómo quieres recibir el pago por la divisa que vas a vender";
  };

  const puedeAvanzar = metodoSeleccionado !== "";

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getTituloMetodo()}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {getDescripcionMetodo()}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : metodos.length > 0 ? (
        <div className="space-y-3">
          {metodos.map((metodo) => (
            <div
              key={metodo.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                metodoSeleccionado === metodo.id!.toString()
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setMetodoSeleccionado(metodo.id!.toString())}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {metodo.nombre_display || metodo.nombre}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {operacionCliente === "compra" 
                      ? `Comisión: ${metodo.comision_pago_porcentaje}%`
                      : `Comisión: ${metodo.comision_cobro_porcentaje}%`
                    }
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  metodoSeleccionado === metodo.id!.toString()
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}>
                  {metodoSeleccionado === metodo.id!.toString() && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay métodos disponibles para esta operación</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onRetroceder}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Atrás
        </button>
        <button
          onClick={onContinuar}
          disabled={!puedeAvanzar}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            puedeAvanzar
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

interface EtapaResultadoPublicaProps {
  resultado: CalcularOperacionResponse;
  opPerspectivaCasa: "compra" | "venta";
  onNuevaOperacion: () => void;
}

function EtapaResultadoPublica({
  resultado,
  opPerspectivaCasa,
  onNuevaOperacion
}: EtapaResultadoPublicaProps) {
  
  // Función para inferir operación desde perspectiva del cliente
  const getOperacionCliente = (opCasa: "compra" | "venta"): "compra" | "venta" => {
    return opCasa === "compra" ? "venta" : "compra";
  };

  const operacionCliente = getOperacionCliente(opPerspectivaCasa);

  return (
    <div className="space-y-6 select-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">
          Resultado de tu Simulación
        </h2>
      </div>

      {/* Conversión principal con etiquetas */}
      <div className="relative overflow-hidden rounded-lg border-2 border-zinc-300 bg-gradient-to-br from-zinc-50 to-white p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Monto Origen */}
          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {operacionCliente === "compra" ? "Entrega" : "Entrega"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(resultado.monto_origen, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {resultado.divisa_origen}
            </div>
          </div>
          
          {/* Flecha separadora */}
          <div className="flex flex-col items-center">
            <div className="text-4xl text-zinc-400">→</div>
          </div>
          
          {/* Monto Destino */}
          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {operacionCliente === "compra" ? "Recibe" : "Recibe"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(resultado.monto_destino, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {resultado.divisa_destino}
            </div>
          </div>
        </div>
      </div>

      {/* Detalles de la operación */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h4 className="font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
          Detalles de la Operación
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">
              {opPerspectivaCasa === "venta" ? "Método de Pago:" : "Método de Cobro:"}
            </span>
            <p className="text-zinc-900 font-medium">{resultado.parametros.nombre_metodo}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">Comisión método:</span>
            <p className="text-zinc-900 font-medium">
              {formatNumber(resultado.parametros.comision_metodo ?? 0, 2)}%
            </p>
          </div>
          
          <div className="pt-2 border-t border-zinc-200">
            <span className="text-sm font-medium text-zinc-500 block mb-1">Tasa final aplicada:</span>
            <p className="text-zinc-900 text-xl font-bold">
              {formatNumber(resultado.tc_final, 4)}
            </p>
          </div>
        </div>
      </div>

      {/* Botón nueva operación */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNuevaOperacion}
          className="w-full px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
        >
          Realizar Nueva Operación
        </button>
      </div>
    </div>
  );
}