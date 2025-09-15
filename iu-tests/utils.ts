import { Locator, Page } from "@playwright/test";

// Devuelve el locator de una celda (i = fila, j = columna)
export function getLocatorAt(table: Locator, i: number, j: number): Locator {
  return table.locator("tbody tr").nth(i).locator("td").nth(j);
}

// Devuelve el texto de una celda (i = fila, j = columna)
export async function getTextAt(table: Locator, i: number, j: number): Promise<string> {
  return await getLocatorAt(table, i, j).innerText();
}

// Devuelve el locator de una celda por nombre de columna
export async function getByNameAt(table: Locator, i: number, columnName: string): Promise<Locator> {
  const headers = await table.locator("thead th").allInnerTexts();
  const colIndex = headers.findIndex(h => h.trim() === columnName.trim());
  if (colIndex === -1) {
    throw new Error(`Columna "${columnName}" no encontrada. Headers: ${headers}`);
  }
  return getLocatorAt(table, i, colIndex);
}

// Devuelve el texto por nombre de columna
export async function getTextByNameAt(table: Locator, i: number, columnName: string): Promise<string> {
  const cell = await getByNameAt(table, i, columnName);
  return await cell.innerText();
}

// Devuelve la cantidad de filas visibles
export async function rowCount(table: Locator): Promise<number> {
  return await table.locator("tbody tr").count();
}
