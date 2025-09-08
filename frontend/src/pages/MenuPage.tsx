import SimulacionConversion from "../components/SimulacionConversion";

export default function MenuPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <SimulacionConversion />
      </main>
    </div>
  );
}