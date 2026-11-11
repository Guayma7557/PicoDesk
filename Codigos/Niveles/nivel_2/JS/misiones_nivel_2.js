/* ==========================================================================
   misiones_nivel_2.js
   Panel de misiones del nivel 2: se muestran de a una. Al completar la
   misión activa, se marca en verde y recién ahí aparece la siguiente:
     1) Colocar la CPU
     2) Colocar la RAM (las 2 memorias, en cualquier orden)
     3) Presionar los 4 seguros de la RAM (hay que presionar los 4)
   Al completarse la ÚLTIMA misión (barra al 100%) se espera
   DEMORA_REDIRECCION_MS (2 segundos) y recién entonces se pasa a la
   pantalla de intermisión. Esa misma fórmula es la que se usa en todos los
   niveles: completar la última misión -> pausa de 2 s -> intermisión.
   No necesita tocar herramientas_nivel_2.js: escucha los mismos eventos
   personalizados que ese archivo ya dispara.
   ========================================================================== */

(function () {
  // Pantalla a la que se pasa al completar la última misión: la intermisión.
  // Es relativa a la ubicación de nivel_2.html (mismo criterio que
  // RUTA_MENU_PRINCIPAL en nivel_2.js).
  const RUTA_SIGUIENTE_NIVEL = "../../IntermisionesIndex.html";

  // Pausa (en ms) entre completar la última misión y pasar a la intermisión.
  const DEMORA_REDIRECCION_MS = 2000;
  let redireccionProgramada = false;

  const lista = document.querySelector(".panel-misiones__lista");
  if (!lista) return;

  const misionPlaca = lista.querySelector('[data-mision="colocar-placa"]');
  const misionRam = lista.querySelector('[data-mision="colocar-ram"]');
  const textoRam = misionRam ? misionRam.querySelector(".mision__texto") : null;
  const misionPresionar = lista.querySelector('[data-mision="presionar-ram"]');
  const textoPresionar = misionPresionar ? misionPresionar.querySelector(".mision__texto") : null;

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
  }

  function completarMision(mision, siguienteMision) {
    if (!mision || mision.classList.contains("completada")) return;

    mision.classList.add("completada");
    if (siguienteMision) siguienteMision.classList.remove("oculta");
    actualizarBarraProgreso();

    // Última misión completada (todas en verde): pausa de 2 s y a la
    // intermisión.
    const todasCompletas =
      lista.querySelectorAll(".mision.completada").length === totalMisiones;
    if (todasCompletas && !redireccionProgramada) {
      redireccionProgramada = true;
      setTimeout(() => {
        window.location.href = RUTA_SIGUIENTE_NIVEL;
      }, DEMORA_REDIRECCION_MS);
    }
  }

  // Misión 1: se completa apenas se coloca la CPU y desbloquea la misión 2.
  document.addEventListener("nivel2:placaColocada", () => {
    completarMision(misionPlaca, misionRam);
  });

  // Misión 2 (progreso): actualiza el contador "(1/2)" cada vez que entra
  // una memoria, sin importar cuál ni en qué ranura.
  document.addEventListener("nivel2:ramColocada", (evento) => {
    const { colocadas, total } = evento.detail;
    if (textoRam) textoRam.textContent = `Colocar la RAM (${colocadas}/${total})`;
  });

  // Misión 2: se completa cuando las dos RAM ya están colocadas y desbloquea
  // la misión 3.
  document.addEventListener("nivel2:ramesColocadas", () => {
    completarMision(misionRam, misionPresionar);
  });

  // Misión 3 (progreso): contador "(1/4)" cada vez que se presiona un seguro.
  document.addEventListener("nivel2:seguroPresionado", (evento) => {
    const { presionados, total } = evento.detail;
    if (textoPresionar) {
      textoPresionar.textContent = `Presionar los seguros de la RAM (${presionados}/${total})`;
    }
  });

  // Misión 3 (última): se completa recién cuando se presionaron LOS 4 seguros.
  // La barra llega a 100% y arranca la espera hacia la intermisión.
  document.addEventListener("nivel2:nivelCompletado", () => {
    completarMision(misionPresionar, null);
  });
})();