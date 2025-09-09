export type Cliente = {
  idCliente: string;
  nombre: string;
  isPersonaFisica: boolean;
  idCategoria: string;
  categoria?: CategoriaCliente;
  cedula?: string;
  correo: string;
  telefono: string;
  direccion: string;
  isActive: boolean;
  ruc?: string;
};

export type CategoriaCliente = {
  idCategoria: string;
  nombre: string;
  descripcion: string;
  descuento: number;
};
