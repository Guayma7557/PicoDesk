/* ==========================================================================
   misiones-nivel1.js
   Panel de misiones del nivel 1: se muestran de a una. Al completar la
   misión activa, se marca en verde y recién ahí aparece la siguiente.
   No necesita tocar herramientas-nivel1.js: escucha los mismos eventos
   personalizados que ese archivo ya dispara.
   ========================================================================== */

(function () {
  // Ruta a la que se redirige al completar el 100% del nivel: la pantalla
  // de intermisión. Es relativa a la ubicación de nivel_1.html (mismo
  // criterio que RUTA_MENU_PRINCIPAL en nivel_1.js).
  const RUTA_SIGUIENTE_NIVEL = "../../Intermisiones/IntermisionesIndex.html";

  // Cuánto se espera (en ms) antes de redirigir, para que el jugador
  // llegue a ver la barra en 100% y la última misión en verde.
  const DEMORA_REDIRECCION_MS = 1200;

  const lista = document.querySelector(".panel-misiones__lista");
  if (!lista) return;

  const misionPlaca = lista.querySelector('[data-mision="colocar-placa"]');
  const misionTornillos = lista.querySelector('[data-mision="colocar-tornillos"]');
  const misionAjustar = lista.querySelector('[data-mision="ajustar-tornillos"]');

  // NUEVO: conexión con la barra de progreso lateral. El % se calcula
  // dinámicamente según la cantidad total de misiones, así que si se agrega
  // o saca alguna misión más adelante no hay que tocar este cálculo.
  const barraProgreso = document.querySelector(".barra-progreso");
  const relleno = document.querySelector(".barra-progreso__relleno");
  const totalMisiones = lista.querySelectorAll(".mision").length;

  function actualizarBarraProgreso() {
    if (!relleno || !totalMisiones) return;

    const completadas = lista.querySelectorAll(".mision.completada").length;
    const porcentaje = Math.round((completadas / totalMisiones) * 100);

    relleno.style.setProperty("--progreso", `${porcentaje}%`);
    if (barraProgreso) barraProgreso.setAttribute("aria-valuenow", String(porcentaje));

    if (porcentaje >= 100) {
      setTimeout(() => {
        window.location.href = RUTA_SIGUIENTE_NIVEL;
      }, DEMORA_REDIRECCION_MS);
    }
  }

  function completarMision(mision, siguienteMision) {
    if (!mision || mision.classList.contains("completada")) return;

    mision.classList.add("completada");
    if (siguienteMision) siguienteMision.classList.remove("oculta");
    actualizarBarraProgreso();
  }

  // Misión 1: se completa apenas se coloca la placa madre.
  document.addEventListener("nivel1:placaColocada", () => {
    completarMision(misionPlaca, misionTornillos);
  });

  // Misión 2: se completa cuando ya no quedan tornillos por colocar.
  document.addEventListener("nivel1:tornilloColocado", () => {
    const itemTornillo = document.querySelector('[data-herramienta="tornillo"]');
    const restantes = itemTornillo
      ? parseInt(itemTornillo.dataset.usosRestantes, 10)
      : null;

    if (restantes === 0) {
      completarMision(misionTornillos, misionAjustar);
    }
  });

  // Misión 3 (última): se completa cuando los 6 tornillos ya están apretados.
  // "nivel1:pasoCompletado" es el evento que herramientas-nivel1.js dispara
  // justo quando todos los puntos de fijación quedan con data-apretado="true".
  document.addEventListener("nivel1:pasoCompletado", () => {
    completarMision(misionAjustar, null);
    // La barra llega a 100% y redirige sola (ver actualizarBarraProgreso).
  });
})();