/**
 * @fileoverview Tipos de datos para transacciones de operaciones.
 */

import type { MetodoFinanciero } from "../features/metodos_financieros/types/MetodoFinanciero";
import type { Cliente } from "../features/clientes/types/Cliente";
import type { Divisa } from "./Divisa";
import type { Role } from "../features/roles/types/Role";
import type { Tauser } from "../features/tauser/types/Tauser";

export interface TransaccionRequest {
  operador: number;
  cliente: string;
  operacion: "compra" | "venta";
  tasa_aplicada: number;
  tasa_inicial: number;
  divisa_origen: number;
  divisa_destino: number;
  monto_origen: number;
  monto_destino: number;
  metodo_financiero?: number | null;
  metodo_financiero_detalle?: number | null;
  tauser: string;
  estado?: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
}

export interface Transaccion {
  id: number;
  operador: number;
  cliente: string;
  operacion: "compra" | "venta";
  tasa_aplicada: number;
  tasa_inicial: number;
  divisa_origen: number;
  divisa_destino: number;
  monto_origen: number;
  monto_destino: number;
  metodo_financiero: number;
  metodo_financiero_detalle?: number;
  tauser: string;
  estado: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
  fecha_inicio: string;
  fecha_fin?: string;
  created_at: string;
  updated_at: string;
}


export interface TransaccionDetalle {
  id: number;
  operador: number;
  cliente: string;
  operacion: "venta" | "compra";
  tasa_aplicada: string;
  tasa_inicial: string;
  divisa_origen: number;
  divisa_destino: number;
  monto_origen: string;
  monto_destino: string;
  metodo_financiero: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  tauser: string;
  estado: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
  created_at: Date;
  updated_at: Date;
  operador_detalle: {
    id: number;
    username: string;
    last_login: Date;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    date_joined: Date;
    clientes: Cliente[];
    roles: Role[];
  };
  cliente_detalle: Cliente;
  divisa_origen_detalle: Divisa;
  divisa_destino_detalle: Divisa;
  metodo_financiero_detalle: MetodoFinanciero;
  tauser_detalle: Tauser;
}
