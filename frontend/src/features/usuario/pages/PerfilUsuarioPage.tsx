import { useState } from "react";
import { Bell } from "lucide-react";
import TabNavigation from "../components/TabNavigation";
import PerfilTab from "../components/PerfilTab";
import ConfiguracionTab from "../components/ConfiguracionTab";

const PerfilUsuarioPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [user] = useState(
    JSON.parse(localStorage.getItem("user") || '{}')
  );

  if (!user || !user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No se encontró información del usuario.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="p-2 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-gray-500" />
                </button>
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-900 rounded-full flex items-center justify-center text-xs text-white">3</span>
              </div>
            </div>
          </div>

          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "profile" ? (
            <PerfilTab user={user} setIsEditing={setIsEditing} />
          ) : (
            <ConfiguracionTab />
          )}

          {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative border border-gray-200">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl font-light"
                  onClick={() => setIsEditing(false)}
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Perfil</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Nombre</label>
                    <input
                      type="text"
                      defaultValue={user.first_name}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Apellido</label>
                    <input
                      type="text"
                      defaultValue={user.last_name}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuarioPage;