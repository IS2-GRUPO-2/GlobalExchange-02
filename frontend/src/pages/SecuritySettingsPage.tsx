/**
 * @fileoverview Página de configuración de seguridad del usuario
 * @page SecuritySettingsPage
 * 
 * @description
 * Página donde el usuario puede gestionar configuraciones de seguridad,
 * incluyendo la autenticación de dos factores (MFA).
 * 
 * @example
 * // Agregar ruta en el router
 * <Route path="/settings/security" element={<SecuritySettingsPage />} />
 */

import MfaSettings from "../components/MfaSettings";
import { useAuth } from "../context/useAuth";

/**
 * Componente de página de configuración de seguridad
 */
const SecuritySettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de la página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración de Seguridad
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona la seguridad de tu cuenta {user?.username}
          </p>
        </div>

        {/* Componente de MFA */}
        <div className="mb-8">
          <MfaSettings />
        </div>

        {/* Puedes agregar más secciones de seguridad aquí */}
        {/* 
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Cambiar Contraseña
          </h2>
          {/* Componente de cambio de contraseña 
        </div>
        */}
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
