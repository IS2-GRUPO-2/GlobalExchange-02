import { useState, useEffect } from "react";
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import { toast } from "react-toastify";
import { getMisCuentasBancarias, getMisBilleterasDigitales, getMisTarjetas } from "../../financiero/services/metodoFinancieroService";
import type { MetodoFinanciero, CuentaBancaria, BilleteraDigital, Tarjeta } from "../../financiero/types/MetodoFinanciero";

interface SeleccionInstanciaMetodoProps {
  metodoFinanciero: MetodoFinanciero;
  instanciaSeleccionada: number | null;
  onInstanciaChange: (instanciaId: number | null) => void;
  onVolver: () => void;
}

export default function SeleccionInstanciaMetodo({
  metodoFinanciero,
  instanciaSeleccionada,
  onInstanciaChange,
  onVolver
}: SeleccionInstanciaMetodoProps) {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [billeterasDigitales, setBilleterasDigitales] = useState<BilleteraDigital[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar instancias específicas del cliente
  useEffect(() => {
    const fetchInstancias = async () => {
      setLoading(true);
      try {
        let instancias: any[] = [];
        
        switch (metodoFinanciero.nombre) {
          case "TRANSFERENCIA_BANCARIA":
            instancias = await getMisCuentasBancarias();
            setCuentasBancarias(instancias);
            break;
          case "BILLETERA_DIGITAL":
            instancias = await getMisBilleterasDigitales();
            setBilleterasDigitales(instancias);
            break;
          case "TARJETA":
            instancias = await getMisTarjetas();
            setTarjetas(instancias);
            break;
        }
        
        // Seleccionar automáticamente la primera instancia si existe
        if (instancias.length > 0) {
          onInstanciaChange(instancias[0].metodo_financiero_detalle);
        } else {
          onInstanciaChange(null);
        }
        
      } catch (error: any) {
        toast.error(`Error al cargar ${getMetodoLabel(metodoFinanciero.nombre)}: ${error.message}`);
        onInstanciaChange(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInstancias();
  }, [metodoFinanciero, onInstanciaChange]);

  // Manejar selección de instancia específica
  const handleInstanciaSelection = (instanciaId: number) => {
    onInstanciaChange(instanciaId);
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

  const getMetodoTitleLabel = (tipo: string) => {
    switch (tipo) {
      case 'TRANSFERENCIA_BANCARIA': return 'Transferencia Bancaria';
      case 'BILLETERA_DIGITAL': return 'Billetera Digital';
      case 'TARJETA': return 'Tarjeta de Crédito/Débito';
      default: return 'Otro Método';
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
      <div className="text-center">
        <h4 className="text-md font-semibold text-gray-800 mb-1">
          {getMetodoTitleLabel(metodoFinanciero.nombre)}
        </h4>
        <p className="text-sm text-gray-600">
          Selecciona cuál {getMetodoLabel(metodoFinanciero.nombre)} específica quieres usar
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : instancias.length > 0 ? (
        <div className="space-y-2">
          {instancias.map((instancia: any) => (
            <div
              key={instancia.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                instanciaSeleccionada === instancia.metodo_financiero_detalle
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleInstanciaSelection(instancia.metodo_financiero_detalle)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMetodoIcon(metodoFinanciero.nombre)}
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">
                      {instancia.alias || 'Sin alias'}
                    </h4>
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
                <div className={`w-4 h-4 rounded-full border-2 ${
                  instanciaSeleccionada === instancia.id
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}>
                  {instanciaSeleccionada === instancia.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
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

      <div className="flex justify-center pt-2">
        <button
          onClick={onVolver}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cambiar Método
        </button>
      </div>
    </div>
  );
}