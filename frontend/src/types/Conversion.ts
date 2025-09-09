export type SimulacionRequest = {
  cliente_id: string;
  divisa_id: string;
  monto: number;
  metodo_id: string;
  operacion: "compra" | "venta";
};

export type SimulacionResponse = {
  operacion: string;
  divisa: string;
  parametros: {
    precio_base: number;
    comision_base: number;
    descuento_categoria: number;
    comision_metodo?: number;
  };
  tc_final: number;
  monto_origen: number;
  monto_destino: number;
  unidad_destino: string;
};
