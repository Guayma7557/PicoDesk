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
  const introOverlay = document.getElementById("pantalla-intro");
  const btnSkip = document.getElementById("btn-skip");
  
  if (!fondoMarco || !fondoInclinado || !introOverlay) return;

  let timeoutFondo;

  introOverlay.addEventListener("click", () => {
    introOverlay.classList.add("oculto");
    btnSkip.classList.remove("oculto");
    timeoutFondo = setTimeout(avanzarFondo, 3000);
  });

  btnSkip.addEventListener("click", avanzarFondo);

  function avanzarFondo() {
    clearTimeout(timeoutFondo);
    btnSkip.classList.add("oculto");
    fondoMarco.classList.add("nivel-listo");
  }
})();