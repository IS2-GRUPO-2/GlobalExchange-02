import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tasa } from "../types/Tasa";
import type { Divisa, PaginatedDivisas } from "../../../types/Divisa";
import { getDivisasSinTasa, getDivisa } from "../../../services/divisaService";

export type TasaFormData = {
  divisa: number;
  precioBase: string;
  comisionBaseCompra: string;
  comisionBaseVenta: string;
  activo: boolean;
};

type Props = {
  onSubmit: (data: TasaFormData) => Promise<void> | void;
  onCancel: () => void;
  isEditForm: boolean;
  tasa: Tasa | null;
};

const DECIMAL_REGEX = /^\d*(\.\d*)?$/;

const TasaForm = ({ onSubmit, onCancel, isEditForm, tasa }: Props) => {
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [loadingDivisas, setLoadingDivisas] = useState(false);
  const [divisaLabel, setDivisaLabel] = useState<string>("");

  const [form, setForm] = useState<TasaFormData>({
    divisa: tasa?.divisa ?? 0,
    precioBase: tasa?.precioBase ?? "",
    comisionBaseCompra: tasa?.comisionBaseCompra ?? "",
    comisionBaseVenta: tasa?.comisionBaseVenta ?? "",
    activo: tasa?.activo ?? true,
  });

  const handleDecimalChange =
    (field: "precioBase" | "comisionBaseCompra" | "comisionBaseVenta") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(",", ".");
      if (raw === "" || DECIMAL_REGEX.test(raw)) {
        setForm((f) => ({ ...f, [field]: raw }));
      }
    };

  const fetchAllDivisas = async (): Promise<Divisa[]> => {
    let page = 1;
    const aggregated: Divisa[] = [];
    while (true) {
      const res: PaginatedDivisas = await getDivisasSinTasa({ page, search: "" });
      const list = res?.results ?? [];
      aggregated.push(...list);
      if (!res?.next || list.length === 0) break;
      page += 1;
    }
    return aggregated;
  };

  useEffect(() => {
    const loadDivisaLabel = async () => {
      if (!isEditForm) return;
      const id = tasa?.divisa;
      if (!id) return;
      try {
        const d = await getDivisa(id);
        setDivisaLabel(`${d.codigo} — ${d.nombre}`);
      } catch {
        setDivisaLabel(String(id));
      }
    };

    const loadDivisasForCreate = async () => {
      if (isEditForm) return;
      try {
        setLoadingDivisas(true);
        const all = await fetchAllDivisas();
        setDivisas(all);
      } finally {
        setLoadingDivisas(false);
      }
    };

    loadDivisaLabel();
    loadDivisasForCreate();
  }, [isEditForm, tasa?.divisa]);

  const base = Number(form.precioBase || "0");
  const comiC = Number(form.comisionBaseCompra || "0");
  const comiV = Number(form.comisionBaseVenta || "0");
  const comisionMayorQueBase =
    form.precioBase !== "" &&
    form.comisionBaseCompra !== "" &&
    form.comisionBaseVenta !== "" &&
    !isNaN(base) &&
    !isNaN(comiC) &&
    !isNaN(comiV) &&
    comiC > base &&
    comiV > base;

  const isValid = useMemo(() => {
    const okDivisa = isEditForm ? true : form.divisa > 0;
    const okBase = form.precioBase !== "" && !isNaN(Number(form.precioBase));
    const okComC = form.comisionBaseCompra !== "" && !isNaN(Number(form.comisionBaseCompra));
    const okComV = form.comisionBaseVenta !== "" && !isNaN(Number(form.comisionBaseVenta));
    return okDivisa && okBase && okComC && okComV && !comisionMayorQueBase;
  }, [form, isEditForm, comisionMayorQueBase]);

  return (
    <div className="p-6 w-[92vw] max-w-xl bg-white rounded-xl shadow">
      <h2 className="text-lg font-bold mb-6 text-gray-800">
        {isEditForm ? "Editar Cotización" : "Crear Cotización"}
      </h2>

      <div className="space-y-5">
        {/* Divisa */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Divisa</label>
          {isEditForm ? (
            <input
              className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              value={divisaLabel || String(tasa?.divisa ?? "")}
              disabled
            />
          ) : loadingDivisas ? (
            <div className="text-sm text-gray-500">Cargando divisas...</div>
          ) : (
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.divisa}
                onChange={(e) =>
                  setForm((f) => ({ ...f, divisa: Number(e.target.value) }))
                }
              >
                <option value={0}>Selecciona una divisa</option>
                {divisas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codigo} — {d.nombre}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <ChevronDown size={18} />
              </span>
            </div>
          )}
          {!isEditForm && (
            <p className="mt-1 text-xs text-gray-500">
              Solo se muestran divisas activas que aún no tienen tasa.
            </p>
          )}
        </div>

        {/* Precio base */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Precio base</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="text"
            inputMode="decimal"
            value={form.precioBase}
            onChange={handleDecimalChange("precioBase")}
            placeholder="Ej: 7200.0000000000"
            autoComplete="off"
          />
        </div>

        {/* Comisión base Compra*/}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Comisión base Compra</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="text"
            inputMode="decimal"
            value={form.comisionBaseCompra}
            onChange={handleDecimalChange("comisionBaseCompra")}
            placeholder="Ej: 50.0000000000"
            autoComplete="off"
          />
          {comisionMayorQueBase && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              La comisión no puede ser mayor al precio base.
            </p>
          )}
        </div>

        {/* Comisión base venta */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Comisión base venta</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="text"
            inputMode="decimal"
            value={form.comisionBaseVenta}
            onChange={handleDecimalChange("comisionBaseVenta")}
            placeholder="Ej: 50.0000000000"
            autoComplete="off"
          />
          {comisionMayorQueBase && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              La comisión no puede ser mayor al precio base.
            </p>
          )}
        </div>

        {/* Activo */}
        {!isEditForm && (
          <div className="flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm((f) => ({ ...f, activo: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Activo
            </label>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            className="btn-secondary px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="btn-primary px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={!isValid}
            onClick={() => onSubmit(form)}
          >
            {isEditForm ? "Guardar cambios" : "Crear Cotización"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasaForm;
