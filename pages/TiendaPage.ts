import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object de la tienda: acciones (agregar, aplicarCodigo…) y localizadores (cantidad, total…).
 * Las aserciones se hacen en las pruebas.
 */

export const DATOS_VALIDOS = {
  nombre: 'Ana Gómez',
  correo: 'ana@correo.com',
  direccion: 'Calle 10 # 20-30',
};

export class TiendaPage {
  /** El panel del carrito (la tarjeta que tiene el encabezado "Carrito"). */
  readonly carrito: Locator;
  /** El encabezado de la página (donde está el contador "N artículo(s)"). */
  readonly encabezado: Locator;

  constructor(readonly page: Page) {
    this.carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    this.encabezado = page.getByRole('banner');
  }

  // ---------- Catálogo ----------
  /** Abre la tienda. */
  async abrir(): Promise<void> {
    await this.page.goto('/');
  }

  /** La tarjeta de un producto del catálogo. */
  tarjeta(producto: string): Locator {
    return this.page
      .locator('.rounded-lg')
      .filter({ has: this.page.getByRole('heading', { name: producto, level: 3 }) });
  }

  /** Escribe la cantidad en la tarjeta del producto y presiona "Agregar". */
  async agregar(producto: string, cantidad = 1): Promise<void> {
    const tarjeta = this.tarjeta(producto);
    await tarjeta.getByRole('spinbutton').fill(String(cantidad));
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();
  }

  // ---------- Carrito ----------
  /** La línea del carrito de un producto. */
  linea(producto: string): Locator {
    return this.carrito.getByRole('listitem').filter({ hasText: producto });
  }

  /** El número de unidades que muestra el carrito para un producto. */
  cantidad(producto: string): Locator {
    return this.linea(producto).locator('span');
  }

  /** Presiona "+" en la línea del producto. */
  async aumentar(producto: string): Promise<void> {
    await this.page.getByRole('button', { name: `Aumentar cantidad de ${producto}` }).click();
  }

  /** Presiona "−" en la línea del producto. */
  async disminuir(producto: string): Promise<void> {
    await this.page.getByRole('button', { name: `Disminuir cantidad de ${producto}` }).click();
  }

  /** Escribe el código y presiona "Aplicar". */
  async aplicarCodigo(codigo: string): Promise<void> {
    await this.page.getByPlaceholder('Código de descuento').fill(codigo);
    await this.page.getByRole('button', { name: 'Aplicar' }).click();
  }

  /** Valor de una fila del resumen: 'Subtotal', 'Descuento', 'IVA' o 'Total'. */
  total(fila: 'Subtotal' | 'Descuento' | 'IVA' | 'Total'): Locator {
    // La fila "Descuento" incluye el porcentaje ("Descuento (10%)") y la del IVA dice "IVA (19%)".
    // Se busca por el comienzo del texto: "Total" no debe encontrar también "Subtotal".
    return this.carrito
      .locator('dl > div')
      .filter({ has: this.page.locator('dt', { hasText: new RegExp(`^${fila}\\b`) }) })
      .locator('dd');
  }

  /** El botón "Ir a pagar". */
  get botonIrAPagar(): Locator {
    return this.page.getByRole('button', { name: 'Ir a pagar' });
  }

  /** Presiona "Ir a pagar". */
  async irAPagar(): Promise<void> {
    await this.botonIrAPagar.click();
  }

  // ---------- Checkout y confirmación ----------
  /** Un campo del formulario de envío, por el texto de su etiqueta. (getByLabel no funciona: ver bug B19.) */
  campo(etiqueta: 'Nombre completo' | 'Correo electrónico' | 'Dirección de entrega'): Locator {
    return this.page.locator(`label:text-is("${etiqueta}") + input`);
  }

  /** Llena el formulario con los datos que reciba. */
  async llenarDatos(datos: { nombre?: string; correo?: string; direccion?: string }): Promise<void> {
    if (datos.nombre !== undefined) await this.campo('Nombre completo').fill(datos.nombre);
    if (datos.correo !== undefined) await this.campo('Correo electrónico').fill(datos.correo);
    if (datos.direccion !== undefined) await this.campo('Dirección de entrega').fill(datos.direccion);
  }

  /** Presiona "Confirmar pedido". */
  async confirmar(): Promise<void> {
    await this.page.getByRole('button', { name: 'Confirmar pedido' }).click();
  }

  /** El encabezado "¡Pedido confirmado!". */
  get confirmacion(): Locator {
    return this.page.getByRole('heading', { name: '¡Pedido confirmado!' });
  }

  /** Lee el número de pedido de la pantalla de confirmación (ej. "1001"). */
  async numeroDePedido(): Promise<string> {
    const texto = await this.page.getByText(/Número de pedido:/).innerText();
    return texto.match(/#(\d+)/)?.[1] ?? '';
  }

  /** Presiona "Volver a la tienda" en la confirmación. */
  async volverALaTienda(): Promise<void> {
    await this.page.getByRole('button', { name: 'Volver a la tienda' }).click();
  }

  /** Atajo: compra completa de un producto con datos válidos, hasta ver "¡Pedido confirmado!". */
  async comprar(producto: string, datos = DATOS_VALIDOS): Promise<void> {
    await this.agregar(producto);
    await this.irAPagar();
    await this.llenarDatos(datos);
    await this.confirmar();
    await this.confirmacion.waitFor();
  }
}
