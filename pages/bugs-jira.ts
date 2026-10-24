/**
 * Bugs del producto que detecta la suite, con su clave de Jira (issue "BUG US-xx" del proyecto CDC).
 * Entre paréntesis va el código interno del bug (B03, B04…).
 */
export const BUG = {
  B03_STOCK_SUMA: 'CDC-14 (B03) · 4 + 4 mochilas supera el stock de 6',
  B04_MAS_SIN_TOPE: 'CDC-17 (B04) · "+" sube la cantidad por encima del stock',
  B05_MENOS_SIN_PISO: 'CDC-20 (B05) · "−" deja la cantidad en 0 y en negativo',
  B07_MAYUSCULAS: 'CDC-30 (B07) · los códigos en minúsculas o mezclados no se reconocen',
  B09_INVALIDO_BORRA: 'CDC-33 (B09) · un código inválido borra el descuento ya aplicado',
  B10_IVA_SIN_DESCUENTO: 'CDC-36 (B10) · el IVA se calcula sobre el subtotal sin restar el descuento',
  B10_TOTAL_CON_DESCUENTO: 'CDC-39 (B10) · el total con descuento sale mal porque el IVA no resta el descuento',
  B11_TOTAL_CERO: 'CDC-42 (B11) · "Ir a pagar" no valida un total cero o negativo',
  B14_CORREO_VALIDO_RECHAZADO: 'CDC-48 (B14) · correos válidos con punto, guion, + o dominio compuesto se rechazan',
  B16_FORMULARIO_CON_DATOS: 'CDC-51 (B16) · el formulario conserva los datos de la compra anterior',
  B17_PEDIDO_REPETIDO: 'CDC-54 (B17) · tras recargar, el número de pedido se repite',
} as const;
