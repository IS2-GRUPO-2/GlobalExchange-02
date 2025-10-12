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
  const { loginUserTauser, verifyMfa, mfaRequired } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * Maneja el envío del formulario de credenciales
   * Adaptado de LoginPage para manejar correctamente el flujo MFA
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await loginUserTauser(username, password);
      
      // IMPORTANTE: No llamamos onAutenticacionExitosa aquí
      // Si el usuario no tiene MFA, loginUser habría navegado automáticamente
      // Si llegamos aquí sin error, significa que mfaRequired se actualizará
      
    } catch (e: any) {
      // Manejo de errores igual que en LoginPage
      setError(e.response?.data?.error || "Credenciales inválidas. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del código MFA
   * Adaptado de LoginPage
   */
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await verifyMfa(mfaCode);
      // Si llegamos aquí, la verificación MFA fue exitosa
      // verifyMfa maneja la navegación automáticamente, pero nosotros necesitamos
      // pasar a la siguiente etapa del terminal
      onAutenticacionExitosa();
      
    } catch (e: any) {
      // Manejo de errores igual que en LoginPage
      setError(e.response?.data?.error || "Código MFA inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetea el estado de login para volver al formulario de credenciales
   */
  const resetLogin = () => {
    setUsername("");
    setPassword("");
    setMfaCode("");
    setError("");
    // No podemos resetear mfaRequired desde aquí, así que volvemos al inicio
    onVolverInicio();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {!mfaRequired ? "Inicio de Sesión" : "Verificación de Seguridad"}
      </h2>

      {!mfaRequired ? (
        /* FORMULARIO DE CREDENCIALES - Igual que LoginPage */
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
            className="w-full border border-gray-400 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Volver
          </button>
        </form>
      ) : (
        /* FORMULARIO DE VERIFICACIÓN MFA - Adaptado de LoginPage */
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
            className="w-full border border-gray-400 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Cambiar Usuario
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