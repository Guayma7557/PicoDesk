/* ==========================================================================
   secuencia-fondo-nivel1.js
   Introducción visual del nivel: "Fondo inclinado - Nivel 1" cubre toda la
   pantalla y, a los 3 segundos, hace un cross-fade con "Fondo superior -
   Nivel 1" (una se apaga mientras la otra se prende al mismo tiempo). La
   zona de la placa madre (marco rojo + etiqueta) aparece en ese mismo
   momento; los puntos de fijación siguen ocultos hasta que se coloca la
   placa madre (ver herramientas_nivel_1.js).
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
