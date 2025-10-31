import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { SelectedTauser } from "../store/useSelectedTauser";
import { ProcesarCompra } from "./ProcesarCompra";
import { ProcesarVenta } from "./ProcesarVenta";

type Props = {
  transaccion: TransaccionDetalle;
  tauser: SelectedTauser;
  onCancelar: () => void;
  onProcesada: (transaccionActualizada: TransaccionDetalle) => void;
  onCancelada: () => void;
};

export function EtapaProcesarOperacion({
  transaccion,
  tauser,
  onCancelar,
  onProcesada,
  onCancelada,
}: Props) {
  if (!transaccion) {
    return null;
  }

  if (transaccion.operacion === "compra") {
    return (
      <ProcesarCompra
        transaccion={transaccion}
        tauser={tauser}
        onCancelar={onCancelar}
        onProcesada={onProcesada}
        onCancelada={onCancelada}
      />
    );
  }

  return (
    <ProcesarVenta
      transaccion={transaccion}
      tauser={tauser}
      onCancelar={onCancelar}
      onProcesada={onProcesada}
      onCancelada={onCancelada}
    />
  );
}
