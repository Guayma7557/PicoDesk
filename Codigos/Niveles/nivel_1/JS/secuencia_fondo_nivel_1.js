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

        // Iniciar el tutorial
    window.iniciarTutorial([
      {
        selector: '.panel-misiones',
        titulo: 'Sigue las misiones',
        texto: 'Arriba a la derecha verás los pasos a seguir. ¡Completalos todos para armar la computadora!'
      },
      {
        selector: '.barra-herramientas',
        titulo: 'Arrastra y suelta',
        texto: 'Haz clic sostenido sobre la placa madre y los tornillos para arrastrarlos a su lugar.'
      },
      {
        selector: '.barra-herramientas__item[data-herramienta="destornillador"]',
        titulo: 'Usa el destornillador',
        texto: 'Selecciona el destornillador haciendo clic, y luego haz clic sobre cada tornillo para ajustarlo.'
      }
    ], 'tutorial_nivel_1_visto');
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
