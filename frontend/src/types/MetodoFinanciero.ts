export type TipoMetodoFinanciero = 
  | 'TRANSFERENCIA_BANCARIA' 
  | 'BILLETERA_DIGITAL' 
  | 'TARJETA' 
  | 'EFECTIVO' 
  | 'CHEQUE';

// Nuevos tipos para catálogos
export type Banco = {
  id?: number;
  nombre: string;
  cvu: string;
  comision_compra: number;
  comision_venta: number;
  comision_personalizada_compra: boolean;
  comision_personalizada_venta: boolean;
  is_active: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
};

export type BilleteraDigitalCatalogo = {
  id?: number;
  nombre: string;
  comision_compra: number;
  comision_venta: number;
  comision_personalizada_compra: boolean;
  comision_personalizada_venta: boolean;
  is_active: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
};

export type TarjetaLocalCatalogo = {
  id?: number;
  marca: string;
  comision_compra: number;
  comision_venta: number;
  comision_personalizada_compra: boolean;
  comision_personalizada_venta: boolean;
  is_active: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
};

export type MetodoFinanciero = {
  id?: number;
  nombre: TipoMetodoFinanciero;
  nombre_display?: string;
  permite_cobro: boolean;
  permite_pago: boolean;
  comision_cobro_porcentaje: string;
  comision_pago_porcentaje: string;
  is_active: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
};

export type MetodoFinancieroDetalle = {
  id?: number;
  cliente?: string | null;
  es_cuenta_casa: boolean;
  metodo_financiero: number;
  alias: string;
  fecha_registro?: string;
  is_active: boolean;
  desactivado_por_catalogo?: boolean;
};

// Tipos actualizados con referencias a catálogos
export type CuentaBancaria = {
  id?: number;
  metodo_financiero_detalle: number;
  banco: number; // ID del banco del catálogo
  banco_nombre?: string; // Nombre del banco (solo lectura)
  banco_activo?: boolean; // Estado del banco (solo lectura)
  numero_cuenta: string;
  titular: string;
  cbu_cvu: string;
};

export type BilleteraDigital = {
  id?: number;
  metodo_financiero_detalle: number;
  plataforma: number; // ID de la billetera del catálogo
  plataforma_nombre?: string; // Nombre de la plataforma (solo lectura)
  plataforma_activa?: boolean; // Estado de la plataforma (solo lectura)
  usuario_id: string;
  email?: string;
  telefono?: string;
  alias_billetera?: string;
};

export type Tarjeta = {
  id?: number;
  metodo_financiero_detalle: number;
  tipo?: 'LOCAL' | 'STRIPE';
  payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  titular: string;
};

// Tipos de paginación
export type PaginatedBanco = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Banco[];
};

export type PaginatedBilleteraDigitalCatalogo = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BilleteraDigitalCatalogo[];
};

export type PaginatedTarjetaLocalCatalogo = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TarjetaLocalCatalogo[];
};

export type PaginatedMetodoFinanciero = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MetodoFinanciero[];
};

export type PaginatedMetodoFinancieroDetalle = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MetodoFinancieroDetalle[];
};

export type PaginatedCuentaBancaria = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CuentaBancaria[];
};

export type PaginatedBilleteraDigital = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BilleteraDigital[];
};

export type PaginatedTarjeta = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tarjeta[];
};
