import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tasa } from "../types/Tasa";
import type { Divisa, PaginatedDivisas } from "../types/Divisa";
import { getDivisasSinTasa, getDivisa } from "../services/divisaService";

export type TasaFormData = {
  divisa: number;
  precioBase: string;
  comisionBase: string;
  activo: boolean;
};

type Props = {
  onSubmit: (data: TasaFormData) => Promise<void> | void;
  onCancel: () => void;
  isEditForm: boolean;
  tasa: Tasa | null;
};

const DECIMAL_REGEX = /^\d*(\.\d*)?$/; // solo números y punto (opcional)

const TasaForm = ({ onSubmit, onCancel, isEditForm, tasa }: Props) => {
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [loadingDivisas, setLoadingDivisas] = useState(false);
  const [divisaLabel, setDivisaLabel] = useState<string>(""); // etiqueta bonita en edición

  const [form, setForm] = useState<TasaFormData>({
    divisa: tasa?.divisa ?? 0,
    precioBase: tasa?.precioBase ?? "0",
    comisionBase: tasa?.comisionBase ?? "0",
    activo: tasa?.activo ?? true,
  });

  const handleDecimalChange =
    (field: "precioBase" | "comisionBase") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(",", "."); // permitir coma -> punto
      if (raw === "" || DECIMAL_REGEX.test(raw)) {
        setForm((f) => ({ ...f, [field]: raw }));
      }
    };

  // Crear: cargar SOLO divisas activas sin tasa (backend ya filtra y pagina)
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
    // Si es edición, mostramos la etiqueta bonita de la divisa seleccionada
    const loadDivisaLabel = async () => {
      if (!isEditForm) return;
      const id = tasa?.divisa;
      if (!id) return;
      try {
        const d = await getDivisa(id);
        setDivisaLabel(`${d.codigo} — ${d.nombre}`);
      } catch {
        setDivisaLabel(String(id)); // fallback: id
      }
    };

    // Si es creación, cargamos el combo desde /sin_tasa/
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditForm, tasa?.divisa]);

  const base = Number(form.precioBase || "0");
  const comi = Number(form.comisionBase || "0");
  const comisionMayorQueBase =
    form.precioBase !== "" &&
    form.comisionBase !== "" &&
    !isNaN(base) &&
    !isNaN(comi) &&
    comi > base;

  const isValid = useMemo(() => {
    const okDivisa = isEditForm ? true : form.divisa > 0;
    const okBase = form.precioBase !== "" && !isNaN(Number(form.precioBase));
    const okCom = form.comisionBase !== "" && !isNaN(Number(form.comisionBase));
    return okDivisa && okBase && okCom && !comisionMayorQueBase;
  }, [form, isEditForm, comisionMayorQueBase]);

  return (
    <div className="p-4 w-[92vw] max-w-xl">
      <h2 className="text-lg font-semibold mb-4">
        {isEditForm ? "Editar Cotización" : "Crear Cotización"}
      </h2>

      <div className="space-y-4">
        {/* Divisa */}
        <div>
          <label className="block text-sm font-medium mb-1">Divisa</label>
          {isEditForm ? (
            <input className="input" value={divisaLabel || String(tasa?.divisa ?? "")} disabled />
          ) : loadingDivisas ? (
            <div className="text-sm text-gray-500">Cargando divisas...</div>
          ) : (
            <div className="relative">
              <select
                className="input appearance-none pr-10 bg-white"
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
                <ChevronDown size={16} />
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
          <label className="block text-sm font-medium mb-1">Precio base</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={form.precioBase}
            onChange={handleDecimalChange("precioBase")}
            placeholder="Ej: 7200.0000000000"
            autoComplete="off"
          />
        </div>

        {/* Comisión base */}
        <div>
          <label className="block text-sm font-medium mb-1">Comisión base</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={form.comisionBase}
            onChange={handleDecimalChange("comisionBase")}
            placeholder="Ej: 50.0000000000"
            autoComplete="off"
          />
          {comisionMayorQueBase && (
            <p className="mt-1 text-xs text-red-600">
              La comisión no puede ser mayor al precio base.
            </p>
          )}
        </div>

        {/* Activo */}
        { isEditForm? null : (
        <div className="flex items-center gap-2">
          <input
            id="activo"
            type="checkbox"
            checked={form.activo}
            onChange={(e) =>
              setForm((f) => ({ ...f, activo: e.target.checked }))
            }
          />
          <label htmlFor="activo" className="text-sm">
            Activo
          </label>
        </div>
        ) }

        {/* acciones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={!isValid}
            onClick={() => onSubmit(form)}
          >
            {isEditForm ? "Guardar cambios" : "Crear tasa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasaForm;
