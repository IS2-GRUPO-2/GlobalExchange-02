/// <reference types="react" />
import type { SelectedTauser } from "../store/useSelectedTauser";

type Props = {
  tauser?: SelectedTauser | null;
};

export function TauserBanner({ tauser }: Props) {
  if (!tauser) {
    return null;
  }

  return (
    <div className="w-full flex justify-center pt-4 pb-2">
      <p className="text-sm sm:text-base font-semibold text-[var(--foreground)] text-center">
        {tauser.nombre}
      </p>
    </div>
  );
}
