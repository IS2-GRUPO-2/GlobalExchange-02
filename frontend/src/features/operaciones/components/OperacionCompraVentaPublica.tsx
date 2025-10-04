import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { operacionPublica, getOpPerspectivaCasa } from "../services/operacionService";
import { getMetodosFinancierosPorOperacion } from "../../financiero/services/metodoFinancieroService";
import { type CalcularOperacionResponse } from "../types/Operacion";
import { type Divisa } from "../../../types/Divisa";
import { type MetodoFinanciero } from "../../financiero/types/MetodoFinanciero";
import { getDivisasConTasa } from "../../../services/divisaService";

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
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  
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
    <section className="flex flex-col items-center p-6 select-none">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        
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
          {divisas.find((d) => d.id?.toString() === divisaOrigen)?.codigo || ""}
        </span>
      </div>

      {/* Botón continuar */}
      <div className="flex justify-center">
        <button
          onClick={onContinuar}
          disabled={!puedeAvanzar}
          className={`w-full px-6 py-2 rounded-md font-medium transition-colors ${
            puedeAvanzar
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={onContinuar}
          disabled={!puedeAvanzar}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            puedeAvanzar
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Resultado de tu Simulación
        </h3>
        <p className="text-sm text-gray-600">
          Aquí tienes los detalles de tu operación
        </p>
      </div>

      {/* Tipo de operación */}
      <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-4 text-center font-semibold text-lg">
        Operación: {operacionCliente.toUpperCase()}
      </div>

      {/* Operación visual */}
      <div className="text-center text-2xl font-bold text-gray-900 py-4 bg-green-50 rounded-lg border border-green-200">
        {resultado.monto_origen.toLocaleString()} {resultado.divisa_origen}
        <span className="mx-4 text-green-600">→</span>
        {resultado.monto_destino.toLocaleString()} {resultado.divisa_destino}
      </div>

      {/* Detalles de la operación */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800 border-b pb-2">Detalles de la Operación</h4>
        
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">
              {opPerspectivaCasa === "venta" ? "Método de Pago:" : "Método de Cobro:"}
            </span>
            <span className="text-gray-900">{resultado.parametros.nombre_metodo}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Comisión método:</span>
            <span className="text-gray-900">{resultado.parametros.comision_metodo}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Tasa final aplicada:</span>
            <span className="text-gray-900">{resultado.tc_final}</span>
          </div>
        </div>
      </div>

      {/* Botón nueva operación */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNuevaOperacion}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Realizar Nueva Operación
        </button>
      </div>
    </div>
  );
}