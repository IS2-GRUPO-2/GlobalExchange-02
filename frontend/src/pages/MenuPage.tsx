import SimulacionPublica from "../components/SimulacionPublica";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CotizacionesTabla from "../components/CotizacionesTabla";

const mockData = [
  { date: "2025-01", value: 8000 },
  { date: "2025-02", value: 8100 },
  { date: "2025-03", value: 7900 },
  { date: "2025-04", value: 7800 },
  { date: "2025-05", value: 7950 },
  { date: "2025-06", value: 8050 },
];

export default function MainMenuPage() {
  const [guarani, setGuarani] = useState(0);
  const [euro, setEuro] = useState(0);
  const exchangeRate = 8000; // 1 EUR = 8000 PYG

  const handleConvert = () => {
    setEuro(guarani / exchangeRate);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <SimulacionPublica />
        <CotizacionesTabla />

        {/* Conversión */}
        <section id="convert" className="p-8 flex flex-col items-center">
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Conversión de Guaraní a Euro
            </h2>
            <div className="space-y-4">
              <input
                type="number"
                value={guarani}
                onChange={(e) => setGuarani(Number(e.target.value))}
                placeholder="Monto en Guaraní"
                className="w-full p-2 border rounded-lg"
              />
              <button
                onClick={handleConvert}
                className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Convertir
              </button>
              <p className="text-lg font-semibold text-gray-700">
                {euro.toFixed(2)} €
              </p>
            </div>
          </div>
        </section>

        {/* Historial */}
        <section id="chart" className="p-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
            Historial de la divisa (PYG/EUR)
          </h2>
          <div className="w-full h-80 bg-white p-4 rounded-xl shadow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
