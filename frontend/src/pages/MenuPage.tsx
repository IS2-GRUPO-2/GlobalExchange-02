import OperacionCompraVentaPublica from "../features/operaciones/components/OperacionCompraVentaPublica";
import CotizacionesTabla from "../components/CotizacionesTabla";
import FeatureCards from "../components/FeatureCards";

export default function MainMenuPage() {
  return (  
    <div className="min-h-screen bg-gray-50">
      {/* Título en fondo blanco */}
      <div className="container mx-auto px-4 pt-8 pb-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Intercambio de Divisas <span className="text-blue-600">Rápido y Seguro</span>
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Consulta las mejores tasas del mercado y simula tu operación al instante
          </p>
        </div>
      </div>

      {/* Banner negro solo para los componentes */}
      <div className="container mx-auto px-4 mb-8">
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out">
          {/* Elementos decorativos sutiles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
          
          {/* Contenedor de componentes */}
          <div className="relative z-10 py-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Tabla de Cotizaciones - Sticky */}
                <div className="w-full">
                  <div className="lg:sticky lg:top-6">
                    <CotizacionesTabla />
                  </div>
                </div>

                {/* Simulador de Operación */}
                <div className="w-full">
                  <OperacionCompraVentaPublica />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards debajo */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          ¿Por qué elegirnos?
        </h2>
        <FeatureCards />
      </div>
    </div>
  );
}
