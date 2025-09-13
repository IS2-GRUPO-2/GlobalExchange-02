import {type MetodoFinanciero} from './MetodoFinanciero'

export type SimulacionRequest = {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  metodo_id: number;
};

export type SimulacionResponse = {
  operacion_cliente: "compra" | "venta";
  operacion_casa: "compra" | "venta";
  divisa_origen: string;
  divisa_destino: string;
  parametros: {
    precio_base: number;
    comision_base: number;
    descuento_categoria?: number;
    comision_metodo?: number;
  };
  tc_final: number;
  monto_origen: number;
  monto_destino: number;
  metodo: string;
};

export type MetodosDisponiblesResponse = {
  operacion_casa: "compra" | "venta";
  metodos: MetodoFinanciero[];
};
