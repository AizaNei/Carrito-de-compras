import { test, expect } from '@playwright/test';
import { BUG } from '../pages/bugs-jira';

/**
 * PRUEBAS HEREDADAS (Parte 4) · ya diagnosticadas. El veredicto y la evidencia están en ENTREGA.md, sección 3.
 */

// H1 · VEREDICTO: DEFECTO DE LA PRUEBA. US-01 CA1 dice 8 productos y la tienda muestra 8 (lib/products.ts).
// La prueba tenía un dato viejo (6, el mínimo de RF-01). Corrección: esperar 8.
test('H1 · el catálogo tiene 8 productos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8);
});

// H2 · VEREDICTO: BUG DEL PRODUCTO (B10). El oráculo es correcto: 2 mochilas = $ 130.000; DESC20 = $ 26.000;
// IVA = 19 % de $ 104.000 = $ 19.760. La tienda muestra $ 24.700 (19 % de $ 130.000). Falla siempre igual.
test('H2 · el IVA de 2 mochilas con DESC20 es $ 19.760', async ({ page }) => {
  test.fail(true, BUG.B10_IVA_SIN_DESCUENTO);
  await page.goto('/');
  const tarjeta = page
    .locator('.rounded-lg')
    .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
  await tarjeta.getByRole('spinbutton').fill('2');
  await tarjeta.getByRole('button', { name: 'Agregar' }).click();
  await page.getByPlaceholder('Código de descuento').fill('DESC20');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.locator('dt:text-is("IVA (19%)") + dd')).toHaveText('$ 19.760');
});

// H3 · VEREDICTO: PRUEBA INESTABLE. Con waitUntil: 'domcontentloaded' hacía clic en el HTML que manda el servidor
// antes de que React terminara de cargar (hidratar) la página; ese clic no hace nada y a veces el cuaderno no llega
// al carrito. Corrección SIN pausas fijas: esperar a que la página termine de cargar (goto por defecto espera "load")
// y que el clic sí haya tenido efecto: el contador del encabezado pasa a "1 artículo(s)".
test('H3 · agregar un cuaderno justo después de cargar', async ({ page }) => {
  await page.goto('/');
  const tarjeta = page
    .locator('.rounded-lg')
    .filter({ has: page.getByRole('heading', { name: 'Cuaderno universitario', level: 3 }) });
  const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });

  // Reintenta el clic SOLO si el anterior no tuvo efecto (página aún sin hidratar); nunca agrega dos veces.
  await expect(async () => {
    if ((await carrito.getByRole('listitem').count()) === 0) {
      await tarjeta.getByRole('button', { name: 'Agregar' }).click();
    }
    await expect(carrito.getByRole('listitem').filter({ hasText: 'Cuaderno universitario' })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(page.getByRole('banner')).toContainText('1 artículo(s)');
});
