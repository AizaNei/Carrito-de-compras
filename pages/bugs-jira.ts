/**
 * Claves de Jira de los bugs que detecta la suite, en un solo lugar.
 *
 * ⚠️ REEMPLAZAR: cada 'CDC-??' por la clave real del issue en Jira (ej. 'CDC-14').
 * El código entre paréntesis (B03, B04…) es el del documento "Bugs y depuración · QA Tienda Escolar".
 * Así, cuando el docente lea el reporte, cada fallo esperado dice qué issue lo documenta.
 */
export const BUG = {
  B03_STOCK_SUMA: 'CDC-?? (B03) · 4 + 4 mochilas supera el stock de 6',
  B04_MAS_SIN_TOPE: 'CDC-?? (B04) · "+" sube la cantidad por encima del stock',
  B05_MENOS_SIN_PISO: 'CDC-?? (B05) · "−" deja la cantidad en 0 y en negativo',
  B07_MAYUSCULAS: 'CDC-?? (B07) · los códigos en minúsculas o mezclados no se reconocen',
  B09_INVALIDO_BORRA: 'CDC-?? (B09) · un código inválido borra el descuento ya aplicado',
  B10_IVA_SIN_DESCUENTO: 'CDC-?? (B10) · el IVA se calcula sobre el subtotal sin restar el descuento',
  B11_TOTAL_CERO: 'CDC-?? (B11) · "Ir a pagar" no valida un total cero o negativo',
  B14_CORREO_VALIDO_RECHAZADO: 'CDC-?? (B14) · correos válidos con punto, guion, + o dominio compuesto se rechazan',
  B16_FORMULARIO_CON_DATOS: 'CDC-?? (B16) · el formulario conserva los datos de la compra anterior',
  B17_PEDIDO_REPETIDO: 'CDC-?? (B17) · tras recargar, el número de pedido se repite',
} as const;
