import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Cliente } from "../features/clientes/types/Cliente";
import { toast } from "react-toastify";
import {
  getUserClients,
  getClienteActual,
  setClienteActual,
} from "../features/usuario/services/usuarioService";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

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

        const storageKey = `clienteActual_${userId}`;
        let storedCliente: Cliente | null = null;
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) storedCliente = JSON.parse(raw);
        } catch {}

        let current: Cliente | null = currentRes.data?.clienteActual ?? null;

        // Si hay uno guardado y es válido, forzar setClienteActual y usarlo
        if (storedCliente && list.some(c => c.idCliente === storedCliente.idCliente)) {
          if (!current || current.idCliente !== storedCliente.idCliente) {
            await setClienteActual(userId, storedCliente.idCliente);
            current = list.find(c => c.idCliente === storedCliente.idCliente) || null;
          }
        }

        if (list.length === 0) {
          setValue("");
          onChange?.(null);
        } else {
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

  const handleChange = async (nextId: string) => {
    if (!nextId || nextId === value) return;
    const prevId = value;
    const nextClient = options.find((c) => c.idCliente === nextId) || null;
    setValue(nextId);
    onChange?.(nextClient);
    // Guardar cliente seleccionado en localStorage (objeto completo)
    const storageKey = `clienteActual_${userId}`;
    if (nextClient) {
      localStorage.setItem(storageKey, JSON.stringify(nextClient));
    } else {
      localStorage.removeItem(storageKey);
    }
    try {
      await setClienteActual(userId, nextId);
      window.dispatchEvent(new CustomEvent('clienteActualChanged', {
        detail: { cliente: nextClient, userId }
      }));
    } catch (e) {
      setValue(prevId);
      onChange?.(options.find((c) => c.idCliente === prevId) || null);
      // Revertir localStorage si falla
      if (prevId) {
        const prevClient = options.find((c) => c.idCliente === prevId);
        if (prevClient) {
          localStorage.setItem(storageKey, JSON.stringify(prevClient));
        }
      } else {
        localStorage.removeItem(storageKey);
      }
      toast.error(errMsg(e));
    }
  }

  if (loading) {
    const buttonClass =
      "flex items-center gap-2 min-w-[220px] w-[240px] h-10 rounded-md bg-zinc-900 border border-zinc-800 text-gray-300 text-sm px-4 py-2 " +
      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-white/5 transition-colors";
    return (
      <div className={`client-selector ${className} min-w-[220px] w-[240px]`}>
        <button disabled className={buttonClass + " text-gray-500 cursor-not-allowed"}>
          <span className="truncate flex-1 text-left">Cargando clientes…</span>
        </button>
      </div>
    );
  }

  if (options.length === 0) {
    const buttonClass =
      "flex items-center gap-2 min-w-[220px] w-[240px] h-10 rounded-md bg-zinc-900 border border-zinc-800 text-gray-300 text-sm px-4 py-2 " +
      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-white/5 transition-colors";
    return (
      <div className={`client-selector ${className} min-w-[220px] w-[240px]`}>
        <button disabled className={buttonClass + " text-gray-500 cursor-not-allowed"}>
          <span className="truncate flex-1 text-left">No hay clientes asignados</span>
        </button>
      </div>
    );
  }

  const buttonClass =
    "flex items-center gap-2 min-w-[240px] w-[250px] h-10 rounded-md bg-zinc-900 border border-zinc-800 text-gray-300 text-sm px-4 py-2 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-white/5 transition-colors";
  const menuClass =
    "absolute z-20 mt-2 w-[250px] origin-top-right rounded-md bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none";

  const currentClient = options.find((c) => c.idCliente === value) || null;

  return (
    <Menu as="div" className={`client-selector relative ${className} min-w-[320px] w-[340px]`}>
      <MenuButton className={buttonClass + " flex justify-between items-center"}>
        <span className="flex-1 text-left whitespace-normal" title={currentClient?.nombre || "Cliente actual"}>
          {currentClient?.nombre || "Seleccionar cliente…"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
      </MenuButton>
      <MenuItems className={menuClass}>
        {options.map((c) => (
          <MenuItem key={c.idCliente}>
            {({ active }) => (
              <button
                className={`w-full text-left px-4 py-2 text-sm truncate ${
                  c.idCliente === value
                    ? "bg-white text-zinc-900 font-semibold"
                    : active
                    ? "bg-white/5 text-white"
                    : "text-gray-300"
                }`}
                onClick={() => handleChange(c.idCliente)}
                disabled={c.idCliente === value}
                title={c.nombre}
              >
                {c.nombre}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default ClientPicker;
