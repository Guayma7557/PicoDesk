/* ==========================================================================
   misiones_nivel_3.js
   Panel de misiones del nivel 3: se muestran de a una. Al completar la
   misión activa, se marca en verde y recién ahí aparece la siguiente (la
   siguiente en el HTML). Hoy son:
     GPU:         1) Colocar la GPU (las 2, en cualquier orden)
                  2) Presionar la GPU (las 2; hay que presionar las dos)
     Disco duro:  3) Colocar el disco duro
                  4) Presionar el disco duro
                  5) Deslizar el disco duro bajo el rack
   Cada <li> declara a qué componente y fase pertenece (data-componente /
   data-fase: colocar, presionar o deslizar), así que las misiones de otro
   componente se agregan solo en el HTML, sin tocar este archivo.
   Al completarse la ÚLTIMA misión (barra al 100%) se espera
   DEMORA_REDIRECCION_MS (2 segundos) y recién entonces se pasa a la
   pantalla de intermisión. Esa misma fórmula es la que se usa en todos los
   niveles: completar la última misión -> pausa de 2 s -> intermisión.
   No necesita tocar herramientas_nivel_3.js: escucha los mismos eventos
   personalizados que ese archivo ya dispara.
   ========================================================================== */

(function () {
  // Pantalla a la que se pasa al completar la última misión: la intermisión.
  // Es relativa a la ubicación de nivel_3.html (mismo criterio que
  // RUTA_MENU_PRINCIPAL en nivel_3.js).
  const RUTA_SIGUIENTE_NIVEL = "../../IntermisionesIndex.html";

  // Pausa (en ms) entre completar la última misión y pasar a la intermisión.
  const DEMORA_REDIRECCION_MS = 2000;
  let redireccionProgramada = false;

  const lista = document.querySelector(".panel-misiones__lista");
  if (!lista) return;

  const misiones = Array.from(lista.querySelectorAll(".mision"));

  // Conexión con la barra de progreso lateral. El % se calcula
  // dinámicamente según la cantidad total de misiones, así que si se agrega
  // o saca alguna misión más adelante no hay que tocar este cálculo.
  const barraProgreso = document.querySelector(".barra-progreso");
  const relleno = document.querySelector(".barra-progreso__relleno");
  const totalMisiones = misiones.length;

  function actualizarBarraProgreso() {
    if (!relleno || !totalMisiones) return;

    const completadas = lista.querySelectorAll(".mision.completada").length;
    const porcentaje = Math.round((completadas / totalMisiones) * 100);

    relleno.style.setProperty("--progreso", `${porcentaje}%`);
    if (barraProgreso) barraProgreso.setAttribute("aria-valuenow", String(porcentaje));
  }

  function buscarMision(componente, fase) {
    return (
      misiones.find((m) => m.dataset.componente === componente && m.dataset.fase === fase) || null
    );
  }

  // Cambia el contador "(1/2)" del texto de la misión (o lo agrega si no tenía).
  function actualizarContador(mision, actual, total) {
    const texto = mision ? mision.querySelector(".mision__texto") : null;
    if (!texto) return;
    const contador = `(${actual}/${total})`;
    texto.textContent = /\(\d+\/\d+\)/.test(texto.textContent)
      ? texto.textContent.replace(/\(\d+\/\d+\)/, contador)
      : `${texto.textContent} ${contador}`;
  }

  function completarMision(mision) {
    if (!mision || mision.classList.contains("completada")) return;

    mision.classList.add("completada");
    const siguiente = misiones[misiones.indexOf(mision) + 1];
    if (siguiente) siguiente.classList.remove("oculta");
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

  // Fase "colocar": contador (1/2) cada vez que entra una herramienta, sin
  // importar cuál ni en qué ranura; se completa cuando están todas colocadas.
  document.addEventListener("nivel3:componenteColocado", (evento) => {
    const { componente, colocados, total } = evento.detail;
    actualizarContador(buscarMision(componente, "colocar"), colocados, total);
  });

  document.addEventListener("nivel3:colocacionCompleta", (evento) => {
    completarMision(buscarMision(evento.detail.componente, "colocar"));
  });

  // Fase "presionar": contador (1/2) cada vez que se presiona una pieza; se
  // completa recién cuando se presionaron TODAS.
  document.addEventListener("nivel3:presionado", (evento) => {
    const { componente, presionados, total } = evento.detail;
    actualizarContador(buscarMision(componente, "presionar"), presionados, total);
  });

  document.addEventListener("nivel3:presionCompleta", (evento) => {
    completarMision(buscarMision(evento.detail.componente, "presionar"));
  });

  // Fase "deslizar" (solo los componentes que la tienen): igual que las
  // anteriores. Si es la última misión, la barra llega a 100% y arranca la
  // espera hacia la intermisión.
  document.addEventListener("nivel3:deslizado", (evento) => {
    const { componente, deslizados, total } = evento.detail;
    actualizarContador(buscarMision(componente, "deslizar"), deslizados, total);
  });

  document.addEventListener("nivel3:deslizamientoCompleto", (evento) => {
    completarMision(buscarMision(evento.detail.componente, "deslizar"));
  });
})();
