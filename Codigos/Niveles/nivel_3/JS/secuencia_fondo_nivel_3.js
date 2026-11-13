/* ==========================================================================
   secuencia_fondo_nivel_3.js
   Introducción visual del nivel: "Fondo inclinado - Nivel 4" cubre toda la
   pantalla y, a los 3 segundos, hace un cross-fade con "Fondo superior -
   Nivel 4". Las ranuras de la primera etapa (la GPU) aparecen en ese mismo
   momento. Cuando se colocan todas las GPU, herramientas_nivel_3.js dispara
   el siguiente cross-fade (hacia "Fondo superior - GPU").
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

    // Iniciar el tutorial
    window.iniciarTutorial([
      {
        selector: '.barra-herramientas',
        titulo: 'Arma y conecta todo',
        texto: 'Arrastra las GPUs, haz clic para encajarlas. Luego arrastra el disco duro, deslízalo bajo el rack y finalmente conecta su cable arrastrándolo hacia la placa madre.'
      }
    ], 'tutorial_nivel_3_visto');

  });

  // Botón para saltar la animación
  btnSkip.addEventListener("click", avanzarFondo);

  function avanzarFondo() {
    clearTimeout(timeoutFondo);
    btnSkip.classList.add("oculto");
    fondoMarco.classList.add("nivel-listo");
  }

  // Una vez terminado el cross-fade, sacamos "Fondo inclinado" de la
  // accesibilidad; ya cumplió su función y queda "Fondo superior" visible.
  fondoInclinado.addEventListener("transitionend", (evento) => {
    if (evento.propertyName === "opacity" && fondoMarco.classList.contains("nivel-listo")) {
      fondoInclinado.setAttribute("aria-hidden", "true");
    }
  });
})();