import type {
  CuentaBancaria,
  BilleteraDigital,
  TarjetaLocal,
  MetodoFinancieroDetalle,
  InstanceTabType,
  ExtendedItem,
  MetodoFinanciero,
} from "../types/MetodoFinanciero";

export const filterInstances = (
  cuentas: CuentaBancaria[],
  billeteras: BilleteraDigital[],
  tarjetasLocales: TarjetaLocal[],
  detalles: MetodoFinancieroDetalle[],
  instanceTab: InstanceTabType,
  search: string,
  getExtendedItems: (items: any[], tipo: InstanceTabType) => ExtendedItem[]
): ExtendedItem[] => {
  let items: ExtendedItem[] = [];

  switch (instanceTab) {
    case "cuentas":
      items = getExtendedItems(cuentas, "cuentas");
      break;
    case "billeteras digitales":
      items = getExtendedItems(billeteras, "billeteras digitales");
      break;
    case "tarjetas locales":
      items = getExtendedItems(tarjetasLocales, "tarjetas locales");
      break;
  }

  // Filter only casa accounts
  items = items.filter((item) => {
    const detalle = detalles.find((d) => d.id === item.detalle_id);
    return detalle?.es_cuenta_casa;
  });

  if (!search) return items;

  return items.filter((item) => {
    const searchLower = search.toLowerCase();
    switch (item.tipo) {
      case "cuentas":
        const cuenta = item as CuentaBancaria & ExtendedItem;
        return (
          (cuenta.banco_nombre &&
            cuenta.banco_nombre.toLowerCase().includes(searchLower)) ||
          cuenta.titular.toLowerCase().includes(searchLower) ||
          cuenta.numero_cuenta.includes(searchLower)
        );
      case "billeteras digitales":
        const billetera = item as BilleteraDigital & ExtendedItem;
        return (
          (billetera.plataforma_nombre &&
            billetera.plataforma_nombre.toLowerCase().includes(searchLower)) ||
          billetera.usuario_id.toLowerCase().includes(searchLower) ||
          (billetera.email &&
            billetera.email.toLowerCase().includes(searchLower))
        );
      case "tarjetas locales":
        const tarjeta = item as TarjetaLocal & ExtendedItem;
        return (
          (tarjeta.marca_nombre &&
            tarjeta.marca_nombre.toLowerCase().includes(searchLower)) ||
          tarjeta.titular.toLowerCase().includes(searchLower) ||
          tarjeta.last4.includes(searchLower)
        );
      default:
        return false;
    }
  });
};

export const getMetodoFinancieroId = (
  tipo: InstanceTabType,
  metodos: MetodoFinanciero[]
): number => {
  const metodo = metodos.find((m) => {
    switch (tipo) {
      case "cuentas":
        return m.nombre === "TRANSFERENCIA_BANCARIA";
      case "billeteras digitales":
        return m.nombre === "BILLETERA_DIGITAL";
      case "tarjetas locales":
        return m.nombre === "TARJETA";
      default:
        return false;
    }
  });

  if (!metodo) {
    console.error(`No se encontró método financiero para tipo: ${tipo}`);
    return 1; // Fallback
  }

  return metodo.id!;
};

export const getDisplayName = (nombre: string): string => {
  switch (nombre) {
    case "BILLETERA_DIGITAL":
      return "Billetera Digital";
    case "TRANSFERENCIA_BANCARIA":
      return "Transferencia Bancaria";
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito";
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito";
    default:
      // Convierte formato SNAKE_CASE a Title Case
      return nombre
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
};
