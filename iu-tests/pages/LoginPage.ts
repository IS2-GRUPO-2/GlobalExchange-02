import { Page, Locator } from "@playwright/test";

export class LoginPage {
  private page: Page;

  readonly url: string = "/login";
  private usuario: Locator;
  private contrasenha: Locator;
  private btnIniciarSesion: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usuario = page.locator('[id="username"]');
    this.contrasenha = page.locator('[id="password"]');
    this.btnIniciarSesion = page.getByText("Iniciar sesión");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  async completarFormulario(
    usuario?: string,
    contrasenha?: string
  ): Promise<void> {
    if (usuario) await this.usuario.fill(usuario);
    if (contrasenha) await this.contrasenha.fill(contrasenha);
  }

  async btnIniciarSesionClick(): Promise<void> {
    await this.btnIniciarSesion.click();
  }
}
