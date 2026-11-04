/* ==========================================================================
   secuencia_fondo_nivel_2.js
   Introducción visual del nivel: "Fondo inclinado - Nivel 2" cubre toda la
   pantalla y, a los 3 segundos, hace un cross-fade con "Fondo superior -
   Nivel 2" (una se apaga mientras la otra se prende al mismo tiempo). La
   zona de la CPU (marco rojo + etiqueta) aparece en ese mismo momento.
   Cuando se coloca la CPU, herramientas_nivel_2.js dispara el siguiente
   cross-fade (hacia "Fondo superior - Nivel 3") y deja a la vista las
   ranuras de RAM.
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
