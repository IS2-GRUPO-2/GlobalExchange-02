import { useState, useRef } from "react";
import { verifyEmailAPI } from "../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

interface Props {
  email: string;
}

export default function VerifyEmail({ email }: Props) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
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
      try {
        const res = await verifyEmailAPI(email, fullCode);
        if (res?.status === 200) {
          toast.success("Correo verificado exitosamente");
          navigate("/login");
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-300 p-12 w-full max-w-md mx-auto">
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
      <div className="flex gap-3 justify-center mb-8">
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(index, e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(index, e)
            }
            className="w-16 h-16 border border-gray-300 rounded-2xl text-center text-2xl font-medium text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        ))}
      </div>
      <button
        onClick={handleVerify}
        disabled={code.join("").length !== 6}
        className="w-full bg-black text-white font-semibold text-base py-4 px-6 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Verificar
      </button>
    </div>
  );
}
