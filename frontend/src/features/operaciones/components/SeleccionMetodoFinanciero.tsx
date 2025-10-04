import { useState, useEffect } from "react";
import { CreditCard, Building2, Smartphone, Banknote, Receipt } from 'lucide-react';
import { toast } from "react-toastify";
import { getMetodosFinancierosPorOperacion } from "../../metodos_financieros/services/metodoFinancieroService";
import type { MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";

interface SeleccionMetodoFinancieroProps {
  opPerspectivaCasa: "compra" | "venta";
  metodoSeleccionado: MetodoFinanciero | null;
  onMetodoChange: (metodo: MetodoFinanciero | null) => void;
}



export default function SeleccionMetodoFinanciero({
  opPerspectivaCasa,
  metodoSeleccionado,
  onMetodoChange
}: SeleccionMetodoFinancieroProps) {
  const [metodosDisponibles, setMetodosDisponibles] = useState<MetodoFinanciero[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar métodos disponibles según operación
  useEffect(() => {
    const fetchMetodos = async () => {
      if (!opPerspectivaCasa) return;
      
      setLoading(true);
      try {
        const metodos = await getMetodosFinancierosPorOperacion(opPerspectivaCasa);
        setMetodosDisponibles(metodos);
        
        // NO limpiar selección automáticamente para mantener EFECTIVO/CHEQUE
        // onMetodoChange(null);
      } catch (error: any) {
        toast.error(error.message || "Error al cargar métodos disponibles");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetodos();
  }, [opPerspectivaCasa]); // Remover onMetodoChange de dependencias

  // Manejar selección de método
  const handleMetodoSelection = (metodo: MetodoFinanciero) => {
    onMetodoChange(metodo);
  };

  const getMetodoLabel = (tipo: string) => {
    switch (tipo) {
      case 'TRANSFERENCIA_BANCARIA': return 'Transferencia Bancaria';
      case 'BILLETERA_DIGITAL': return 'Billetera Digital';
      case 'TARJETA': return 'Tarjeta de Crédito/Débito';
      case 'EFECTIVO': return 'Efectivo';
      case 'CHEQUE': return 'Cheque';
      default: return 'Otro Método';
    }
  }

  const getMetodoIcon = (tipo: string) => {
    switch (tipo) {
      case 'TRANSFERENCIA_BANCARIA': return <Building2 className="w-5 h-5" />;
      case 'BILLETERA_DIGITAL': return <Smartphone className="w-5 h-5" />;
      case 'TARJETA': return <CreditCard className="w-5 h-5" />;
      case 'EFECTIVO': return <Banknote className="w-5 h-5" />;
      case 'CHEQUE': return <Receipt className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* <div className="text-center">
        <h4 className="text-md font-semibold text-gray-800 mb-1">
          {getTituloMetodo()}
        </h4>
        <p className="text-sm text-gray-600">
          {getDescripcionMetodo()}
        </p>
      </div> */}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : metodosDisponibles.length > 0 ? (
        <div className="space-y-2">
          {metodosDisponibles.map((metodo) => (
            <div
              key={metodo.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                metodoSeleccionado?.id === metodo.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleMetodoSelection(metodo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMetodoIcon(metodo.nombre_display || metodo.nombre)}
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">
                      {getMetodoLabel(metodo.nombre)}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {opPerspectivaCasa === "compra" 
                        ? `Comisión: ${metodo.comision_pago_porcentaje}%`
                        : `Comisión: ${metodo.comision_cobro_porcentaje}%`
                      }
                    </p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  metodoSeleccionado?.id === metodo.id
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}>
                  {metodoSeleccionado?.id === metodo.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">No hay métodos disponibles para esta operación</p>
        </div>
      )}
    </div>
  );
}