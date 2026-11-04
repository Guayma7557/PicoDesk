/* ==========================================================================
   herramientas_nivel_2.js
   Selección/uso de herramientas del nivel 2. El nivel tiene tres etapas
   seguidas:

     ETAPA 1 - CPU:      la "placa-madre" (CPU) se coloca en su zona.
     ETAPA 2 - COLOCAR:  apenas se coloca la CPU se desbloquean las dos
                         memorias RAM de la barra, que se colocan en las dos
                         ranuras que quedan justo debajo de la CPU en
                         "Fondo superior - Nivel 3". Da igual cuál de las
                         dos memorias va primero y en qué ranura: cualquiera
                         entra en cualquier ranura libre.
     ETAPA 3 - PRESIONAR: con las dos RAM colocadas se activan los 4 seguros
                         blancos de los costados de las ranuras (2 por
                         ranura), como en una RAM real. Hay que presionar
                         LOS 4 (uno a uno, en cualquier orden) para
                         encajarlas; recién ahí el nivel está completo
                         (misiones_nivel_2.js se encarga de la espera y la
                         redirección a la intermisión).

   Cada herramienta se puede colocar de dos formas:
     1) Arrastrándola (drag & drop) desde la barra hasta su destino.
     2) Seleccionándola con click y después haciendo click en el destino
        (queda como alternativa accesible, ej. para uso por teclado).

   Eventos que dispara (los escuchan misiones y puntaje):
     nivel2:placaColocada   -> se colocó la CPU
     nivel2:ramColocada     -> se colocó una RAM (detail: { colocadas, total })
     nivel2:ramesColocadas  -> están colocadas todas las RAM
     nivel2:seguroPresionado -> se presionó un seguro (detail: { presionados, total })
     nivel2:nivelCompletado  -> se presionaron los 4 seguros: fin del nivel
   ========================================================================== */

