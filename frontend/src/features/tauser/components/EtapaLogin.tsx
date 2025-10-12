import { useState } from "react";

interface EtapaLoginProps {
  onVolverInicio: () => void;
}

export default function EtapaLogin({ onVolverInicio }: EtapaLoginProps) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [token, setToken] = useState("");
  const [paso, setPaso] = useState<"credenciales" | "token">("credenciales");
  const [loading, setLoading] = useState(false);

  const handleSubmitCredenciales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !contrasena) return;

    setLoading(true);
    try {
      // Simular validación de credenciales
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPaso("token");
    } catch (error) {
      console.error("Error en autenticación:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      // Simular validación de token MFA
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Aquí se avanzaría a la siguiente etapa (selección de cliente)
      console.log("Autenticación completada");
    } catch (error) {
      console.error("Error en validación de token:", error);
    } finally {
      setLoading(false);
    }
  };

  const volver = () => {
    if (paso === "token") {
      setPaso("credenciales");
      setToken("");
    } else {
      onVolverInicio();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {paso === "credenciales" ? "Iniciar Sesión" : "Verificación de Seguridad"}
        </h2>
        <p className="text-gray-600">
          {paso === "credenciales" 
            ? "Ingresa tus credenciales para acceder" 
            : "Ingresa el token de autenticación"}
        </p>
      </div>

      {paso === "credenciales" ? (
        <form onSubmit={handleSubmitCredenciales} className="space-y-6">
          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Ingresa tu usuario"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !usuario || !contrasena}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              "Continuar"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitToken} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Token de Seguridad
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center tracking-widest"
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              "Acceder"
            )}
          </button>
        </form>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={volver}
          disabled={loading}
          className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm font-medium transition-colors duration-200"
        >
          {paso === "credenciales" ? "← Volver al inicio" : "← Volver a credenciales"}
        </button>
      </div>

      {/* Ayuda */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-2">¿Necesitas ayuda?</h3>
        <p className="text-xs text-gray-600">
          Si tienes problemas para acceder, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}