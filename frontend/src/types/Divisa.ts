export type Divisa = {
  id?: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  is_active: boolean;
  max_digitos: number;
  precision: number;
  es_base?: boolean;
};

export type PaginatedDivisas = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Divisa[];
};

export type Denominacion = {
  id?: number;
  divisa_id: number;
  denominacion: number;
  is_active: boolean;
};
