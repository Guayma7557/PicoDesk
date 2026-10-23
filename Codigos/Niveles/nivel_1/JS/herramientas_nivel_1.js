/* ==========================================================================
   herramientas-nivel1.js
   Selección/uso de herramientas del nivel 1. Dos formas de colocar la
   "placa-madre" y el "tornillo":
     1) Arrastrarlos (drag & drop) directo desde la barra de herramientas
        hasta su destino (la zona de la placa madre / un punto de fijación).
     2) Seleccionarlos con click y después hacer click en el destino
        (queda como alternativa accesible, ej. para uso por teclado).
   El destornillador NO se arrastra: se selecciona y se "usa" con click
   sobre un tornillo ya colocado (data-uso="ilimitado").
   Reglas de gasto:
     - data-uso="unico"        -> se puede usar una sola vez (placa madre)
     - data-uso="ilimitado"    -> se puede usar siempre (destornillador)
     - data-usos-restantes="N" -> se gasta 1 por uso (tornillos)
   La placa madre "colocada" no es un sprite aparte: al colocarla, se le
   agrega la clase "placa-madre-lista" a ".fondo-marco", que dispara (en
   nivel_1.css) el cross-fade hacia "Fondo superior - Nivel 2", donde la
   placa ya está dibujada en su posición/rotación final.
   ========================================================================== */

