import OperacionCompraVenta from "../components/OperacionCompraVenta";

/**
 * Página para realizar operaciones de compra y venta de divisas.
 * Permite a los usuarios crear transacciones reales a través de terminales de autoservicio.
 */
export default function OperacionPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <OperacionCompraVenta />
    </main>
  );
}