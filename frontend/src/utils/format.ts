export const formatNumber = (value: string) => {
  if (value === "") return "";

  // 🔹 sanitize first: keep only digits and at most one "."
  let sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts.slice(1).join(""); // only one decimal point
  }

  const [intPart = "", decimalPart] = sanitized.split(".");
  const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalPart !== undefined
    ? `${formattedIntPart},${decimalPart}` // locale-style with comma
    : formattedIntPart;
};

export const unformatNumber = (value: string) => {
  if (value === "") return "";

  // 🔹 sanitize first: keep only digits and commas
  let sanitized = value.replace(/[^0-9,]/g, "");
  const parts = sanitized.split(",");
  if (parts.length > 2) {
    sanitized = parts[0] + "," + parts.slice(1).join(""); // only one comma
  }

  let [int = "", decimal] = sanitized.split(",");
  int = int.replace(/\./g, ""); // remove *all* thousands separators

  return decimal !== undefined ? `${int}.${decimal}` : int;
};

export const formatNumberDecimals = (value: string, decimals: number) => {
  if (value === "") return "";

  // 🔹 sanitize first: keep only digits and at most one "."
  let sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts.slice(1).join(""); // only one decimal point
  }

  const [intPart = "", decimalPart] = sanitized.split(".");
  const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalPart !== undefined
    ? `${formattedIntPart},${decimalPart.substring(0, decimals)}` // locale-style with comma
    : formattedIntPart;
};
