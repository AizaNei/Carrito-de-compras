import { test, expect, type Page } from '@playwright/test';
import { BUG } from '../pages/bugs-jira';

/**
 * BLOQUE CHECKOUT · US-13 a US-15.
 *
 * page.getByLabel('Nombre completo') NO encuentra el campo: cada <label> es hermano del <input> y no tiene htmlFor
 * (bug de accesibilidad B19, US-20 CA1). Por eso se usa el localizador por la etiqueta que va justo antes:
 *     page.locator('label:text-is("Nombre completo") + input')
 */

// Datos para la prueba dirigida por datos (US-15). Cada correo válido trae el bug que hoy lo rechaza, o '' si pasa.
const CORREOS_VALIDOS = [
  { correo: 'juan@correo.com', bug: '' },
  { correo: 'ana_gomez@gmail.com', bug: '' },
  { correo: 'ana.gomez@gmail.com', bug: BUG.B14_CORREO_VALIDO_RECHAZADO },
  { correo: 'ana-gomez@gmail.com', bug: BUG.B14_CORREO_VALIDO_RECHAZADO },
  { correo: 'ana+tienda@gmail.com', bug: BUG.B14_CORREO_VALIDO_RECHAZADO },
  { correo: 'ana@universidad.edu.co', bug: BUG.B14_CORREO_VALIDO_RECHAZADO },
];
const CORREOS_MAL_FORMADOS = ['ana.gmail.com', 'ana@', '@gmail.com', 'ana gomez@gmail.com', 'ana@@gmail.com', 'ana@gmail'];

const campo = (page: Page, etiqueta: string) => page.locator(`label:text-is("${etiqueta}") + input`);

/** Arrange común: abre la tienda, agrega un esfero y pasa al formulario de envío. */
async function irAlFormulario(page: Page) {
  await page.goto('/');
  const tarjeta = page
    .locator('.rounded-lg')
    .filter({ has: page.getByRole('heading', { name: 'Esfero azul', level: 3 }) });
  await tarjeta.getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Ir a pagar' }).click();
  await expect(page.getByRole('heading', { name: 'Datos de envío' })).toBeVisible();
}

test.describe('US-13 · Ir a pagar desde el carrito', () => {
  test('CA3: con total cero o negativo no se puede ir a pagar', async ({ page }) => {
    test.fail(true, BUG.B11_TOTAL_CERO);
    // ARRANGE: 1 mochila y "−" para llevar la cantidad a 0 (posible hoy por el bug B05).
    // OJO: cuando corrijan B05 esta preparación deja de funcionar (el "−" ya no baja de 1) y la prueba fallará en
    // la línea del "$ 0". En ese momento hay que buscar otra forma de llegar a total 0 o retirar la prueba.
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();

    // ACT
    await page.getByRole('button', { name: 'Disminuir cantidad de Mochila escolar' }).click();

    // ASSERT: si el total es $ 0 (o menos), "Ir a pagar" debe estar deshabilitado.
    // Es OTRO criterio y OTRO bug que US-06 CA2: aunque se corrija el "−", falta validar el total antes de cobrar.
    await expect(page.locator('dt:text-is("Total") + dd')).toHaveText('$ 0');
    await expect(page.getByRole('button', { name: 'Ir a pagar' })).toBeDisabled();
  });
});

test.describe('US-14 · Completar mis datos de envío', () => {
  test('CA1: con el formulario vacío hay un error por cada campo obligatorio', async ({ page }) => {
    await irAlFormulario(page);

    await page.getByRole('button', { name: 'Confirmar pedido' }).click();

    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText('El correo es obligatorio.')).toBeVisible();
    await expect(page.getByText('La dirección es obligatoria.')).toBeVisible();
  });

  test('CA2: un nombre y una dirección de solo espacios se rechazan como vacíos', async ({ page }) => {
    await irAlFormulario(page);
    await campo(page, 'Nombre completo').fill('   ');
    await campo(page, 'Correo electrónico').fill('ana@correo.com');
    await campo(page, 'Dirección de entrega').fill('   ');

    await page.getByRole('button', { name: 'Confirmar pedido' }).click();

    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText('La dirección es obligatoria.')).toBeVisible();
    await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toHaveCount(0);
  });
});

test.describe('US-15 · Ingresar un correo electrónico válido', () => {
  // PRUEBAS DIRIGIDAS POR DATOS: una prueba por correo. Solo las filas que hoy fallan quedan como fallo esperado.
  for (const { correo, bug } of CORREOS_VALIDOS) {
    test(`CA1-CA3: el correo válido ${correo} se acepta`, async ({ page }) => {
      test.fail(bug !== '', bug);
      await irAlFormulario(page);
      await campo(page, 'Nombre completo').fill('Ana Gómez');
      await campo(page, 'Correo electrónico').fill(correo);
      await campo(page, 'Dirección de entrega').fill('Calle 10 # 20-30');

      await page.getByRole('button', { name: 'Confirmar pedido' }).click();

      await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible();
    });
  }

  for (const correo of CORREOS_MAL_FORMADOS) {
    test(`CA4: el correo mal formado "${correo}" se rechaza con un mensaje claro`, async ({ page }) => {
      await irAlFormulario(page);
      await campo(page, 'Nombre completo').fill('Ana Gómez');
      await campo(page, 'Correo electrónico').fill(correo);
      await campo(page, 'Dirección de entrega').fill('Calle 10 # 20-30');

      await page.getByRole('button', { name: 'Confirmar pedido' }).click();

      await expect(page.getByText('El correo no tiene un formato válido.')).toBeVisible();
      await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toHaveCount(0);
    });
  }
});
