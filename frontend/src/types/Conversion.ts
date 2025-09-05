export type SimulacionRequest = {
  cliente_id: string;
  divisa_id: string;
  monto: number;
  metodo_pago: string;
  operacion: "compra" | "venta";
};

export type SimulacionResponse = {
  operacion: string;
  divisa: string;
  parametros: {
    precio_base: number;
    comision_base: number;
    descuento_categoria: number;
    porcentaje_metodo_pago?: number;
    porcentaje_metodo_cobro?: number;
  };
  tc_final: number;
  monto_origen: number;
  monto_destino: number;
  unidad_destino: string;
};
