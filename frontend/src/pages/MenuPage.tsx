import OperacionCompraVentaPublica from "../features/operaciones/components/OperacionCompraVentaPublica";
import CotizacionesTabla from "../components/CotizacionesTabla";


export default function MainMenuPage() {
  return (
    <div className="bg-gray-50 p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1">
          <CotizacionesTabla />
        </div>
        <div className="flex-1">
          <OperacionCompraVentaPublica />
        </div>
      </div>
    </div>
  );
}
