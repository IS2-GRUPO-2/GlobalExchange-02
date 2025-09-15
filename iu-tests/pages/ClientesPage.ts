import { Page, Locator } from "@playwright/test";

export class ClientesPage {
  private page: Page;
  public url = "/clientes";
  
  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }
}
