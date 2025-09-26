import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import type { OperacionCompleta, SimulacionOperacionResultado, TransaccionRequest } from "../types/Transaccion";
import { verificarCambioTasa } from "../services/transaccionService";
import DialogoCambioTasa from "./DialogoCambioTasa";

interface EtapaTerminosProps {
  onRetroceder: () => void;
  onAceptar: () => void;
  resultado: OperacionCompleta;
  datosTransaccion: TransaccionRequest;
}

export default function EtapaTerminos({ onRetroceder, onAceptar, resultado, datosTransaccion }: EtapaTerminosProps) {
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [resultadoVerificacion, setResultadoVerificacion] = useState<SimulacionOperacionResultado | null>(null);

  const toggleTerminos = () => {
    setTerminosAceptados(!terminosAceptados);
  };
  
  const verificarYProceder = async () => {
    setVerificando(true);
    try {
      // Verificar si cambió la tasa antes de continuar
      const cambios = await verificarCambioTasa(datosTransaccion, resultado);
      
      if (cambios.tasa_cambio) {
        setResultadoVerificacion(cambios);
      } else {
        // Si no hay cambios, procedemos normalmente
        onAceptar();
      }
    } catch (error) {
      console.error("Error verificando cambio de tasa:", error);
      // Si hay error, permitimos continuar de todas formas
      onAceptar();
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Términos y Condiciones
        </h3>
        <p className="text-sm text-gray-600">
          Por favor lee y acepta los términos para continuar
        </p>
      </div>

      {/* Contenedor de términos con scroll */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto text-sm">
        <h4 className="font-semibold text-gray-900 mb-3">TÉRMINOS Y CONDICIONES DE SERVICIO</h4>
        
        <p className="mb-3">
          <strong>1. OBJETO:</strong> Global Exchange provee un servicio de cambio de divisas en terminales de autoservicio ubicados en Paraguay.
        </p>
        
        <p className="mb-3">
          <strong>2. TRANSACCIONES:</strong> Las transacciones están sujetas a las condiciones de cada terminal de autoservicio y a las normativas del Banco Central del Paraguay. Los tipos de cambio aplicados son los vigentes al momento de la confirmación de la operación.
        </p>
        
        <p className="mb-3">
          <strong>3. COMISIONES Y CARGOS:</strong> Las comisiones aplicadas dependen del tipo de operación y método de pago seleccionado. El cliente acepta expresamente los cargos mostrados en la simulación previa a la confirmación de la operación.
        </p>
        
        <p className="mb-3">
          <strong>4. LIMITACIONES:</strong> Existen límites operativos según las regulaciones financieras vigentes. Las operaciones que superen ciertos montos podrán requerir documentación adicional en cumplimiento con las normas contra el lavado de dinero.
        </p>
        
        <p className="mb-3">
          <strong>5. VERIFICACIÓN DE IDENTIDAD:</strong> El cliente autoriza a Global Exchange a verificar su identidad mediante los documentos presentados. Toda la información proporcionada debe ser verídica y exacta.
        </p>
        
        <p className="mb-3">
          <strong>6. RESPONSABILIDADES:</strong> El cliente es responsable de verificar la exactitud de los datos de la operación antes de confirmarla. Una vez confirmada, la operación no podrá ser cancelada o modificada.
        </p>
        
        <p className="mb-3">
          <strong>7. PRIVACIDAD:</strong> Global Exchange protege la privacidad del cliente de acuerdo a las leyes vigentes. Los datos personales serán tratados con fines operativos y cumplimiento regulatorio.
        </p>
        
        <p className="mb-3">
          <strong>8. LEGISLACIÓN APLICABLE:</strong> Estos términos se rigen por las leyes de la República del Paraguay. Cualquier controversia será resuelta en los tribunales de Asunción.
        </p>
      </div>

      {/* Checkbox de aceptación */}
      <div 
        onClick={toggleTerminos}
        className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md"
      >
        <div className="flex-shrink-0 mt-0.5 text-zinc-800">
          {terminosAceptados ? <CheckSquare size={20} /> : <Square size={20} />}
        </div>
        <p className="text-sm text-gray-700">
          He leído y acepto los términos y condiciones, así como la política de privacidad de Global Exchange.
        </p>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Volver al Resumen
        </button>
        <button
          onClick={verificarYProceder}
          disabled={!terminosAceptados || verificando}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
            terminosAceptados && !verificando
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {verificando && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>}
          Confirmar Operación
        </button>
      </div>
      
      {/* Diálogo de cambio de tasa */}
      {resultadoVerificacion && (
        <DialogoCambioTasa 
          resultado={resultadoVerificacion} 
          onCancelar={onRetroceder} 
          onContinuar={() => {
            setResultadoVerificacion(null);
            onAceptar();
          }}
          isOpen={resultadoVerificacion !== null}
        />
      )}
    </div>
  );
}
