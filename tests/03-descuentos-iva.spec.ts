import { test, expect, type Page } from '@playwright/test';
import { BUG } from '../pages/bugs-jira';

/**
 * BLOQUE DESCUENTOS E IMPUESTOS · US-09 a US-12.
 * Valores útiles (producto: Mochila escolar, $ 65.000): DESC10 → descuento $ 6.500 · DESC20 → $ 13.000.
 */

const PRECIO_MOCHILA = 65000;
const IVA = 0.19;

/** Formatea un número como lo hace la tienda: "$ 65.000". */
const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/** Arrange común: abre la tienda y agrega mochilas. Devuelve el panel del carrito. */
async function abrirConMochilas(page: Page, cantidad = 1) {
  await page.goto('/');
  const tarjeta = page
    .locator('.rounded-lg')
    .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });
  await tarjeta.getByRole('spinbutton').fill(String(cantidad));
  await tarjeta.getByRole('button', { name: 'Agregar' }).click();
  const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
  await expect(carrito.getByRole('listitem').filter({ hasText: 'Mochila escolar' })).toBeVisible();
  return carrito;
}

async function aplicar(page: Page, codigo: string) {
  await page.getByPlaceholder('Código de descuento').fill(codigo);
  await page.getByRole('button', { name: 'Aplicar' }).click();
}

/** Valor de una fila del resumen del carrito (la fila de descuento dice "Descuento (10%)"). */
const fila = (page: Page, texto: 'Subtotal' | 'Descuento' | 'IVA' | 'Total') =>
  page
    .locator('dl > div')
    // "Total" exacto (si no, también encontraría "Subtotal"); "Descuento (10%)" e "IVA (19%)" empiezan por el texto.
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${texto}\\b`) }) })
    .locator('dd');

test.describe('US-09 · Aplicar un código de descuento', () => {
  test('CA1: DESC10 descuenta el 10% del subtotal', async ({ page }) => {
    await abrirConMochilas(page);

    await aplicar(page, 'DESC10');

    await expect(fila(page, 'Descuento')).toContainText(cop(PRECIO_MOCHILA * 0.1)); // $ 6.500
  });

  // PRUEBA DIRIGIDA POR DATOS: una prueba por variante; solo las filas con bug quedan como fallo esperado.
  const VARIANTES = [
    { codigo: 'desc10', bug: BUG.B07_MAYUSCULAS },
    { codigo: 'Desc10', bug: BUG.B07_MAYUSCULAS },
    { codigo: ' DESC10 ', bug: '' }, // los espacios sobrantes sí se toleran
  ];
  for (const { codigo, bug } of VARIANTES) {
    test(`CA3: el código "${codigo}" se reconoce igual que DESC10`, async ({ page }) => {
      test.fail(bug !== '', bug);
      await abrirConMochilas(page);

      await aplicar(page, codigo);

      await expect(fila(page, 'Descuento')).toContainText(cop(PRECIO_MOCHILA * 0.1));
    });
  }
});

test.describe('US-10 · Recibir aviso si el código no es válido', () => {
  test('CA1: un código inexistente muestra el aviso y el total no cambia', async ({ page }) => {
    const carrito = await abrirConMochilas(page);
    await expect(fila(page, 'Total')).toHaveText('$ 77.350');

    await aplicar(page, 'ABC123');

    await expect(carrito.getByText('Código de descuento no válido.', { exact: true })).toBeVisible();
    await expect(fila(page, 'Total')).toHaveText('$ 77.350');
  });

  test('CA2: un código inválido NO borra un descuento válido ya aplicado', async ({ page }) => {
    test.fail(true, BUG.B09_INVALIDO_BORRA);
    await abrirConMochilas(page);
    await aplicar(page, 'DESC10');
    await expect(fila(page, 'Descuento')).toContainText('$ 6.500'); // quedó aplicado

    await aplicar(page, 'ABC123');

    await expect(fila(page, 'Descuento')).toContainText('$ 6.500');
  });
});

test.describe('US-11 · Ver el IVA correcto', () => {
  test('CA2: con descuento, el IVA se calcula sobre el valor descontado', async ({ page }) => {
    test.fail(true, BUG.B10_IVA_SIN_DESCUENTO);
    await abrirConMochilas(page);

    await aplicar(page, 'DESC10');

    // ORÁCULO: el valor esperado sale del requisito (RF-07), no de lo que muestra la tienda.
    const descuento = PRECIO_MOCHILA * 0.1;
    const ivaEsperado = (PRECIO_MOCHILA - descuento) * IVA; // $ 11.115
    await expect(fila(page, 'IVA')).toHaveText(cop(ivaEsperado));
  });
});

test.describe('US-12 · Ver el total a pagar correcto', () => {
  // Misma causa que US-11 CA2 (page.tsx calcula el IVA antes del descuento), pero es otro criterio:
  // en Jira es el bug de US-12 (CDC-39), enlazado al de US-11 (CDC-36).
  test('CA2: con descuento, el total es subtotal − descuento + IVA (IVA sobre lo descontado)', async ({ page }) => {
    test.fail(true, BUG.B10_TOTAL_CON_DESCUENTO);
    await abrirConMochilas(page);

    await aplicar(page, 'DESC10');

    const descuento = PRECIO_MOCHILA * 0.1;
    const totalEsperado = PRECIO_MOCHILA - descuento + (PRECIO_MOCHILA - descuento) * IVA; // $ 69.615
    await expect(fila(page, 'Total')).toHaveText(cop(totalEsperado));
  });
});
