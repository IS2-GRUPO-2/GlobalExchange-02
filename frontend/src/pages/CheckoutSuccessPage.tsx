import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      toast.error("Sesión de pago no válida");
      navigate("/");
      return;
    }

    toast.success("Pago completado con éxito");
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-4">¡Pago exitoso!</h1>
        <p className="text-gray-600 mb-4">
          Tu transacción se ha completado correctamente.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};
