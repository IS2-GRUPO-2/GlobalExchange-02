import { Page, Locator } from "@playwright/test";

export class EjemploPage {
  private page: Page;

  readonly inputNombre: Locator;
  readonly btnGuardar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inputNombre = page.locator('[id="principal:nombre"]');
    this.btnGuardar = page.locator('[id="principal:btnGuardar"]');
  }

  // Método que retorna algo sin promesa (ejemplo: devuelve el locator directamente)
  getNombreLocator(): Locator {
    return this.inputNombre;
  }

  // Método normal asíncrono (ejemplo: completar un input y hacer click en guardar)
  async guardar(nombre: string): Promise<void> {
    await this.inputNombre.fill(nombre);
    await this.btnGuardar.click();
  }
}
