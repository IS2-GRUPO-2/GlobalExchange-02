import { Page, Locator } from "@playwright/test";

export class DivisaPage {
  private page: Page;
  public url = "/divisas";
  
  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }
}
