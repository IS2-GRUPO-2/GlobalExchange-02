import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RolesPage } from '../pages/RolesPage';
import { MenuPage } from '../pages/MenuPage';
import { getLocatorAt } from '../utils';
import { ClientesPage } from '../pages/ClientesPage';

let loginPage: LoginPage;
let rolesPage: RolesPage;
let menuPage: MenuPage;
let clientesPage: ClientesPage;

test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    rolesPage = new RolesPage(page);
    menuPage = new MenuPage(page);
    clientesPage = new ClientesPage(page);
});
test('test permite ver clientes', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.completarFormulario('admin', 'admin123');
    await loginPage.btnIniciarSesionClick();
    await expect(page).toHaveURL(menuPage.url);
    
    // Navegar a roles
    await rolesPage.goto();

    // Editar rol Administrador
    await rolesPage.buscar('Administrador');
    await expect(rolesPage.tabla.locator("tbody tr")).toHaveCount(1);
    await page.waitForTimeout(2000);
    await getLocatorAt(rolesPage.tabla, 0, 3).getByRole('button', { name: 'Editar' }).click();
    
    // Quitar permiso de ver divisas
    await page.getByRole('textbox', { name: 'Buscar (nombre, codename o' }).click();
    await page.getByRole('textbox', { name: 'Buscar (nombre, codename o' }).fill('cliente');
    await expect(page.locator('label').filter({ hasText: 'Puede ver cliente' })).toBeVisible();
    await expect(async () => {
        await page.locator('label').filter({ hasText: 'Puede ver cliente' }).click();
        await expect(page.getByRole('checkbox', { name: 'Puede ver cliente' })).not.toBeChecked({timeout: 2000});
    }).toPass();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Rol actualizado con éxito!')).toBeVisible();

    // Verificar que no puede ver divisas
    await clientesPage.goto();
    await expect(page.getByText('No tenés permisos para ver este contenido.')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Volver a roles para poner el permiso de ver divisas
    await rolesPage.goto();

    // Editar rol Administrador
    await rolesPage.buscar('Administrador');
    await expect(rolesPage.tabla.locator("tbody tr")).toHaveCount(1);
    await page.waitForTimeout(2000);
    await getLocatorAt(rolesPage.tabla, 0, 3).getByRole('button', { name: 'Editar' }).click();
    
    // Poner permiso de ver divisas
    await page.getByRole('textbox', { name: 'Buscar (nombre, codename o' }).click();
    await page.getByRole('textbox', { name: 'Buscar (nombre, codename o' }).fill('cliente');
    await expect(page.locator('label').filter({ hasText: 'Puede ver cliente' })).toBeVisible();
    await expect(async () => {
        await page.locator('label').filter({ hasText: 'Puede ver cliente' }).click();
        await expect(page.getByRole('checkbox', { name: 'Puede ver cliente' })).toBeChecked({timeout: 2000});
    }).toPass();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Rol actualizado con éxito!')).toBeVisible();
    await page.close();
});