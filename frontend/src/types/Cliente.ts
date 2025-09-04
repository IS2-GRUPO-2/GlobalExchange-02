export type Cliente = {
  idCliente: string;
  nombre: string;
  isPersonaFisica: boolean;
  categoria: Categoria;
  cedula?: string;
  correo: string;
  telefono: string;
  direccion: string;
  isActive: boolean;
  ruc?: string;
};

export type Categoria = {
  idCategoria: string;
  nombre: string;
  descripcion: string;
  descuento: number;
};
