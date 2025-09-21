import SimulacionOperacionPrivada from "../components/SimulacionOperacionPrivada";

export default function SimulacionOperacionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow flex justify-center items-start p-6">
        <SimulacionOperacionPrivada />
      </main>
    </div>
  );
}