(function () {
  const itemsHerramientas = document.querySelectorAll(
    ".barra-herramientas__item[data-herramienta]"
  );
  const fondoMarco = document.querySelector(".fondo-marco");
  const zonaPlacaMadre = document.querySelector(".zona-placa-madre");
  const itemPlacaMadre = document.querySelector('[data-herramienta="placa-madre"]');
  const itemsRam = Array.from(document.querySelectorAll('[data-herramienta="ram"]'));
  const socketsRam = Array.from(document.querySelectorAll(".socket-ram"));
  const ramsInstaladas = Array.from(document.querySelectorAll(".ram-instalada"));
  const clipsRam = Array.from(document.querySelectorAll(".clip-ram"));
  const overlayConfirmacion = document.querySelector(".overlay-confirmacion");

  if (!itemsHerramientas.length || !fondoMarco || !zonaPlacaMadre) return;

  // Tamaño del lienzo de los sprites de fondo (521x260). Los sprites de la
  // RAM ("Herramientas icono RAM" y "RAM agarrando") vienen en ese mismo
  // lienzo, con el dibujo en un rincón; los valores de abajo son dónde está
  // el dibujo (medidos del arte) y sirven de respaldo. Cuando el navegador
  // lo permite se mide el dibujo real de la imagen (ver "medirSprite"), y
  // si el sprite ya viene recortado se usa entero, así que cambiar el arte
  // no rompe nada.
  const LIENZO_ANCHO = 521;
  const LIENZO_ALTO = 260;
  const RECORTE_ICONO_RAM = { x: 354, y: 179, ancho: 113, alto: 34 };
  const RECORTE_RAM_AGARRANDO = { x: 128, y: 103, ancho: 92, alto: 4 };

  // Las ranuras son finitas (6 px de alto en el dibujo): al soltar se
  // acepta un margen alrededor para que no haga falta puntería de cirujano.
  const MARGEN_SOLTAR_PX = 6;
  // Cuánto hay que mover el puntero para que se considere "arrastre" y no
  // un simple click.
  const UMBRAL_ARRASTRE_PX = 5;

  const TOTAL_RAM = Math.min(itemsRam.length, socketsRam.length);

  /* ------------------------------------------------------------------------
     Sprites de la RAM: recorte del dibujo dentro de su lienzo.
     ------------------------------------------------------------------------ */

  // Devuelve { x, y, ancho, alto } con el área que ocupa el dibujo dentro de
  // la imagen. Si la imagen no es del tamaño del lienzo (ya viene recortada)
  // es la imagen entera. Si lo es, se mide la parte no transparente con un
  // <canvas>; en algunos navegadores abrir el juego como archivo local
  // (file://) bloquea esa lectura, y entonces se usa el recorte "porDefecto".
  function medirSprite(img, porDefecto) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return null; // todavía no cargó, o falló
    if (nw !== LIENZO_ANCHO || nh !== LIENZO_ALTO) {
      return { x: 0, y: 0, ancho: nw, alto: nh };
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const datos = ctx.getImageData(0, 0, nw, nh).data;
      let minX = nw, minY = nh, maxX = -1, maxY = -1;
      for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
          if (datos[(y * nw + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return porDefecto; // imagen vacía
      return { x: minX, y: minY, ancho: maxX - minX + 1, alto: maxY - minY + 1 };
    } catch (error) {
      return porDefecto;
    }
  }

  function alCargar(img, callback, alFallar) {
    if (img.complete && img.naturalWidth) {
      callback();
    } else if (img.complete) {
      if (alFallar) alFallar(); // ya terminó de cargar pero sin imagen: falló
    } else {
      img.addEventListener("load", callback, { once: true });
      if (alFallar) img.addEventListener("error", alFallar, { once: true });
    }
  }

  // Íconos de la barra: muestra solo el recorte del dibujo (en %, para que
  // escale con el casillero). Si la imagen no carga, se muestra el texto
  // "RAM" en su lugar para que el casillero nunca quede vacío.
  document.querySelectorAll(".icono-ram").forEach((caja) => {
    const img = caja.querySelector("img");
    if (!img) return;
    alCargar(
      img,
      () => {
        const r = medirSprite(img, RECORTE_ICONO_RAM);
        if (!r) return;
        caja.style.aspectRatio = `${r.ancho} / ${r.alto}`;
        img.style.width = `${(img.naturalWidth / r.ancho) * 100}%`;
        img.style.left = `${(-r.x / r.ancho) * 100}%`;
        img.style.top = `${(-r.y / r.alto) * 100}%`;
      },
      () => caja.classList.add("icono-ram--error")
    );
  });

  // RAM ya colocada: normalmente es el sprite "RAM agarrando" a lienzo
  // completo (ya dibujado sobre la ranura 1, y la 2 lo baja 10 px por CSS).
  // Si el sprite viniera ya recortado, se ajusta al tamaño de su ranura.
  ramsInstaladas.forEach((img, i) => {
    alCargar(img, () => {
      if (img.naturalWidth === LIENZO_ANCHO && img.naturalHeight === LIENZO_ALTO) return;
      const socket = socketsRam[i];
      if (!socket) return;
      const fm = fondoMarco.getBoundingClientRect();
      const sr = socket.getBoundingClientRect();
      img.style.inset = "auto";
      img.style.transform = "none";
      img.style.objectFit = "fill";
      img.style.imageRendering = "pixelated";
      img.style.left = `${((sr.left - fm.left) / fm.width) * 100}%`;
      img.style.top = `${((sr.top - fm.top) / fm.height) * 100}%`;
      img.style.width = `${(sr.width / fm.width) * 100}%`;
      img.style.height = `${(sr.height / fm.height) * 100}%`;
    });
  });

  let herramientaActual = null; // "placa-madre" | "ram" | null
  let itemActual = null; // el botón de la barra que está seleccionado
  let placaColocada = false;
  let ramColocadas = 0;
  let segurosPresionados = 0;

  function placaMadreYaColocada() {
    return placaColocada;
  }

  function actualizarCursor(item) {
    // La RAM usa un sprite de 521x260 (muy grande para ser cursor): en su
    // lugar se usa la manito y el casillero de la barra queda resaltado.
    if (item.dataset.herramienta === "ram") {
      document.body.style.cursor = "grab";
      return;
    }
    const img = item.querySelector("img");
    // Usamos el propio ícono de la herramienta como cursor para el modo
    // "seleccionar y click".
    document.body.style.cursor = img ? `url("${img.src}") 16 16, pointer` : "pointer";
  }

  function actualizarZonaActiva() {
    zonaPlacaMadre.classList.toggle(
      "zona-activa",
      herramientaActual === "placa-madre" && !placaMadreYaColocada()
    );

    // Con una RAM seleccionada, las ranuras libres se resaltan y aceptan click.
    const ramSeleccionada = herramientaActual === "ram" && placaMadreYaColocada();
    socketsRam.forEach((s) =>
      s.classList.toggle(
        "socket-ram--activo",
        ramSeleccionada && s.dataset.ocupado !== "true"
      )
    );
  }

  /* ------------------------------------------------------------------------
     Pista visual: resalta en amarillo lo que corresponde usar a
     continuación: primero la CPU y, una vez colocada, las RAM que falten.
     ------------------------------------------------------------------------ */

  const CLASE_SUGERIDO = "barra-herramientas__item--sugerido";

  function actualizarSugerenciaHerramienta() {
    itemsHerramientas.forEach((i) => i.classList.remove(CLASE_SUGERIDO));

    if (!placaMadreYaColocada()) {
      if (itemPlacaMadre) itemPlacaMadre.classList.add(CLASE_SUGERIDO);
      return;
    }

    itemsRam.forEach((i) => {
      if (i.dataset.agotado !== "true") i.classList.add(CLASE_SUGERIDO);
    });
    // Si no falta nada, no se sugiere ninguna herramienta (nivel completo).
  }

  function seleccionarHerramienta(item) {
    // Se compara el botón (no solo el nombre) porque hay dos RAM iguales.
    if (itemActual === item) {
      deseleccionarHerramienta();
      return;
    }

    herramientaActual = item.dataset.herramienta;
    itemActual = item;
    itemsHerramientas.forEach((i) =>
      i.setAttribute("aria-pressed", i === item ? "true" : "false")
    );
    actualizarCursor(item);
    actualizarZonaActiva();
  }

  function deseleccionarHerramienta() {
    herramientaActual = null;
    itemActual = null;
    itemsHerramientas.forEach((i) => i.setAttribute("aria-pressed", "false"));
    document.body.style.cursor = "";
    actualizarZonaActiva();
  }

  /* ------------------------------------------------------------------------
     Acciones "reales" (colocar la CPU / colocar una RAM), compartidas por
     el modo click y el modo arrastre para no duplicar lógica.
     ------------------------------------------------------------------------ */

  function colocarPlacaMadre() {
    if (placaMadreYaColocada()) return false;

    placaColocada = true;
    itemPlacaMadre.dataset.agotado = "true";
    zonaPlacaMadre.classList.add("placa-colocada"); // oculta el marco rojo de la CPU
    fondoMarco.classList.add("placa-madre-lista"); // cross-fade a "Fondo superior - Nivel 3" + muestra las ranuras
    itemsRam.forEach((i) => delete i.dataset.bloqueado); // ETAPA 2: se desbloquean las RAM
    deseleccionarHerramienta();
    actualizarSugerenciaHerramienta();

    document.dispatchEvent(new CustomEvent("nivel2:placaColocada"));
    return true;
  }

  function colocarRamEn(socket, item) {
    if (!socket || !item) return false;
    if (!placaMadreYaColocada()) return false; // primero va la CPU
    if (socket.dataset.ocupado === "true") return false; // ranura ya usada
    if (item.dataset.agotado === "true") return false; // esta memoria ya se colocó

    socket.dataset.ocupado = "true";
    item.dataset.agotado = "true";

    // Muestra el sprite de la RAM dentro de ESA ranura.
    const instalada = ramsInstaladas[socketsRam.indexOf(socket)];
    if (instalada) instalada.classList.add("ram-instalada--visible");

    ramColocadas += 1;
    deseleccionarHerramienta();
    actualizarSugerenciaHerramienta();

    document.dispatchEvent(
      new CustomEvent("nivel2:ramColocada", {
        detail: { colocadas: ramColocadas, total: TOTAL_RAM },
      })
    );

    if (ramColocadas >= TOTAL_RAM) {
      // Las dos RAM están puestas: se activan los 4 seguros y hay que
      // presionarlos todos (ETAPA 3).
      clipsRam.forEach((clip) => clip.classList.add("clip-ram--activo"));
      document.dispatchEvent(new CustomEvent("nivel2:ramesColocadas"));
    }
    return true;
  }

  // ETAPA 3: presionar un seguro de una RAM ya colocada para encajarla.
  // Cada seguro se puede presionar una sola vez; el nivel termina cuando se
  // presionaron todos (no alcanza con presionar algunos).
  function presionarSeguro(clip) {
    if (!clip.classList.contains("clip-ram--activo")) return false;
    if (clip.dataset.presionado === "true") return false;

    clip.dataset.presionado = "true";
    segurosPresionados += 1;

    document.dispatchEvent(
      new CustomEvent("nivel2:seguroPresionado", {
        detail: { presionados: segurosPresionados, total: clipsRam.length },
      })
    );

    if (segurosPresionados >= clipsRam.length) {
      document.dispatchEvent(new CustomEvent("nivel2:nivelCompletado"));
    }
    return true;
  }

  /* ------------------------------------------------------------------------
     Modo 1: seleccionar herramienta (click) y después click en el destino.
     ------------------------------------------------------------------------ */

  itemsHerramientas.forEach((item) => {
    item.setAttribute("aria-pressed", "false");
    item.addEventListener("click", () => {
      if (item.dataset.agotado === "true" || item.dataset.bloqueado === "true") return;
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

  socketsRam.forEach((socket) => {
    socket.addEventListener("click", () => {
      if (herramientaActual !== "ram" || !itemActual) return;
      colocarRamEn(socket, itemActual);
    });
  });

  clipsRam.forEach((clip) => {
    clip.addEventListener("click", () => presionarSeguro(clip));
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

  function puntoDentroDeRect(rect, x, y, margen = 0) {
    return (
      x >= rect.left - margen &&
      x <= rect.right + margen &&
      y >= rect.top - margen &&
      y <= rect.bottom + margen
    );
  }

  function socketLibreBajoCursor(x, y) {
    for (const socket of socketsRam) {
      if (socket.dataset.ocupado === "true") continue;
      if (puntoDentroDeRect(socket.getBoundingClientRect(), x, y, MARGEN_SOLTAR_PX)) {
        return socket;
      }
    }
    return null;
  }

  // Arma el "fantasma" que sigue al puntero. La CPU usa su ícono tal cual;
  // la RAM usa "RAM agarrando - Nivel 3" recortada al dibujo de la memoria y
  // escalada al mismo tamaño que tiene en pantalla la ranura, así que al
  // arrastrarla se ve exactamente del tamaño al que va a quedar. Si el
  // sprite no está disponible se usa un rectángulo verde del mismo tamaño.
  function crearFantasma(nombre, imgOrigen) {
    if (nombre === "ram") {
      const escala = fondoMarco.getBoundingClientRect().width / LIENZO_ANCHO;
      const sprite = ramsInstaladas[0];
      const r = sprite ? medirSprite(sprite, RECORTE_RAM_AGARRANDO) : null;
      const el = document.createElement("div");
      el.className = "arrastre-fantasma arrastre-fantasma--ram";

      if (r) {
        el.style.width = `${r.ancho * escala}px`;
        el.style.height = `${r.alto * escala}px`;
        el.style.backgroundImage = `url("${sprite.src}")`;
        el.style.backgroundSize = `${sprite.naturalWidth * escala}px ${sprite.naturalHeight * escala}px`;
        el.style.backgroundPosition = `${-r.x * escala}px ${-r.y * escala}px`;
      } else {
        el.style.width = `${RECORTE_RAM_AGARRANDO.ancho * escala}px`;
        el.style.height = `${RECORTE_RAM_AGARRANDO.alto * escala}px`;
        el.style.backgroundColor = "#026d42";
      }
      return el;
    }

    const el = document.createElement("img");
    el.src = imgOrigen.src;
    el.alt = "";
    el.className = "arrastre-fantasma";
    return el;
  }

  function iniciarArrastre(item, eventoInicial) {
    if (item.dataset.agotado === "true" || item.dataset.bloqueado === "true") return;
    if (dialogoAbierto()) return;

    const nombre = item.dataset.herramienta;
    const imgOrigen = item.querySelector("img");
    if (!imgOrigen) return;

    eventoInicial.preventDefault();

    const inicioX = eventoInicial.clientX;
    const inicioY = eventoInicial.clientY;
    let arrastrando = false; // pasa a true recién cuando el puntero se mueve
    let fantasma = null;

    function moverFantasma(x, y) {
      fantasma.style.left = `${x}px`;
      fantasma.style.top = `${y}px`;
    }

    function limpiarResaltados() {
      zonaPlacaMadre.classList.remove("zona-activa");
      socketsRam.forEach((s) => s.classList.remove("socket-ram--resaltado"));
    }

    function resaltarDestino(x, y) {
      limpiarResaltados();

      if (nombre === "placa-madre") {
        if (!placaMadreYaColocada() && puntoDentroDeRect(zonaPlacaMadre.getBoundingClientRect(), x, y)) {
          zonaPlacaMadre.classList.add("zona-activa");
        }
      } else if (nombre === "ram") {
        const socket = socketLibreBajoCursor(x, y);
        if (socket) socket.classList.add("socket-ram--resaltado");
      }
    }

    function alMover(e) {
      if (!arrastrando) {
        // Hasta que no se mueva lo suficiente es un simple click: no se
        // crea el fantasma y la selección por click sigue funcionando.
        if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) < UMBRAL_ARRASTRE_PX) return;
        arrastrando = true;
        deseleccionarHerramienta();
        fantasma = crearFantasma(nombre, imgOrigen);
        document.body.appendChild(fantasma);
      }
      moverFantasma(e.clientX, e.clientY);
      resaltarDestino(e.clientX, e.clientY);
    }

    function terminarArrastre() {
      document.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", cancelar);
      cancelarArrastreEnCurso = null;
      if (fantasma) fantasma.remove();
      limpiarResaltados();
    }

    function soltar(e) {
      const x = e.clientX;
      const y = e.clientY;
      const fueArrastre = arrastrando;
      terminarArrastre();

      // Un click sin movimiento no es un arrastre: se deja pasar para que
      // el listener de "click" seleccione la herramienta (modo 1).
      if (!fueArrastre) return;

      if (nombre === "placa-madre") {
        if (puntoDentroDeRect(zonaPlacaMadre.getBoundingClientRect(), x, y)) {
          colocarPlacaMadre();
        }
      } else if (nombre === "ram") {
        const socket = socketLibreBajoCursor(x, y);
        if (socket) colocarRamEn(socket, item);
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

  [itemPlacaMadre, ...itemsRam].forEach((item) => {
    if (!item) return;
    item.addEventListener("pointerdown", (evento) => iniciarArrastre(item, evento));
  });

  // Pista inicial: al entrar al nivel, la primera herramienta a usar es la CPU.
  actualizarSugerenciaHerramienta();
})();
