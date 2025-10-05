import React from "react";

const ConfiguracionTab: React.FC = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
    <h2 className="text-xl font-semibold mb-6 text-gray-900">Configuración de la cuenta</h2>
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="font-medium text-gray-900">Autenticación de dos factores</h3>
          <p className="text-sm text-gray-500 mt-1">Agrega una capa extra de seguridad a tu cuenta</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
        </label>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="font-medium text-gray-900">Notificaciones por email</h3>
          <p className="text-sm text-gray-500 mt-1">Recibe actualizaciones importantes por correo</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked readOnly />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
        </label>
      </div>
    </div>
  </div>
);

export default ConfiguracionTab;
