/**
 * @fileoverview Tipos de datos para transacciones de operaciones.
 */

import type { MetodoFinanciero } from "../features/financiero/types/MetodoFinanciero";
import type { Cliente } from "../features/clientes/types/Cliente";
import type { Divisa } from "./Divisa";
import type { Role } from "../features/roles/types/Role";
import type { SimulacionResponse } from "./Simulacion";
import type { Tauser } from "./Tauser";

export interface TransaccionRequest {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
  tauser_id: string;
  terminos_aceptados: boolean;
}

export interface Transaccion {
  id: number;
  operador: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  cliente: {
    idCliente: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  operacion: "compra" | "venta";
  tasa_aplicada: number;
  tasa_inicial: number;
  divisa_origen: {
    id: number;
    nombre: string;
    código: string;
  };
  divisa_destino: {
    id: number;
    nombre: string;
    código: string;
  };
  monto_origen: number;
  monto_destino: number;
  metodo_financiero: {
    id: number;
    nombre: string;
    nombre_display: string;
  };
  fecha_inicio: string;
  fecha_fin: string | null;
  tauser: Tauser;
  estado: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
  created_at: string;
  updated_at: string;
}

export interface OperacionCompleta extends SimulacionResponse {
  tauser_seleccionado: Tauser;
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
