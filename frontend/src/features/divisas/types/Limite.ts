import Decimal from "decimal.js";

export type LimiteDivisa = {
  limite_diario: typeof Decimal;
  limite_mensual: typeof Decimal;
};

export type LimiteDivisaFormData = {
  limite_diario: string;
  limite_mensual: string;
};
