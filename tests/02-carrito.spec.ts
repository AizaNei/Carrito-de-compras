import { test, expect } from '@playwright/test';
import { BUG } from '../pages/bugs-jira';

/**
 * BLOQUE CARRITO · US-04 a US-07.
 * "CAZABUGS" = el criterio destapa un bug de la tienda. Esas pruebas afirman lo que dice el CRITERIO y quedan
 * marcadas con test.fail(true, 'CLAVE · …') mientras el bug siga abierto en Jira.
 */

test.describe('US-04 · Agregar productos sin superar el stock', () => {
  // ─────────────── EJEMPLO GUIADO (resuelto) ───────────────
  test('CA1: se pueden agregar 15 cuadernos (stock 15)', async ({ page }) => {
    // ARRANGE: abrir la tienda
    await page.goto('/');

    // ACT: ubicar la tarjeta del cuaderno, escribir 15 en su cantidad y presionar "Agregar"
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Cuaderno universitario', level: 3 }) });
    await tarjeta.getByRole('spinbutton').fill('15');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();

    // ASSERT: en el carrito (la tarjeta con el encabezado "Carrito") aparece el cuaderno con cantidad 15
    const carrito = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    const linea = carrito.getByRole('listitem').filter({ hasText: 'Cuaderno universitario' });
    await expect(linea.locator('span')).toHaveText('15');
  });

  test('CA2: no deja agregar 7 mochilas de una vez (stock 6) y avisa', async ({ page }) => {
    // ARRANGE
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });

    // El alert() bloquea la página: el manejador se registra ANTES del clic.
    let aviso = '';
    page.once('dialog', async (dialogo) => {
      aviso = dialogo.message();
      await dialogo.accept();
    });

    // ACT
    await tarjeta.getByRole('spinbutton').fill('7');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();

    // ASSERT: avisó con el stock disponible y el carrito sigue vacío
    await expect.poll(() => aviso).toContain('Solo hay 6 unidades');
    await expect(carrito).toContainText('Tu carrito está vacío.');
  });

  test('CA3: 4 + 4 mochilas supera el stock (6) y debe rechazarse', async ({ page }) => {
    test.fail(true, BUG.B03_STOCK_SUMA);
    // ARRANGE
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    page.on('dialog', (dialogo) => dialogo.accept()); // si la tienda avisa, se acepta el aviso

    // ACT: 4 mochilas y luego otras 4
    await tarjeta.getByRole('spinbutton').fill('4');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();
    const cantidad = carrito.getByRole('listitem').filter({ hasText: 'Mochila escolar' }).locator('span');
    await expect(cantidad).toHaveText('4');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();

    // ASSERT (lo que dice el criterio): el stock no se supera, la cantidad se queda en 4
    await expect(cantidad).toHaveText('4');
  });
});

test.describe('US-05 · Aumentar la cantidad desde el carrito', () => {
  test('CA2: "+" no pasa del stock (6 mochilas)', async ({ page }) => {
    test.fail(true, BUG.B04_MAS_SIN_TOPE);
    // ARRANGE: las 6 mochilas del stock en el carrito
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
    await tarjeta.getByRole('spinbutton').fill('6');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();
    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    const cantidad = carrito.getByRole('listitem').filter({ hasText: 'Mochila escolar' }).locator('span');
    await expect(cantidad).toHaveText('6');
    page.on('dialog', (dialogo) => dialogo.accept());

    // ACT
    await page.getByRole('button', { name: 'Aumentar cantidad de Mochila escolar' }).click();

    // ASSERT
    await expect(cantidad).toHaveText('6');
  });
});

test.describe('US-06 · Disminuir la cantidad desde el carrito', () => {
  // De las dos salidas que acepta el criterio, elegimos: "la cantidad se queda en 1".
  test('CA2: con cantidad 1, "−" no la deja en 0 ni en negativo (se queda en 1)', async ({ page }) => {
    test.fail(true, BUG.B05_MENOS_SIN_PISO);
    // ARRANGE
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();
    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    const cantidad = carrito.getByRole('listitem').filter({ hasText: 'Mochila escolar' }).locator('span');
    await expect(cantidad).toHaveText('1');

    // ACT
    await page.getByRole('button', { name: 'Disminuir cantidad de Mochila escolar' }).click();

    // ASSERT
    await expect(cantidad).toHaveText('1');
  });
});

test.describe('US-07 · Quitar un producto del carrito', () => {
  test('CA2: quitar el único producto deja el carrito vacío y el total en $ 0', async ({ page }) => {
    // ARRANGE
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Esfero azul', level: 3 }) });
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();
    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    await expect(carrito.getByRole('listitem').filter({ hasText: 'Esfero azul' })).toBeVisible();

    // ACT
    await page.getByRole('button', { name: 'Eliminar Esfero azul' }).click();

    // ASSERT
    await expect(carrito).toContainText('Tu carrito está vacío.');
    await expect(carrito.locator('dt:text-is("Total") + dd')).toHaveText('$ 0');
  });
});
