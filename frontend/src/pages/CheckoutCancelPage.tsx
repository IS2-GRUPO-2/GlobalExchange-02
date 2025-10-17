import { useNavigate } from "react-router-dom";

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-red-500 text-5xl mb-4">×</div>
        <h1 className="text-2xl font-bold mb-4">Pago cancelado</h1>
        <p className="text-gray-600 mb-4">Has cancelado el proceso de pago.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
