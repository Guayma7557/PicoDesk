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
  const introOverlay = document.getElementById("pantalla-intro");
  const btnSkip = document.getElementById("btn-skip");
  
  if (!fondoMarco || !fondoInclinado || !introOverlay) return;

  let timeoutFondo;

  // Iniciar secuencia solo cuando el usuario hace clic en la intro
  introOverlay.addEventListener("click", () => {
    introOverlay.classList.add("oculto");
    btnSkip.classList.remove("oculto");

    timeoutFondo = setTimeout(avanzarFondo, 3000);
  });

  // Botón para saltar la animación
  btnSkip.addEventListener("click", avanzarFondo);

  function avanzarFondo() {
    clearTimeout(timeoutFondo);
    btnSkip.classList.add("oculto");
    fondoMarco.classList.add("nivel-listo");
  }

  fondoInclinado.addEventListener("transitionend", (evento) => {
    if (evento.propertyName === "opacity" && fondoMarco.classList.contains("nivel-listo")) {
      fondoInclinado.setAttribute("aria-hidden", "true");
    }
  });
})();
