/**
 * @fileoverview Tipos de datos para transacciones de operaciones.
 */

import type { MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";
import type { Cliente } from "../../clientes/types/Cliente";
import type { Divisa } from "../../divisas/types/Divisa";
import type { Role } from "../../roles/types/Role";
import type { Tauser } from "../../tauser/types/Tauser";

export interface TransaccionRequest {
  id_user: number;
  cliente: string;
  operacion: "compra" | "venta";
  tasa_aplicada: number;
  tasa_inicial: number;
  precio_base: number;
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
  id_user: number;
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
  id_user: number;
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
  factura_emitida: boolean;
  tauser: string;
  estado: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
  created_at: Date;
  updated_at: Date;
  id_user_detalle: {
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
