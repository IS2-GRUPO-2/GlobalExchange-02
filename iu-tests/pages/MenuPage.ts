import { Page, Locator } from "@playwright/test";

export class MenuPage {
  private page: Page;
  readonly url: string;

  constructor(page: Page) {
    this.page = page;
    this.url = "";
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }
}
