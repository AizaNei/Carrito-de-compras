# Entrega · Laboratorio 3.1 · Introducción a la automatización de pruebas

**Equipo:** `equipo-N` · **Integrantes:** Neiver Fernández · **Repositorio:** https://github.com/AizaNei/Carrito-de-compras

> ⚠️ Antes de entregar: reemplacen `equipo-N` por el número del equipo.
> Las claves de Jira de los bugs están en un solo lugar: `pages/bugs-jira.ts` (y en la tabla 2 de abajo).

## 1. ¿Qué automatizamos y por qué? (decisión)

| Criterio (US-xx · CAy) | ¿Automatizamos? | Por qué (frecuencia · riesgo · estabilidad · facilidad de verificar) |
|---|---|---|
| US-04 · CA2 | Sí | Se repite en cada compra; riesgo alto (vender lo que no hay); el aviso y el carrito vacío se verifican exacto. |
| US-04 · CA3 | Sí (cazabugs) | Mismo riesgo que CA2 pero sumando agregados; a mano es tedioso repetir 4 + 4. Destapa B03. |
| US-05 · CA2 | Sí (cazabugs) | Un clic y un número: estable y fácil de verificar. Destapa B04. |
| US-06 · CA2 | Sí (cazabugs) | Caso borde que a mano se olvida; el resultado es un número. Destapa B05. |
| US-07 · CA2 | Sí | Flujo básico que se usa siempre; verificación simple (mensaje + total $ 0). |
| US-09 · CA1 y CA3 | Sí (dirigida por datos) | Muchas variantes del mismo dato: ideal para una tabla; a mano es repetitivo. Destapa B07. |
| US-10 · CA1 y CA2 | Sí | Mensaje exacto y montos: verificación precisa. CA2 destapa B09. |
| US-11 · CA2 y US-12 · CA2 | Sí (cazabugs) | Riesgo más alto de la tienda (cobra mal). El oráculo se calcula en la prueba a partir del requisito. Destapa B10. |
| US-13 · CA3 | Sí (cazabugs) | Riesgo de cobrar $ 0; estado del botón fácil de verificar. Destapa B11. |
| US-14 · CA1 y CA2 | Sí | Validaciones del formulario: se repiten en cada cambio del checkout. |
| US-15 · CA1 a CA4 | Sí (dirigida por datos) | 12 correos: a mano son 12 compras. Destapa B14. |
| US-16 · CA1, US-17 · CA1 a CA3, US-19 · CA1 | Sí | Flujo completo de compra; con el Page Object se escribe una vez. US-16 y US-17 CA3 destapan B16 y B17. |
| US-01 · CA4 (responsive 375 px) | Más adelante | Se puede con `test.use({ viewport })`, pero "se ve bien" es un juicio visual; hoy lo revisamos a mano. |
| US-18 · CA3 (dirección larga) y US-20 · CA3 (contraste) | No | Son de apariencia: la máquina no sabe si "se ve bien" sin una herramienta de comparación visual. Se revisan a mano. |

## 2. Bugs que nuestra suite detecta

Todas quedaron con `test.fail(true, 'CLAVE · …')`. La evidencia es el reporte HTML (`npm run report`): cada una muestra la anotación con la clave arriba y el *Expected / Received* abajo.

| Prueba (archivo › título) | Bug en Jira (clave) | ¿Quedó con `test.fail(...)`? | Evidencia (Expected → Received) |
|---|---|---|---|
| 02-carrito › US-04 CA3: 4 + 4 mochilas supera el stock (6) y debe rechazarse | CDC-14 (B03) | Sí | cantidad "4" → "8" |
| 02-carrito › US-05 CA2: "+" no pasa del stock (6 mochilas) | CDC-17 (B04) | Sí | "6" → "7" |
| 02-carrito › US-06 CA2: con cantidad 1, "−" no la deja en 0 ni en negativo (se queda en 1) | CDC-20 (B05) | Sí | "1" → "0" |
| 03-descuentos-iva › US-09 CA3: el código "desc10" / "Desc10" se reconoce igual que DESC10 (2 filas) | CDC-30 (B07) | Sí, solo esas 2 filas | descuento "$ 6.500" → "$ 0" (" DESC10 " sí pasa) |
| 03-descuentos-iva › US-10 CA2: un código inválido NO borra un descuento válido ya aplicado | CDC-33 (B09) | Sí | "$ 6.500" → "$ 0" |
| 03-descuentos-iva › US-11 CA2: con descuento, el IVA se calcula sobre el valor descontado | CDC-36 (B10) | Sí | IVA "$ 11.115" → "$ 12.350" |
| 03-descuentos-iva › US-12 CA2: con descuento, el total es subtotal − descuento + IVA | CDC-39 (B10, misma causa) | Sí | total "$ 69.615" → "$ 70.850" |
| heredados › H2 · el IVA de 2 mochilas con DESC20 es $ 19.760 | CDC-36 (B10) | Sí | "$ 19.760" → "$ 24.700" |
| 04-checkout › US-13 CA3: con total cero o negativo no se puede ir a pagar | CDC-42 (B11) | Sí | botón *disabled* → *enabled* |
| 04-checkout › US-15 CA1-CA3: el correo válido … se acepta (4 filas: punto, guion, +, .edu.co) | CDC-48 (B14) | Sí, solo esas 4 filas | "¡Pedido confirmado!" no aparece (sale "El correo no tiene un formato válido.") |
| 05-confirmacion › US-16 CA1: tras confirmar y empezar otra compra, el formulario aparece vacío | CDC-51 (B16) | Sí | nombre "" → "Ana Gómez" |
| 05-confirmacion › US-17 CA3: un pedido hecho después de recargar no repite un número anterior | CDC-54 (B17) | Sí | segundo pedido = "1001" otra vez |

