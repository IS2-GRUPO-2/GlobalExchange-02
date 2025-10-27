import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Tauser } from "../types/Tauser";

export type SelectedTauser = Pick<Tauser, "id" | "nombre" | "codigo">;

type SelectedTauserStore = {
  selectedTauser: SelectedTauser | null;
  setSelectedTauser: (tauser: SelectedTauser | null) => void;
};

export const useSelectedTauserStore = create<SelectedTauserStore>()(
  persist(
    (set) => ({
      selectedTauser: null,
      setSelectedTauser: (tauser) => set({ selectedTauser: tauser }),
    }),
    {
      name: "tauser-selected-terminal",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
