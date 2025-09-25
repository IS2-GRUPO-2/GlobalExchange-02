import { useState, useEffect } from "react";
import { type Divisa } from "../types/Divisa";
import { getDivisasConTasa } from "../services/divisaService";

interface EtapaSeleccionDivisasProps {
  divisaOrigen: string;
  divisaDestino: string;
  monto: number;
  onDivisaOrigenChange: (divisa: string) => void;
  onDivisaDestinoChange: (divisa: string) => void;
  onMontoChange: (monto: number) => void;
  onAvanzar: () => void;
}

export default function EtapaSeleccionDivisas({
  divisaOrigen,
  divisaDestino,
  monto,
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

  const puedeAvanzar = divisaOrigen && divisaDestino && divisaOrigen !== divisaDestino && monto > 0;

  // Obtener información de la divisa origen para mostrar el código
  const divisaOrigenInfo = divisas.find(d => d.id?.toString() === divisaOrigen);
  const codigoDivisaOrigen = divisaOrigenInfo?.código || "";

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
        <div className="flex-1">
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

        <div className="flex-1">
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
          Monto a operar{codigoDivisaOrigen && ` (${codigoDivisaOrigen})`}
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
        {codigoDivisaOrigen && (
          <div className="mt-2">
            <span className="text-lg font-medium text-gray-500 select-none">
              {codigoDivisaOrigen}
            </span>
          </div>
        )}
      </div>

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