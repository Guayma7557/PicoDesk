/* ==========================================================================
   secuencia_fondo_nivel_3.js
   Introducción visual del nivel: "Fondo inclinado - Nivel 4" cubre toda la
   pantalla y, a los 3 segundos, hace un cross-fade con "Fondo superior -
   Nivel 4" (una se apaga mientras la otra se prende al mismo tiempo). Las
   ranuras de la primera etapa (la GPU) aparecen en ese mismo momento.
   Cuando se colocan todas las GPU, herramientas_nivel_3.js dispara el
   siguiente cross-fade (hacia "Fondo superior - GPU").
   ========================================================================== */

(function () {
  const fondoMarco = document.querySelector(".fondo-marco");
  const fondoInclinado = document.querySelector(".fondo-inclinado");
  if (!fondoMarco || !fondoInclinado) return;

  const DEMORA_FADE_MS = 3000;

  setTimeout(() => {
    fondoMarco.classList.add("nivel-listo");
  }, DEMORA_FADE_MS);

  // Una vez terminado el cross-fade, sacamos "Fondo inclinado" de la
  // accesibilidad; ya cumplió su función y queda "Fondo superior" visible.
  fondoInclinado.addEventListener("transitionend", (evento) => {
    if (evento.propertyName === "opacity" && fondoMarco.classList.contains("nivel-listo")) {
      fondoInclinado.setAttribute("aria-hidden", "true");
    }
  });
})();
