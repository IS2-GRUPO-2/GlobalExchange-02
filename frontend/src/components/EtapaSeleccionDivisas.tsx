import { useState, useEffect } from "react";
import { type Divisa } from "../types/Divisa";
import { getDivisasConTasa } from "../services/divisaService";
import { toast } from "react-toastify";

interface EtapaSeleccionDivisasProps {
  divisaOrigen: string;
  divisaDestino: string;
  monto: number;
  clienteActual: any; // Agregamos el cliente actual como prop
  onDivisaOrigenChange: (divisa: string) => void;
  onDivisaDestinoChange: (divisa: string) => void;
  onMontoChange: (monto: number) => void;
  onAvanzar: () => void;
}

export default function EtapaSeleccionDivisas({
  divisaOrigen,
  divisaDestino,
  monto,
  clienteActual,
  onDivisaOrigenChange,
  onDivisaDestinoChange,
  onMontoChange,
  onAvanzar
}: EtapaSeleccionDivisasProps) {
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [divisaBase, setDivisaBase] = useState<Divisa | null>(null);

  useEffect(() => {
    const fetchDivisas = async () => {
      try {
        const data = await getDivisasConTasa({});
        setDivisas(data.results);
        const base = data.results.find((d: Divisa) => d.es_base);
        if (base) setDivisaBase(base);
      } catch (err) {
        console.error("Error cargando divisas con tasa", err);
      }
    };
    fetchDivisas();
  }, []);

  const puedeAvanzar = divisaOrigen && divisaDestino && divisaOrigen !== divisaDestino && monto > 0 && clienteActual;

  // Obtener información de la divisa origen para mostrar el código
  const divisaOrigenInfo = divisas.find(d => d.id?.toString() === divisaOrigen);
  const codigoDivisaOrigen = divisaOrigenInfo?.codigo || "";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 select-none">
          Configura tu operación
        </h3>
        <p className="text-sm text-gray-600 select-none">
          Elige las divisas y el monto para tu operación
        </p>
      </div>

      {/* Selección de divisas */}
      <div className="flex items-center space-x-4">
        <div className="w-80">
          <label className="block text-sm font-medium text-gray-700 mb-2 select-none">
            Divisa de origen (Entregas)
          </label>
          <select
            value={divisaOrigen}
            onChange={(e) => {
              onDivisaOrigenChange(e.target.value);
              const origen = divisas.find((d) => d.id?.toString() === e.target.value);
              const destino = divisas.find((d) => d.id?.toString() === divisaDestino);
              if (origen && origen.es_base && divisaBase && destino?.es_base) {
                onDivisaDestinoChange("");
              }
            }}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-zinc-700 focus:outline-none"
          >
            <option value="">Seleccionar divisa...</option>
            {(() => {
              const destino = divisas.find((d) => d.id?.toString() === divisaDestino);
              if (destino && !destino.es_base && divisaBase) {
                return (
                  <option key={divisaBase.id} value={divisaBase.id}>
                    {divisaBase.codigo} - {divisaBase.nombre}
                  </option>
                );
              }
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
          onClick={() => {
            const temp = divisaOrigen;
            onDivisaOrigenChange(divisaDestino);
            onDivisaDestinoChange(temp);
          }}
          className="bg-gray-700 text-white rounded-full p-3 hover:bg-gray-900 self-end mb-0 select-none"
          disabled={!divisaOrigen || !divisaDestino}
        >
          ⇆
        </button>

        <div className="w-80">
          <label className="block text-sm font-medium text-gray-700 mb-2 select-none">
            Divisa de destino (Recibes)
          </label>
          <select
            value={divisaDestino}
            onChange={(e) => onDivisaDestinoChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-zinc-700 focus:outline-none"
          >
            <option value="">Seleccionar divisa...</option>
            {(() => {
              const origen = divisas.find((d) => d.id?.toString() === divisaOrigen);
              if (origen && !origen.es_base && divisaBase) {
                return (
                  <option key={divisaBase.id} value={divisaBase.id}>
                    {divisaBase.codigo} - {divisaBase.nombre}
                  </option>
                );
              }
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
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
        <label
          htmlFor="monto"
          className="block text-sm font-medium text-gray-700 mb-3 select-none"
        >
          Monto que vas a entregar{codigoDivisaOrigen && ` (${codigoDivisaOrigen})`}
        </label>
        <input
          id="monto"
          type="number"
          min={0}
          value={monto === 0 ? "" : monto}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 0 || e.target.value === "") {
              onMontoChange(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          placeholder="Ingrese el monto"
          className="w-full text-3xl font-semibold text-gray-900 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {codigoDivisaOrigen && monto > 0 && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 mb-1 select-none">Monto formateado:</div>
            <span className="text-lg font-bold text-blue-800 select-none">
              {monto.toLocaleString('es-PY')} {codigoDivisaOrigen}
            </span>
          </div>
        )}
      </div>

      {/* Alerta si no hay cliente asignado */}
      {!clienteActual && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Cliente requerido
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Para continuar con la simulación necesitas tener un cliente asignado. 
                  Selecciona uno en el menú superior derecho o contacta a soporte si no tienes clientes asignados.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón avanzar */}
      <div className="flex justify-end">
        <button
          onClick={onAvanzar}
          disabled={!puedeAvanzar}
          className={`px-8 py-3 rounded-lg font-medium select-none ${
            puedeAvanzar
              ? 'bg-zinc-900 text-white hover:bg-zinc-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}