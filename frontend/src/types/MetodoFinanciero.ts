export type TipoMetodoFinanciero = 
  | 'TRANSFERENCIA_BANCARIA' 
  | 'BILLETERA_DIGITAL' 
  | 'TARJETA' 
  | 'METALICO' 
  | 'CHEQUE';

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
};

export type CuentaBancaria = {
  id?: number;
  metodo_financiero_detalle: number;
  banco: string;
  numero_cuenta: string;
  titular: string;
  cbu_cvu: string;
};

export type BilleteraDigital = {
  id?: number;
  metodo_financiero_detalle: number;
  plataforma: string;
  usuario_id: string;
  email?: string;
  telefono?: string;
  alias_billetera?: string;
};

export type Tarjeta = {
  id?: number;
  metodo_financiero_detalle: number;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  titular: string;
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
