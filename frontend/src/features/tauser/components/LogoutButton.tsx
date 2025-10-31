import { LogOut } from "lucide-react";
import clsx from "clsx";

type LogoutButtonProps = {
  onLogout: () => void;
  className?: string;
};

export default function LogoutButton({ onLogout, className }: LogoutButtonProps) {
  return (
    <button
      onClick={onLogout}
      className={clsx(
        "bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg text-base font-medium shadow-lg flex items-center justify-center gap-2 transition-colors",
        className
      )}
    >
      <LogOut size={20} />
      Cerrar sesión
    </button>
  );
}
