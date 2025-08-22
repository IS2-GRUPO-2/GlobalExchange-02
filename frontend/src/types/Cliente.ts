export type Cliente = {
  idCliente: string;
  nombre: string;
  isPersonaFisica: boolean;
  categoria: "VIP" | "CORPORATIVO" | "MINORISTA";
  cedula?: string;
  correo: string;
  telefono: string;
  direccion: string;
  isActive: boolean;
  ruc?: string;
}
