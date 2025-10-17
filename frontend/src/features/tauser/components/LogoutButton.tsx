import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <div className="absolute top-4 right-4">
      <button 
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg text-base font-medium shadow-lg flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut size={24} />
        Cerrar Sesión
      </button>
    </div>
  );
}