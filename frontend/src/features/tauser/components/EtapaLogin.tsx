import { useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { Loader2 } from "lucide-react";

type Props = {
  onVolverInicio: () => void;
  onAutenticacionExitosa: () => void;
};

/**
 * @component EtapaLogin
 * @description
 * Maneja la autenticación del operador TAUSER, incluyendo MFA (2FA).
 * 
 * Flujo:
 * - Usuario ingresa username/password
 * - Si no requiere MFA → muestra error (terminal requiere MFA)
 * - Si requiere MFA → se muestra campo de código de 6 dígitos
 */
export default function EtapaLogin({
  onVolverInicio,
  onAutenticacionExitosa,
}: Props) {
  const { loginUserTauser, verifyMfaTauser, mfaRequired, logoutTauser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * Maneja el envío del formulario de credenciales
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (loading) return;
    
    setError("");
    setLoading(true);
    
    try {
      await loginUserTauser(username, password);
      // Si llegamos aquí sin error y mfaRequired se activó, 
      // el componente se re-renderizará automáticamente mostrando el formulario MFA
      
    } catch (e: any) {
      console.error("Error en handleLogin:", e);
      
      // Extraer mensaje de error
      let errorMessage = "Credenciales inválidas. Intente nuevamente.";
      
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      }
      
      setError(errorMessage);
      
      // Asegurarse de que el estado esté limpio después de un error
      // para evitar problemas de renderizado
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del código MFA
   */
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (loading) return;
    
    setError("");
    setLoading(true);
    
    try {
      await verifyMfaTauser(mfaCode);
      // Si llegamos aquí, la verificación MFA fue exitosa
      onAutenticacionExitosa();
      
    } catch (e: any) {
      console.error("Error en handleVerifyMfa:", e);
      
      // Extraer mensaje de error
      let errorMessage = "Código MFA inválido o expirado.";
      
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      }
      
      setError(errorMessage);
      
      // Si el error indica que el token temporal expiró o no es válido,
      // resetear el formulario
      if (
        errorMessage.toLowerCase().includes("expirad") ||
        errorMessage.toLowerCase().includes("token") ||
        e.response?.status === 401
      ) {
        // Pequeño delay para que el usuario vea el mensaje de error
        setTimeout(() => {
          resetLogin();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetea el estado de login para volver al formulario de credenciales
   */
  const resetLogin = () => {
    // Limpiar los inputs
    setUsername("");
    setPassword("");
    setMfaCode("");
    setError("");
    
    // Cerrar sesión actual en el contexto de autenticación
    logoutTauser();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {!mfaRequired ? "Inicio de Sesión" : "Verificación de Seguridad"}
      </h2>

      {!mfaRequired ? (
        /* FORMULARIO DE CREDENCIALES */
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-left">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-lg"
              disabled={loading}
              required
            />
          </div>

          <div className="text-left">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-lg"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-left">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition flex justify-center items-center disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Iniciar Sesión"}
          </button>

          <button
            type="button"
            onClick={onVolverInicio}
            disabled={loading}
            className="w-full border border-gray-400 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition text-lg disabled:opacity-50"
          >
            Volver
          </button>
        </form>
      ) : (
        /* FORMULARIO DE VERIFICACIÓN MFA */
        <form onSubmit={handleVerifyMfa} className="space-y-4">
          <p className="text-gray-600 mb-4 text-left">
            Ingresa el código de 6 dígitos de tu aplicación de autenticación 
            (Google Authenticator, Authy, etc.)
          </p>
          
          <div className="text-left">
            <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código de autenticación
            </label>
            <input
              type="text"
              id="mfaCode"
              maxLength={6}
              pattern="\d{6}"
              inputMode="numeric"
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono"
              disabled={loading}
              required
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-1">
              El código se renueva cada 30 segundos
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-left">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || mfaCode.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex justify-center items-center disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verificar Código"}
          </button>

          <button
            type="button"
            onClick={resetLogin}
            disabled={loading}
            className="w-full border border-gray-400 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition text-lg disabled:opacity-50"
          >
            Volver
          </button>
        </form>
      )}

      {/* Información de ayuda */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              💡 Información importante
            </h3>
            <p className="text-sm text-blue-700">
              {!mfaRequired 
                ? "Este terminal requiere autenticación de dos factores (MFA) para garantizar la seguridad. Solo usuarios con MFA habilitado pueden acceder."
                : "Si no tienes acceso a tu aplicación de autenticación, contacta al administrador del sistema."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}