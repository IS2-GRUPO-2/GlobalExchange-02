import { useState, useEffect } from "react";
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import { type MetodosClienteResponse, type InstanciaMetodo, type MetodoClienteOrganizado } from "../types/Simulacion";
import { getMetodosCliente } from "../services/simulacionService";

type TabType = 'TRANSFERENCIA_BANCARIA' | 'BILLETERA_DIGITAL' | 'TARJETA';

interface EtapaSeleccionMetodoProps {
  clienteId: string;
  divisaOrigen: string;
  divisaDestino: string;
  detalleMetodoSeleccionado: number | null;
  metodoGenericoSeleccionado: string;
  onDetalleMetodoChange: (detalleId: number | null) => void;
  onMetodoGenericoChange: (metodoId: string) => void;
  onRetroceder: () => void;
  onSimular: () => void;
  esOperacionReal?: boolean; // Nueva prop para diferenciar simulación de operación real
}

export default function EtapaSeleccionMetodo({
  clienteId,
  divisaOrigen,
  divisaDestino,
  detalleMetodoSeleccionado,
  metodoGenericoSeleccionado,
  onDetalleMetodoChange,
  onMetodoGenericoChange,
  onRetroceder,
  onSimular,
  esOperacionReal = false
}: EtapaSeleccionMetodoProps) {
  const [metodos, setMetodos] = useState<{[nombre_metodo: string]: MetodoClienteOrganizado}>({});
  const [operacionCasa, setOperacionCasa] = useState<"compra" | "venta" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetodos = async () => {
      if (!divisaOrigen || !divisaDestino || !clienteId) return;
      
      setLoading(true);
      try {
        const data: MetodosClienteResponse = await getMetodosCliente(
          clienteId,
          Number(divisaOrigen),
          Number(divisaDestino)
        );
        setMetodos(data.metodos);
        setOperacionCasa(data.operacion_casa);
        
        // Seleccionar automáticamente el primer método disponible
        const metodosDisponibles = Object.keys(data.metodos);
        if (metodosDisponibles.length > 0) {
          const primerMetodo = metodosDisponibles[0];
          const instancias = data.metodos[primerMetodo]?.instancias || [];
          
          if (instancias.length > 0) {
            onDetalleMetodoChange(instancias[0].id);
            onMetodoGenericoChange("");
          } else {
            onDetalleMetodoChange(null);
            onMetodoGenericoChange(data.metodos[primerMetodo].metodo_financiero.id.toString());
          }
        }
      } catch (err) {
        console.error("Error cargando métodos del cliente", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetodos();
  }, [divisaOrigen, divisaDestino, clienteId]);

  const puedeSimular = (detalleMetodoSeleccionado || metodoGenericoSeleccionado);

  const getTituloMetodo = () => {
    if (operacionCasa === "venta") return "Método de Pago";
    if (operacionCasa === "compra") return "Método de Cobro";
    return "Método Financiero";
  };

  const getDescripcionMetodo = () => {
    if (operacionCasa === "venta") 
      return "Selecciona cómo vas a pagar por la divisa que quieres comprar";
    if (operacionCasa === "compra") 
      return "Selecciona cómo quieres recibir el pago por la divisa que vas a vender";
    return "Selecciona el método financiero para tu operación";
  };

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
      case 'TRANSFERENCIA_BANCARIA': return 'Transferencia Bancaria';
      case 'BILLETERA_DIGITAL': return 'Billetera Digital';
      case 'TARJETA': return 'Tarjeta';
      default: return tipo;
    }
  };

  const renderInstanciaCard = (instancia: InstanciaMetodo, metodoTipo: string) => {
    const isSelected = detalleMetodoSeleccionado === instancia.id;
    
    const getCardTitle = () => {
      switch (instancia.tipo_especifico) {
        case 'cuenta_bancaria':
          return instancia.detalles.banco_nombre || 'Cuenta Bancaria';
        case 'billetera_digital':
          return instancia.detalles.plataforma_nombre || 'Billetera Digital';
        case 'tarjeta':
          return `**** ${instancia.detalles.last4}`;
        case 'tarjeta_local':
          return `${instancia.detalles.marca_nombre} **** ${instancia.detalles.last4}`;
        default:
          return instancia.alias;
      }
    };
    
    const getCardDetails = () => {
      switch (instancia.tipo_especifico) {
        case 'cuenta_bancaria':
          return (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Titular: </span>
                {instancia.detalles.titular}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">CBU/CVU: </span>
                ****{instancia.detalles.cbu_cvu?.slice(-4)}
              </div>
            </div>
          );
        case 'billetera_digital':
          return (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Usuario: </span>
                {instancia.detalles.usuario_id || instancia.detalles.email}
              </div>
              {instancia.detalles.telefono && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Tel: </span>
                  {instancia.detalles.telefono}
                </div>
              )}
            </div>
          );
        case 'tarjeta':
          return (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Titular: </span>
                {instancia.detalles.titular}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Vence: </span>
                {instancia.detalles.exp_month?.toString()?.padStart(2, '0')}/{instancia.detalles.exp_year}
              </div>
            </div>
          );
        case 'tarjeta_local':
          return (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Titular: </span>
                {instancia.detalles.titular}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Vence: </span>
                {instancia.detalles.exp_month?.toString()?.padStart(2, '0')}/{instancia.detalles.exp_year}
              </div>
            </div>
          );
        default:
          return <div className="text-xs text-gray-600">{instancia.alias}</div>;
      }
    };

    return (
      <div
        key={instancia.id}
        onClick={() => {
          onDetalleMetodoChange(instancia.id);
          onMetodoGenericoChange("");
        }}
        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-zinc-900 bg-zinc-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start space-x-2">
          {getMetodoIcon(metodoTipo)}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {getCardTitle()}
            </h4>
            <div className="mt-1">
              {getCardDetails()}
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-gray-300'
          }`}>
            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
        </div>
      </div>
    );
  };

  const renderMetodoGenerico = (metodoInfo: MetodoClienteOrganizado, metodoTipo: string) => {
    const isSelected = metodoGenericoSeleccionado === metodoInfo.metodo_financiero.id.toString();
    
    return (
      <div
        onClick={() => {
          onDetalleMetodoChange(null);
          onMetodoGenericoChange(metodoInfo.metodo_financiero.id.toString());
        }}
        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-zinc-900 bg-zinc-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start space-x-2">
          {getMetodoIcon(metodoTipo)}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {metodoInfo.metodo_financiero.nombre_display}
            </h4>
            <div className="mt-1">
              <div className="text-xs text-gray-600">
                Método genérico
              </div>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-gray-300'
          }`}>
            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Cargando métodos disponibles...</p>
        </div>
      </div>
    );
  }

  const metodosDisponibles = Object.entries(metodos);

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getTituloMetodo()}
        </h3>
        <p className="text-sm text-gray-600">
          {getDescripcionMetodo()}
        </p>
      </div>

      {/* Mostrar todos los métodos en una vista expandida */}
      {metodosDisponibles.length > 0 ? (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
          style={{ height: '50vh', maxHeight: '400px', minHeight: '300px' }}
        >
          {metodosDisponibles.map(([metodoTipo, metodoInfo]) => (
            <div key={metodoTipo} className="space-y-3">
              {/* Título del tipo de método */}
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                {getMetodoIcon(metodoTipo)}
                <h4 className="font-medium text-gray-800 text-sm">
                  {getMetodoLabel(metodoTipo)}
                </h4>
              </div>

              {/* Instancias específicas del cliente */}
              <div className="space-y-2">
                {metodoInfo.instancias.map((instancia) =>
                  renderInstanciaCard(instancia, metodoTipo)
                )}
                
                {/* Método genérico */}
                {renderMetodoGenerico(metodoInfo, metodoTipo)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay métodos disponibles
          </h3>
          <p className="text-gray-600">
            No tienes métodos financieros registrados para esta operación.
          </p>
        </div>
      )}

      {/* Botones navegación */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Atrás
        </button>
        <button
          onClick={onSimular}
          disabled={!puedeSimular}
          className={`px-8 py-3 rounded-lg font-medium ${
            puedeSimular
              ? 'bg-zinc-900 text-white hover:bg-zinc-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {esOperacionReal ? 'Continuar' : 'Simular Operación'}
        </button>
      </div>
    </div>
  );
}