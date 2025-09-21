import SimulacionOperacionPublica from "../components/SimulacionOperacionPublica";
import CotizacionesTabla from "../components/CotizacionesTabla";


export default function MainMenuPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <SimulacionOperacionPublica />
        <CotizacionesTabla />
      </main>
    </div>
  );
}
