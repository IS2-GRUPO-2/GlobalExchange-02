import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MenuPage } from '../pages/MenuPage';

let loginPage: LoginPage;
let menuPage: MenuPage;

test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    menuPage = new MenuPage(page);
});

test('Valida si es que permite el login', async ({ page }) => {
    await loginPage.goto();
    await loginPage.completarFormulario('admin', 'admin123');
    await loginPage.btnIniciarSesionClick();
    await expect(page).toHaveURL(menuPage.url);
    await page.waitForTimeout(5000);
    await page.close();
});