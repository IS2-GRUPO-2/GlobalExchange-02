import { Page, Locator } from "@playwright/test";

export class RolesPage {
  private page: Page;
  public url = "/roles";
  readonly buscador: Locator;
  readonly tabla: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buscador = page.getByRole('textbox', { name: 'Buscar roles...' });
    this.tabla = page.locator('div').filter({ hasText: 'Nombre# PermisosPermisos (' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  async buscar(nombre: string): Promise<void> {
    await this.buscador.fill(nombre);
  }
}
