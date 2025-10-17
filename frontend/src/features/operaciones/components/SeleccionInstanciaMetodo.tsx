import { useState, useEffect } from "react";
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import { toast } from "react-toastify";
import { getMisCuentasBancarias, getMisBilleterasDigitales, getMisTarjetas } from "../../metodos_financieros/services/metodoFinancieroService";
import type { MetodoFinanciero, CuentaBancaria, BilleteraDigital, Tarjeta } from "../../metodos_financieros/types/MetodoFinanciero";

interface SeleccionInstanciaMetodoProps {
  metodoFinanciero: MetodoFinanciero;
  instanciaSeleccionada: number | null;
  onInstanciaChange: (instanciaId: number | null, instancia?: any) => void;
  onVolver: () => void;
  onCancelar: () => void;
  onContinuar: () => void;
  puedeAvanzar: boolean;
}

export default function SeleccionInstanciaMetodo({
  metodoFinanciero,
  instanciaSeleccionada,
  onInstanciaChange,
  onVolver,
  onCancelar,
  onContinuar,
  puedeAvanzar
}: SeleccionInstanciaMetodoProps) {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [billeterasDigitales, setBilleterasDigitales] = useState<BilleteraDigital[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [loading, setLoading] = useState(false);

  const getDetalleId = (instancia: any): number | null => {
    if (!instancia) return null;
    const detalle = instancia.metodo_financiero_detalle;
    if (typeof detalle === "number") {
      return detalle;
    }
    if (detalle && typeof detalle === "object" && detalle.id !== undefined) {
      const parsed = Number(detalle.id);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (instancia.id !== undefined) {
      const parsed = Number(instancia.id);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // Cargar instancias específicas del cliente
  useEffect(() => {
    if (!metodoFinanciero) return;

    let isActive = true;

    const fetchInstancias = async () => {
      setLoading(true);
      try {
        let instancias: any[] = [];

        switch (metodoFinanciero.nombre) {
          case "TRANSFERENCIA_BANCARIA": {
            const data = await getMisCuentasBancarias();
            if (!isActive) return;
            instancias = data;
            setCuentasBancarias(data);
            setBilleterasDigitales([]);
            setTarjetas([]);
            break;
          }
          case "BILLETERA_DIGITAL": {
            const data = await getMisBilleterasDigitales();
            if (!isActive) return;
            instancias = data;
            setBilleterasDigitales(data);
            setCuentasBancarias([]);
            setTarjetas([]);
            break;
          }
          case "TARJETA": {
            const data = await getMisTarjetas();
            if (!isActive) return;
            instancias = data;
            setTarjetas(data);
            setCuentasBancarias([]);
            setBilleterasDigitales([]);
            break;
          }
          default: {
            setCuentasBancarias([]);
            setBilleterasDigitales([]);
            setTarjetas([]);
          }
        }

        if (!isActive) return;

        const defaultDetalleId =
          instancias.length > 0 ? getDetalleId(instancias[0]) : null;
        if (instanciaSeleccionada == null) {
          onInstanciaChange(defaultDetalleId, instancias[0]);
        }
      } catch (error: any) {
        if (!isActive) return;
        toast.error(`Error al cargar ${getMetodoLabel(metodoFinanciero.nombre)}: ${error.message}`);
        onInstanciaChange(null);
        setCuentasBancarias([]);
        setBilleterasDigitales([]);
        setTarjetas([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchInstancias();

    return () => {
      isActive = false;
    };
  }, [metodoFinanciero?.nombre]);

  // Manejar selección de instancia específica
  const handleInstanciaSelection = (instancia: any) => {
    const detalleId = getDetalleId(instancia);
    onInstanciaChange(detalleId, instancia);
  };

  // Funciones auxiliares
  const getMetodoIcon = (tipo: string) => {
    switch (tipo) {
      case 'TRANSFERENCIA_BANCARIA': return <Building2 className="w-4 h-4" />;
      case 'BILLETERA_DIGITAL': return <Smartphone className="w-4 h-4" />;
      case 'TARJETA': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };



  const getMetodoLabel = (tipo: string) => {
    switch (tipo) {
      case 'TRANSFERENCIA_BANCARIA': return 'cuentas bancarias';
      case 'BILLETERA_DIGITAL': return 'billeteras digitales';
      case 'TARJETA': return 'tarjetas';
      default: return tipo.toLowerCase();
    }
  };

  const getInstanciasActuales = () => {
    switch (metodoFinanciero.nombre) {
      case "TRANSFERENCIA_BANCARIA": return cuentasBancarias;
      case "BILLETERA_DIGITAL": return billeterasDigitales;
      case "TARJETA": return tarjetas;
      default: return [];
    }
  };

  const instancias = getInstanciasActuales();

  return (
    <div className="space-y-4">

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : instancias.length > 0 ? (
        <div className="space-y-2">
          {instancias.map((instancia: any) => {
            const detalleId = getDetalleId(instancia);
            const isSelected = detalleId !== null && instanciaSeleccionada === detalleId;
            return (
            <div
              key={instancia.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleInstanciaSelection(instancia)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMetodoIcon(metodoFinanciero.nombre)}
                  <div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {/* Mostrar detalles específicos según el tipo */}
                      {metodoFinanciero.nombre === "TRANSFERENCIA_BANCARIA" && (
                        <>
                          <p><strong>Banco:</strong> {instancia.banco_nombre || 'No especificado'}</p>
                          <p><strong>Cuenta:</strong> {instancia.numero_cuenta ? `**** ${instancia.numero_cuenta.slice(-4)}` : 'No disponible'}</p>
                          <p><strong>Titular:</strong> {instancia.titular || 'No especificado'}</p>
                        </>
                      )}
                      {metodoFinanciero.nombre === "BILLETERA_DIGITAL" && (
                        <>
                          <p><strong>Plataforma:</strong> {instancia.plataforma_nombre || 'No especificado'}</p>
                          <p><strong>Usuario ID:</strong> {instancia.usuario_id || instancia.identificador || 'No disponible'}</p>
                        </>
                      )}
                      {metodoFinanciero.nombre === "TARJETA" && (
                        <>
                          <p><strong>Marca:</strong> {instancia.marca_nombre || 'No especificado'}</p>
                          <p><strong>Titular:</strong> {instancia.titular || 'No especificado'}</p>
                          <p><strong>Brand:</strong> {instancia.brand || 'No especificado'}</p>
                          <p><strong>Número:</strong> {instancia.numero_tarjeta ? `**** ${instancia.numero_tarjeta.slice(-4)}` : 'No disponible'}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm mb-3">
            No tienes {getMetodoLabel(metodoFinanciero.nombre)} registradas
          </p>
          <p className="text-xs text-gray-500">
            Selecciona otro método o contacta a soporte para registrar una nueva
          </p>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between items-center gap-3 pt-4">
        <button
          onClick={onVolver}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onContinuar}
            disabled={!puedeAvanzar}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              puedeAvanzar
                ? "bg-zinc-900 text-white hover:bg-zinc-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
