import { useEffect, useState } from "react";
import { getPublicTasas } from "../features/cotizaciones/services/tasaService";
import { toast } from "react-toastify";

type PublicRate = {
  codigo: string;
  nombre: string;
  simbolo: string;
  compra: string | number;
  venta: string | number;
  flag?: string;
};

const formatNumber = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  });
}
  
export default function CotizacionesTabla() {
  const [rates, setRates] = useState<PublicRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await getPublicTasas();
        setRates(data);
      } catch (e) {
        setErr("Error cargando cotizaciones"); // ✅ ahora sí se usa
        toast.error("Error cargando cotizaciones");
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  if (loading) return <p className="text-center">Cargando…</p>;
  if (err) return <p className="text-center text-red-600">{err}</p>;

  return (
    <section id="rates">
      <div className="overflow-x-auto bg-white rounded-xl shadow p-6 w-full">
          <p className="text-base text-gray-500 text-center mb-4">
            Cotizaciones del dia {new Date().toLocaleDateString("es-PY")}
          </p>
        <table className="table-auto text-base w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="px-6 py-3 text-left">Divisa</th>
              <th className="px-6 py-3 text-right">Compra</th>
              <th className="px-6 py-3 text-right">Venta</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((t) => (
              <tr
                key={t.codigo}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="px-6 py-3 flex items-center gap-2">
                  <span>{t.flag}</span>
                  <span className="font-medium">{t.codigo}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  {t.simbolo} {formatNumber(t.compra)}
                </td>
                <td className="px-6 py-3 text-right">
                  {t.simbolo} {formatNumber(t.venta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
