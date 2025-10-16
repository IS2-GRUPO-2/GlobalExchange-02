import { useState, useRef } from "react";
import { verifyEmailAPI } from "../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

interface Props {
  email: string;
}

export default function VerifyEmail({ email }: Props) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const navigate = useNavigate();

  const handleInputChange = (index: number, value: string): void => {
    // Only allow single digits
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    // Handle backspace to go to previous input
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      console.log("Verification code:", fullCode);
      setError("");
      setLoading(true);
      
      try {
        const res = await verifyEmailAPI(email, fullCode);
        if (res?.status === 200) {
          toast.success("Correo verificado exitosamente");
          navigate("/login");
        }
      } catch (err: any) {
        console.error("Error en handleVerify:", err);
        
        // Extraer mensaje de error específico
        let errorMessage = "Código inválido. Por favor, intenta nuevamente.";
        
        if (err.response?.status === 500) {
          errorMessage = "Error del servidor. Por favor, contacta al administrador.";
        } else if (err.response?.data) {
          const data = err.response.data;
          
          // Detectar si la respuesta es HTML
          const isHTML = typeof data === 'string' && (
            data.trim().startsWith('<!DOCTYPE') || 
            data.trim().startsWith('<html') ||
            data.includes('<title>') ||
            data.includes('<body>')
          );
          
          if (isHTML) {
            // No mostrar HTML al usuario
            errorMessage = "Error al verificar el código. Por favor, intenta nuevamente.";
          } else if (typeof data === 'object' && data !== null) {
            if (data.error) {
              errorMessage = data.error;
            } else if (data.detail) {
              errorMessage = data.detail;
            } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMessage = data.non_field_errors[0];
            }
          } else if (typeof data === 'string' && data.length < 200) {
            errorMessage = data;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 py-8">
      <div className="bg-white rounded-2xl border border-gray-300 p-12 w-full max-w-md mx-auto shadow-lg">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <h1 className="text-black text-center font-bold text-3xl leading-tight tracking-tight">
          Verificar su email
        </h1>
        <p className="text-center text-base leading-tight text-gray-700 max-w-80">
          <span className="text-gray-700">
            Le enviamos un EMAIL con un código de
            <br />
            verificación al{" "}
          </span>
          <span className="text-black font-medium">{email}</span>
        </p>
      </div>
      <div className="flex gap-4 justify-center mb-8">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={loading}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(index, e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(index, e)
            }
            className="w-14 h-14 border-2 border-gray-300 rounded-xl text-center text-2xl font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 transition-all"
          />
        ))}
      </div>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
      
      <button
        onClick={handleVerify}
        disabled={code.join("").length !== 6 || loading}
        className="w-full bg-black text-white font-semibold text-base py-4 px-6 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Verificando..." : "Verificar"}
      </button>
      </div>
    </div>
  );
}
