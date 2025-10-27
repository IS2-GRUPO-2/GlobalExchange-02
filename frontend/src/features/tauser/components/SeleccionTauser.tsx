import { useEffect, useState } from "react";
import { getTausers } from "../services/tauserService";
import type { Tauser } from "../types/Tauser";
import { toast } from "react-toastify";
import { Loader2, MapPin, Building2 } from "lucide-react";
import type { SelectedTauser } from "../store/useSelectedTauser";

type Props = {
  onSeleccionar: (tauser: SelectedTauser) => void;
};

export function SeleccionTauser({ onSeleccionar }: Props) {
  const [tausers, setTausers] = useState<Tauser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTausers = async () => {
      setLoading(true);
      try {
        const data = await getTausers({ all: true, is_active: true });
        setTausers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar las terminales disponibles.");
      } finally {
        setLoading(false);
      }
    };

    fetchTausers();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        <p className="text-base text-[var(--muted-foreground)]">Cargando terminales...</p>
      </div>
    );
  }

  if (!tausers.length) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-xl font-semibold text-[var(--foreground)]">No hay tausers activos.</p>
        <p className="text-[var(--muted-foreground)]">
          Contacta al administrador para habilitar una terminal de autoservicio.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tausers.map((tauser) => (
        <button
          key={tauser.id}
          onClick={() => onSeleccionar({ id: tauser.id, codigo: tauser.codigo, nombre: tauser.nombre })}
          className="text-left rounded-3xl border border-[var(--border)] bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition p-5 flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          <div className="flex items-center gap-2 text-[var(--primary)] font-semibold text-lg">
            <Building2 className="w-5 h-5" />
            <span>{tauser.nombre}</span>
            <span className="text-sm text-[var(--muted-foreground)]">({tauser.codigo})</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
            <MapPin className="w-4 h-4 mt-0.5" />
            <div>
              <p>{tauser.direccion}</p>
              <p>
                {tauser.ciudad}, {tauser.departamento}
              </p>
            </div>
          </div>
          <span className="mt-4 text-sm font-medium text-[var(--primary)]">
            Seleccionar terminal
          </span>
        </button>
      ))}
    </div>
  );
}
