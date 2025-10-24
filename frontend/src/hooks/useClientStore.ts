import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cliente } from "../features/clientes/types/Cliente";

type ClientStore = {
  selectedClient: Cliente | null;
  setSelectedClient: (id: Cliente) => void;
};

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      selectedClient: null,
      setSelectedClient: (cliente: Cliente) => set({ selectedClient: cliente }),
    }),
    { name: "selected-client", storage: createJSONStorage(() => localStorage) }
  )
);