(function () {
  const itemsHerramientas = document.querySelectorAll(
    ".barra-herramientas__item[data-herramienta]"
  );
  const fondoMarco = document.querySelector(".fondo-marco");
  const zonaPlacaMadre = document.querySelector(".zona-placa-madre");
  const puntosTornillo = document.querySelectorAll(".punto-tornillo");
  const itemTornillo = document.querySelector('[data-herramienta="tornillo"]');
  const itemPlacaMadre = document.querySelector('[data-herramienta="placa-madre"]');
  const itemDestornillador = document.querySelector('[data-herramienta="destornillador"]');
  const overlayConfirmacion = document.querySelector(".overlay-confirmacion");
  const contadorTornillo = itemTornillo
    ? itemTornillo.querySelector(".barra-herramientas__contador")
    : null;

  if (!itemsHerramientas.length || !fondoMarco || !zonaPlacaMadre) return;

  let herramientaActual = null; // "placa-madre" | "destornillador" | "tornillo" | null
  let placaColocada = false;

  function placaMadreYaColocada() {
    return placaColocada;
  }

  function actualizarCursor(item) {
    const img = item.querySelector("img");
    // Usamos el propio ícono de la herramienta como cursor para el modo
    // "seleccionar y click". Si se ve muy grande/borroso conviene crear
    // versiones chicas (ej. 32x32) específicas para el cursor.
    document.body.style.cursor = img ? `url("${img.src}") 16 16, pointer` : "pointer";
  }

  function actualizarZonaActiva() {
    zonaPlacaMadre.classList.toggle(
      "zona-activa",
      herramientaActual === "placa-madre" && !placaMadreYaColocada()
    );
  }

  /* ------------------------------------------------------------------------
     Pista visual: resalta en amarillo la herramienta que corresponde usar
     a continuación, en orden: placa madre -> tornillos -> destornillador.
     ------------------------------------------------------------------------ */

  const CLASE_SUGERIDO = "barra-herramientas__item--sugerido";

  function actualizarSugerenciaHerramienta() {
    itemsHerramientas.forEach((i) => i.classList.remove(CLASE_SUGERIDO));

    if (!placaMadreYaColocada()) {
      if (itemPlacaMadre) itemPlacaMadre.classList.add(CLASE_SUGERIDO);
      return;
    }

    const quedanTornillos = itemTornillo && parseInt(itemTornillo.dataset.usosRestantes, 10) > 0;
    if (quedanTornillos) {
      itemTornillo.classList.add(CLASE_SUGERIDO);
      return;
    }

    const faltaApretar = Array.from(puntosTornillo).some((p) => p.dataset.apretado !== "true");
    if (faltaApretar && itemDestornillador) {
      itemDestornillador.classList.add(CLASE_SUGERIDO);
    }
    // Si no falta nada, no se sugiere ninguna herramienta (nivel completo).
  }

  function seleccionarHerramienta(item) {
    const nombre = item.dataset.herramienta;

    if (herramientaActual === nombre) {
      deseleccionarHerramienta();
      return;
    }

    herramientaActual = nombre;
    itemsHerramientas.forEach((i) =>
      i.setAttribute("aria-pressed", i === item ? "true" : "false")
    );
    actualizarCursor(item);
    actualizarZonaActiva();
  }

  function deseleccionarHerramienta() {
    herramientaActual = null;
    itemsHerramientas.forEach((i) => i.setAttribute("aria-pressed", "false"));
    document.body.style.cursor = "";
    actualizarZonaActiva();
  }

  /* ------------------------------------------------------------------------
     Acciones "reales" (colocar/apretar), compartidas por el modo click y
     el modo arrastre para no duplicar lógica.
     ------------------------------------------------------------------------ */

  function colocarPlacaMadre() {
    if (placaMadreYaColocada()) return false;

    placaColocada = true;
    itemPlacaMadre.dataset.agotado = "true";
    zonaPlacaMadre.classList.add("placa-colocada"); // revela los puntos de fijación
    fondoMarco.classList.add("placa-madre-lista"); // cross-fade a "Fondo superior - Nivel 2"
    deseleccionarHerramienta();
    actualizarSugerenciaHerramienta();

    document.dispatchEvent(new CustomEvent("nivel1:placaColocada"));
    return true;
  }

  function colocarTornilloEn(punto) {
    if (!punto) return false;
    if (!placaMadreYaColocada()) return false; // hace falta la placa puesta primero
    if (punto.dataset.colocado === "true") return false;

    punto.dataset.colocado = "true";

    const restantes = parseInt(itemTornillo.dataset.usosRestantes, 10) - 1;
    itemTornillo.dataset.usosRestantes = String(restantes);
    if (contadorTornillo) contadorTornillo.textContent = String(restantes);

    document.dispatchEvent(new CustomEvent("nivel1:tornilloColocado"));

    if (restantes <= 0) {
      itemTornillo.dataset.agotado = "true";
      deseleccionarHerramienta();
    }
    actualizarSugerenciaHerramienta();
    return true;
  }

  function apretarTornillo(punto) {
    if (!punto) return false;
    if (punto.dataset.colocado !== "true") return false; // no hay tornillo que apretar
    if (punto.dataset.apretado === "true") return false;

    punto.dataset.apretado = "true";
    document.dispatchEvent(new CustomEvent("nivel1:tornilloApretado"));

    const todosApretados = Array.from(puntosTornillo).every(
      (p) => p.dataset.apretado === "true"
    );
    if (todosApretados) {
      document.dispatchEvent(new CustomEvent("nivel1:pasoCompletado"));
    }
    actualizarSugerenciaHerramienta();
    return true;
  }

  /* ------------------------------------------------------------------------
     Modo 1: seleccionar herramienta (click) y después click en el destino.
     ------------------------------------------------------------------------ */

  itemsHerramientas.forEach((item) => {
    item.setAttribute("aria-pressed", "false");
    item.addEventListener("click", () => {
      if (item.dataset.agotado === "true") return;
      // Evita que el click sintético que el navegador dispara justo
      // después de soltar un arrastre vuelva a "seleccionar" la
      // herramienta que se acaba de arrastrar.
      if (item.dataset.arrastrando === "true") return;
      seleccionarHerramienta(item);
    });
  });

  zonaPlacaMadre.addEventListener("click", () => {
    if (herramientaActual !== "placa-madre") return;
    colocarPlacaMadre();
  });

  puntosTornillo.forEach((punto) => {
    punto.addEventListener("click", () => {
      if (herramientaActual === "tornillo") {
        colocarTornilloEn(punto);
      } else if (herramientaActual === "destornillador") {
        apretarTornillo(punto);
      }
    });
  });

  // Si se abre el diálogo de "¿Estás seguro de salir?", soltamos la
  // herramienta seleccionada para no dejar el cursor "pegado", y si había
  // un arrastre en curso lo cancelamos.
  document.addEventListener("juego:pausar", () => {
    deseleccionarHerramienta();
    if (cancelarArrastreEnCurso) cancelarArrastreEnCurso();
  });

  /* ------------------------------------------------------------------------
     Modo 2: arrastrar (drag & drop) el ícono directo hasta su destino.
     Usa Pointer Events, así que funciona igual con mouse, trackpad,
     lápiz óptico y pantallas táctiles.
     ------------------------------------------------------------------------ */

  let cancelarArrastreEnCurso = null;

  function dialogoAbierto() {
    return !!overlayConfirmacion && overlayConfirmacion.classList.contains("is-visible");
  }

  function puntoDentroDeRect(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function puntoTornilloBajoCursor(x, y) {
    for (const punto of puntosTornillo) {
      if (puntoDentroDeRect(punto.getBoundingClientRect(), x, y)) return punto;
    }
    return null;
  }

  function iniciarArrastre(item, eventoInicial) {
    if (item.dataset.agotado === "true") return;
    if (dialogoAbierto()) return;

    const nombre = item.dataset.herramienta;
    const imgOrigen = item.querySelector("img");
    if (!imgOrigen) return;

    eventoInicial.preventDefault();
    deseleccionarHerramienta();

    const fantasma = document.createElement("img");
    fantasma.src = imgOrigen.src;
    fantasma.alt = "";
    fantasma.className = "arrastre-fantasma";
    // La placa madre se muestra rotada mientras se arrastra, para
    // anticipar cómo va a quedar encarada una vez puesta (ver
    // "Fondo superior - Nivel 2").
    if (nombre === "placa-madre") {
      fantasma.classList.add("arrastre-fantasma--placa-madre");
    }
    document.body.appendChild(fantasma);

    function moverFantasma(x, y) {
      fantasma.style.left = `${x}px`;
      fantasma.style.top = `${y}px`;
    }
    moverFantasma(eventoInicial.clientX, eventoInicial.clientY);

    function limpiarResaltados() {
      zonaPlacaMadre.classList.remove("zona-activa");
      puntosTornillo.forEach((p) => p.classList.remove("punto-tornillo--resaltado"));
    }

    function resaltarDestino(x, y) {
      limpiarResaltados();

      if (nombre === "placa-madre") {
        if (!placaMadreYaColocada() && puntoDentroDeRect(zonaPlacaMadre.getBoundingClientRect(), x, y)) {
          zonaPlacaMadre.classList.add("zona-activa");
        }
      } else if (nombre === "tornillo") {
        const punto = puntoTornilloBajoCursor(x, y);
        if (punto && punto.dataset.colocado !== "true") {
          punto.classList.add("punto-tornillo--resaltado");
        }
      }
    }

    function alMover(e) {
      moverFantasma(e.clientX, e.clientY);
      resaltarDestino(e.clientX, e.clientY);
    }

    function terminarArrastre() {
      document.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", cancelar);
      cancelarArrastreEnCurso = null;
      fantasma.remove();
      limpiarResaltados();
    }

    function soltar(e) {
      const x = e.clientX;
      const y = e.clientY;
      terminarArrastre();

      if (nombre === "placa-madre") {
        if (puntoDentroDeRect(zonaPlacaMadre.getBoundingClientRect(), x, y)) {
          colocarPlacaMadre();
        }
      } else if (nombre === "tornillo") {
        const punto = puntoTornilloBajoCursor(x, y);
        if (punto) colocarTornilloEn(punto);
      }

      // Evita que el click sintético posterior a soltar el puntero
      // vuelva a "seleccionar" esta misma herramienta.
      item.dataset.arrastrando = "true";
      setTimeout(() => {
        delete item.dataset.arrastrando;
      }, 0);
    }

    function cancelar() {
      terminarArrastre();
    }

    cancelarArrastreEnCurso = cancelar;
    document.addEventListener("pointermove", alMover);
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", cancelar);
  }

  [itemPlacaMadre, itemTornillo].forEach((item) => {
    if (!item) return;
    item.addEventListener("pointerdown", (evento) => iniciarArrastre(item, evento));
  });

  // Pista inicial: al entrar al nivel, la primera herramienta a usar es
  // "placa-madre".
  actualizarSugerenciaHerramienta();
})();
