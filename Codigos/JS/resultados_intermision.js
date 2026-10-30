/* ==========================================================================
   resultados-intermision.js
   Lee el resultado del último nivel jugado (guardado en sessionStorage por
   el script de puntaje del nivel correspondiente, ej. puntaje-nivel1.js) y
   lo muestra en la pantalla de Intermisión.

   Usa una clave genérica ("resultadoNivel") para que este mismo script
   sirva para cualquier nivel futuro, sin tener que tocarlo cada vez que
   se agregue uno nuevo.
   ========================================================================== */

(function () {
  const CLAVE_SESSION_STORAGE = "resultadoNivel";

  const elNumeroNivel = document.querySelector("#numero-nivel");
  const elValorPuntaje = document.querySelector("#valor-puntaje");
  const elValorTiempo = document.querySelector("#valor-tiempo");

  let resultado = null;
  try {
    const guardado = sessionStorage.getItem(CLAVE_SESSION_STORAGE);
    if (guardado) resultado = JSON.parse(guardado);
  } catch (error) {
    console.error("No se pudo leer el resultado del nivel:", error);
  }

  // Si se entra a la Intermisión sin haber jugado un nivel (ej. accediendo
  // directo por URL), no hay nada guardado: dejamos los placeholders del
  // HTML en vez de romper la página.
  if (!resultado) return;

  if (elNumeroNivel) elNumeroNivel.textContent = resultado.nivel;
  if (elValorPuntaje) elValorPuntaje.textContent = resultado.puntaje;
  if (elValorTiempo) elValorTiempo.textContent = resultado.tiempoTexto;
})();