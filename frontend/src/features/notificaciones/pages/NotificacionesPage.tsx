import { useState } from "react";
import { Bell, User, Building2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import NotificationSettingsUsuario from "../components/NotificacionSettingsUsuario";
import NotificationSettingsCliente from "../components/NotificacionSettingsCliente";
import type { Tab } from "../../../types/Tab";

export default function NotificacionesPage() {
  const items: Tab[] = [
    {
      key: "usuario",
      icon: "fal fa-user",
      label: "Notificaciones Personales",
    },
    {
      key: "cliente",
      icon: "fal fa-building",
      label: "Notificaciones del Cliente",
    },
  ];

  const [selectedTab, onSelectTab] = useState<Tab>(items[0]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen flex">
      <Sidebar
        header="Notificaciones"
        isLeftSidebarCollapsed={isSidebarCollapsed}
        changeIsLeftSidebarCollapsed={setIsSidebarCollapsed} 
        items={items}
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-amber-600" />
              {selectedTab.label}
            </h1>
            <p className="text-gray-600 mt-2">
              {selectedTab.key === "usuario"
                ? "Configura las notificaciones que recibirás en tu email personal"
                : "Configura las notificaciones que recibirá el cliente actual."}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTab.key === "usuario" && <NotificationSettingsUsuario />}
            {selectedTab.key === "cliente" && <NotificationSettingsCliente />}
          </div>
        </div>
      </div>
    </div>
  );
}