**US-11 CA2, US-12 CA2 y H2: ¿uno o varios bugs?** Un solo defecto (B10): los tres fallan por la misma línea (`page.tsx:91`, el IVA se calcula antes de restar el descuento). En Jira quedó un bug por criterio, CDC-36 (US-11) y CDC-39 (US-12), enlazados entre sí; H2 se comenta en CDC-36.

**US-15: ¿cuántas filas fallaron y qué tienen en común?** 4 de 6. Todas tienen un carácter que no es letra, número ni `_` (punto, guion, `+`) o un dominio con dos puntos. Es un solo bug: la expresión `/^\w+@\w+\.\w+$/` de `CheckoutForm.tsx:7`.

**Comprobación de que las pruebas sirven:** corrimos la suite contra una copia de la tienda con las correcciones del documento de bugs. 16 de los 17 fallos esperados pasaron a *"Expected to fail, but passed"*, es decir, las pruebas detectan cuando el bug se corrige. La excepción es US-13 CA3: con el "−" corregido ya no se puede llegar a total $ 0, así que la prueba pierde su forma de preparar el caso (quedó anotado en el código).

## 3. Pruebas heredadas: nuestro diagnóstico

| Prueba | Veredicto (producto / prueba / inestable / entorno) | Cómo lo comprobamos | Qué hicimos |
|---|---|---|---|
| H1 · el catálogo tiene 6 productos | **Prueba** (dato viejo) | Falla siempre con Expected 6 / Received 8. A mano la tienda muestra 8 productos y US-01 CA1 pide 8; el 6 es el mínimo de RF-01, no el valor del criterio. | Corregimos la prueba para esperar 8 y le cambiamos el título. |
| H2 · el IVA de 2 mochilas con DESC20… | **Producto** (B10) | Recalculamos el oráculo: $ 130.000 − 20 % = $ 104.000; 19 % = $ 19.760. La tienda muestra $ 24.700 (19 % de $ 130.000). Falla siempre igual y se reproduce a mano. | La dejamos como fallo esperado: `test.fail(true, 'CDC-36 (B10) · …')`. |
| H3 · agregar un cuaderno justo después de cargar | **Inestable** | Con la tienda en línea: `npx playwright test heredados -g H3 --repeat-each=10` → **\_\_ pasan / \_\_ fallan** (anotar el resultado real). Usaba `waitUntil: 'domcontentloaded'` y hacía clic en el HTML del servidor antes de que React terminara de cargar la página: ese clic se pierde. | Quitamos `domcontentloaded` (ahora espera a `load`), ubicamos el botón por la tarjeta del cuaderno (no `.first()`) y esperamos una condición, no un tiempo: el clic se repite solo si el anterior no tuvo efecto, y se verifica "1 artículo(s)". Sin `waitForTimeout`. |

## 4. Medidas

- Casos de prueba de nuestro plan en Jira: **\_\_** · automatizados en este laboratorio: **\_\_** (**\_\_ %**)
- Tiempo que nos tomó escribir las pruebas automatizadas: **\_\_ min** · tiempo de ejecutar toda la suite: **≈ 35 s** (41 pruebas, 4 *workers*; ≈ 1,6 min con 1 *worker*)
- Tiempo estimado de ejecutar **a mano** esos mismos casos: **\_\_ min** (referencia: ~1 min por caso → ≈ 40 min)
- Con esos números, ¿en cuántas ejecuciones se paga la automatización? (inversión ÷ ahorro por ejecución): **\_\_**

## 5. Reflexión (máximo 5 líneas cada una)

1. **¿Qué casos no automatizaríamos?** Los de apariencia: responsive a 375 px (US-01 CA4), la dirección larga que desborda la tarjeta (US-18 CA3) y el contraste del botón ✕ (US-20 CA3). Una máquina sabe si un elemento existe, pero no si "se ve bien"; eso lo revisa mejor una persona.
2. **Si la tienda cambia el HTML de un botón:** se rompen los localizadores. En `05-confirmacion` se corrige una línea en `TiendaPage.ts` y las pruebas no se tocan; en los archivos que no migramos habría que cambiar cada prueba que repite ese localizador. Eso es lo que aportó el Page Object.
3. **Una prueba roja que no era un bug:** H1. Al reproducirla a mano la tienda mostraba 8 productos, igual que el criterio; el que estaba mal era el 6 de la prueba. También H3, que pasaba y fallaba sin cambiar nada.
4. **Lo que la automatización no habría encontrado sola:** que `getByLabel` no encuentra los campos (B19) lo vimos porque la prueba no funcionaba, no porque una aserción lo comprobara. Tampoco el contraste del ✕ (B21) ni el desborde de la dirección (B18). Y el código "constructor" (B22) salió de leer el código, no de los datos de la prueba.
5. **En un proyecto real:** escribiríamos el Page Object desde el principio, correríamos la suite en cada *pull request* y le pediríamos a desarrollo atributos estables (`data-testid` o `<label for>`) en vez de depender de clases como `.rounded-lg`.
