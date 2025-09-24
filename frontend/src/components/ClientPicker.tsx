import React, { useEffect, useState } from "react";
import type { Cliente } from "../types/Cliente";
import { toast } from "react-toastify";
import {
  getUserClients,
  getClienteActual,
  setClienteActual,
} from "../services/usuarioService";

type Props = {
  userId: number;
  className?: string;
  onChange?: (c: Cliente | null) => void;
};

const ClientPicker: React.FC<Props> = ({
  userId,
  className = "",
  onChange,
}) => {
  const [options, setOptions] = useState<Cliente[]>([]);
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const errMsg = (e: any) => {
    const d = e?.response?.data;
    if (typeof d === "string") return d;
    return d?.detail || d?.error || "Ocurrió un error";
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [listRes, currentRes] = await Promise.all([
          getUserClients(userId),
          getClienteActual(userId),
        ]);
        const list: Cliente[] = listRes.data ?? [];
        setOptions(list);

        if (list.length === 0) {
          setValue("");
          onChange?.(null);
        } else {
          const current: Cliente | null =
            currentRes.data?.clienteActual ?? null;
          setValue(current ? current.idCliente : "");
          onChange?.(current);
        }
      } catch (e) {
        toast.error(errMsg(e));
        setOptions([]);
        setValue("");
        onChange?.(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, onChange]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    if (!nextId || nextId === value) return;

    const prevId = value;
    const nextClient = options.find((c) => c.idCliente === nextId) || null;

    setValue(nextId);
    onChange?.(nextClient);

    try {
      await setClienteActual(userId, nextId);
    } catch (e) {
      setValue(prevId);
      onChange?.(options.find((c) => c.idCliente === prevId) || null);
      toast.error(errMsg(e));
    }
  };

  if (loading) {
    return (
      <div className={`client-selector ${className}`}>
        <label className="block text-xs text-gray-300 mb-1">
          Cliente actual:
        </label>
        <select
          disabled
          className="block w-full rounded-md bg-gray-800 border border-gray-600 text-gray-400 text-sm px-3 py-1.5"
        >
          <option>Cargando clientes…</option>
        </select>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={`client-selector ${className}`}>
        <label className="block text-xs text-gray-300 mb-1">
          Cliente actual:
        </label>
        <select
          disabled
          className="block w-full rounded-md bg-gray-800 border border-gray-600 text-gray-400 text-sm px-3 py-1.5"
        >
          <option>No hay clientes asignados</option>
        </select>
      </div>
    );
  }

  const currentClient = options.find((c) => c.idCliente === value) || null;
  const otherOptions = options.filter((c) => c.idCliente !== value);

  return (
    <div className={`client-selector ${className}`}>
      <label
        htmlFor="client-select"
        className="block text-xs text-gray-300 mb-1"
      >
        Cliente actual:
      </label>
      <select
        id="client-select"
        className="block w-full rounded-md bg-gray-800 border border-gray-600 text-white text-sm px-3 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   hover:bg-gray-700 transition-colors"
        value={value}
        onChange={handleChange}
      >
        {value === "" ? (
          <option value="">Seleccionar cliente…</option>
        ) : (
          // Oculta el cliente actual del desplegable, pero lo muestra como seleccionado
          <option value={value} hidden>
            {currentClient?.nombre ?? "Cliente actual"}
          </option>
        )}
        {otherOptions.map((c) => (
          <option
            key={c.idCliente}
            value={c.idCliente}
            className="bg-gray-800 text-white"
          >
            {c.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientPicker;
