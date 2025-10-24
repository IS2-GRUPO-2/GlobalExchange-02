export type EstadoTransaccion = {
  estado: "pendiente" | "en_proceso" | "completada" | "cancelada" | "fallida";
  read: "Pendiente" | "En proceso" | "Completada" | "Cancelada" | "Fallida";
  bgColor: string;
  textColor: string;
};

export const estadosTransaccion: EstadoTransaccion[] = [
  {
    estado: "pendiente",
    read: "Pendiente",
    bgColor: "bg-blue-300",
    textColor: "text-blue-900",
  },
  {
    estado: "en_proceso",
    read: "En proceso",
    bgColor: "bg-orange-300",
    textColor: "text-orange-900",
  },
  {
    estado: "completada",
    read: "Completada",
    bgColor: "bg-green-100",
    textColor: "text-green-900",
  },
  {
    estado: "cancelada",
    read: "Cancelada",
    bgColor: "bg-red-100",
    textColor: "text-red-900",
  },
  {
    estado: "fallida",
    read: "Fallida",
    bgColor: "bg-red-100",
    textColor: "text-red-900",
  },
];
