export interface Tasa {
  id: number;
  divisa?: number;
  precioBase: string;
  comisionBaseCompra: string;
  comisionBaseVenta: string;
  activo: boolean;
  tasaCompra?: string | number;
  tasaVenta?: string | number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
