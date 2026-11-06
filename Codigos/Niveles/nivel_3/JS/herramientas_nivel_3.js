/* ==========================================================================
   herramientas_nivel_3.js
   Selección/uso de herramientas del nivel 3. El nivel está armado por
   COMPONENTES que se hacen uno detrás del otro ("etapas"): hoy la GPU y el
   disco duro. Este archivo no sabe qué componente es cada uno, lo descubre
   leyendo el HTML, así que un componente nuevo se agrega solo con HTML/CSS.

   Cómo se conecta todo (el nombre del componente es el mismo en todos lados):
     .barra-herramientas__item[data-herramienta="gpu"]  las herramientas
     .socket[data-componente="gpu"]                     las ranuras
     .instalado[data-componente="gpu"]                  el sprite que se ve al
                                                        colocar (1 por ranura)
     .presionable[data-componente="gpu"]                lo que hay que presionar
                                                        (la GPU entera, el disco...)
     .deslizable[data-componente="disco"]               (opcional) lo que hay que
                                                        deslizar después de presionar
     .guia[data-componente="disco"]                     (opcional) auras y flechas
                                                        que guían al jugador
   El ORDEN de las etapas es el orden de la barra de herramientas.

   Cada etapa tiene hasta tres fases (c.fase):
     "colocar":   hay tantas herramientas como ranuras (GPU: 2 y 2; disco: 1 y 1).
                  Cualquier herramienta entra en cualquier ranura libre, en
                  cualquier orden.
     "presionar": con todo colocado se activan las zonas a presionar y hay
                  que presionarlas TODAS. Al presionar se le agrega la clase
                  "instalado--presionado" al sprite de esa ranura (el CSS
                  decide el efecto; el disco se achica para dar profundidad).
     "deslizar":  solo si el componente tiene ".deslizable". Hay que arrastrar
                  cada uno hacia la derecha (data-deslizar-max = cuántos px
                  del arte). Al terminar se le agrega la clase
                  "<componente>-deslizado" a ".fondo-marco" (para que el CSS
                  pueda reaccionar si hace falta).
   Al completar la última fase la etapa está completa y se desbloquea la
   siguiente. Cuando se completa la última etapa, el nivel está completo
   (misiones_nivel_3.js se encarga de la espera y de la intermisión).

   Las GUÍAS (".guia", auras y flechas) declaran en data-fases en qué fases se
   ven ("colocar presionar deslizar"); este archivo les pone/saca la clase
   "guia--activa" según la fase del componente.

   Cada herramienta se puede colocar de dos formas:
     1) Arrastrándola (drag & drop) desde la barra hasta su ranura.
     2) Seleccionándola con click y después haciendo click en la ranura
        (alternativa accesible, ej. para uso por teclado).

   Eventos que dispara (los escuchan misiones y puntaje). Todos llevan en
   "detail" el nombre del componente:
     nivel3:componenteColocado   { componente, colocados, total }
     nivel3:colocacionCompleta   { componente }                  (todas puestas)
     nivel3:presionado           { componente, presionados, total }
     nivel3:presionCompleta      { componente }                  (todas presionadas)
     nivel3:deslizado            { componente, deslizados, total }
     nivel3:deslizamientoCompleto { componente }                 (todas deslizadas)
     nivel3:componenteCompletado { componente }                  (terminó la etapa)
     nivel3:nivelCompletado      {}                    (se completó la última etapa)
   Además, al terminar de colocar un componente se le agrega la clase
   "<componente>-listo" a ".fondo-marco" (ej. "gpu-listo"), que usa el CSS
   para el cross-fade al fondo de esa etapa.
   ========================================================================== */

(function () {
  const marco = document.querySelector(".fondo-marco");
  const overlayConfirmacion = document.querySelector(".overlay-confirmacion");
  const itemsHerramientas = Array.from(
    document.querySelectorAll(".barra-herramientas__item[data-herramienta]")
  );

  if (!marco || !itemsHerramientas.length) return;

  // Tamaño del lienzo de los sprites (todos miden 521x260). Los sprites de los
  // componentes vienen en ese mismo lienzo, con el dibujo en una parte: los
  // "data-recorte" del HTML dicen dónde está (respaldo) y, cuando el
  // navegador lo permite, se mide el dibujo real de la imagen (ver
  // "medirSprite"). Si el sprite ya viene recortado se usa entero, así que
  // cambiar el arte no rompe nada.
  const LIENZO_ANCHO = 521;
  const LIENZO_ALTO = 260;

  // Margen (en px de pantalla) alrededor de una ranura que se acepta al soltar.
  const MARGEN_SOLTAR_PX = 6;
  // Cuánto hay que mover el puntero para que se considere "arrastre" y no
  // un simple click.
  const UMBRAL_ARRASTRE_PX = 5;

  // Al deslizar: qué fracción del recorrido hay que completar para que cuente
  // (si se suelta antes, la pieza vuelve a su lugar).
  const UMBRAL_DESLIZAR = 0.8;

  /* ------------------------------------------------------------------------
     Componentes (etapas): se arman leyendo el HTML.
     ------------------------------------------------------------------------ */

  const componentes = [];
  itemsHerramientas.forEach((item) => {
    const id = item.dataset.herramienta;
    let c = componentes.find((x) => x.id === id);
    if (!c) {
      c = { id, items: [], sockets: [], presionables: [], deslizables: [], guias: [], instalados: [] };
      componentes.push(c);
    }
    c.items.push(item);
  });

  function elementosDe(clase, id) {
    return Array.from(document.querySelectorAll(`.${clase}[data-componente="${id}"]`));
  }

  componentes.forEach((c) => {
    c.sockets = elementosDe("socket", c.id);
    c.presionables = elementosDe("presionable", c.id);
    c.deslizables = elementosDe("deslizable", c.id);
    c.guias = elementosDe("guia", c.id);
    c.instalados = elementosDe("instalado", c.id);
    c.total = Math.min(c.items.length, c.sockets.length);
    c.colocados = 0;
    c.presionados = 0;
    c.deslizados = 0;
    c.fase = null; // "colocar" | "presionar" | "deslizar" | "completo" (null = bloqueado)
    c.desbloqueado = false;
    c.completo = false;
  });

  // Solo son etapas los componentes que tienen herramientas Y ranuras; una
  // herramienta sin ranuras todavía no hace nada, así que queda bloqueada.
  const etapas = componentes.filter((c) => c.total > 0);
  componentes
    .filter((c) => c.total === 0)
    .forEach((c) => c.items.forEach((i) => (i.dataset.bloqueado = "true")));
  if (!etapas.length) return;

  function etapaDe(id) {
    return etapas.find((c) => c.id === id) || null;
  }

  function emitir(nombre, detalle) {
    document.dispatchEvent(new CustomEvent(`nivel3:${nombre}`, { detail: detalle }));
  }

  function nivelIniciado() {
    // La introducción visual (fondo inclinado -> superior) termina con esta clase.
    return marco.classList.contains("nivel-listo");
  }

  /* ------------------------------------------------------------------------
     Sprites: recorte del dibujo dentro de su lienzo.
     ------------------------------------------------------------------------ */

  // "x,y,ancho,alto" -> { x, y, ancho, alto } (o null si no está o es inválido).
  function recorteDe(img) {
    if (!img || !img.dataset.recorte) return null;
    const n = img.dataset.recorte.split(",").map((v) => Number(v.trim()));
    if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return null;
    return { x: n[0], y: n[1], ancho: n[2], alto: n[3] };
  }

  // Devuelve { x, y, ancho, alto } con el área que ocupa el dibujo dentro de
  // la imagen. Si la imagen no es del tamaño del lienzo (ya viene recortada)
  // es la imagen entera. Si lo es, se mide la parte no transparente con un
  // <canvas>; en algunos navegadores abrir el juego como archivo local
  // (file://) bloquea esa lectura, y entonces se usa el "data-recorte" del
  // HTML (o, si no tiene, el lienzo entero).
  function medirSprite(img) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return null; // todavía no cargó, o falló
    const respaldo = recorteDe(img) || { x: 0, y: 0, ancho: nw, alto: nh };
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
      if (maxX < 0) return respaldo; // imagen vacía
      return { x: minX, y: minY, ancho: maxX - minX + 1, alto: maxY - minY + 1 };
    } catch (error) {
      return respaldo;
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
  // escale con el casillero). Si la imagen no carga, se muestra el texto del
  // "data-etiqueta" (ej. "GPU") para que el casillero nunca quede vacío.
  document.querySelectorAll(".icono-herramienta").forEach((caja) => {
    const img = caja.querySelector("img");
    if (!img) return;
    alCargar(
      img,
      () => {
        const r = medirSprite(img);
        if (!r) return;
        caja.style.aspectRatio = `${r.ancho} / ${r.alto}`;
        // Un ícono más alto que ancho (ej. el disco duro) se ajusta por el
        // alto del casillero, si no se saldría por abajo.
        if (r.ancho < r.alto) {
          caja.style.width = "auto";
          caja.style.height = "90%";
        }
        img.style.width = `${(img.naturalWidth / r.ancho) * 100}%`;
        img.style.left = `${(-r.x / r.ancho) * 100}%`;
        img.style.top = `${(-r.y / r.alto) * 100}%`;
      },
      () => caja.classList.add("icono-herramienta--error")
    );
  });

  // Sprite ya colocado: normalmente es un sprite a lienzo completo (dibujado
  // sobre la ranura 1; las demás ranuras lo corren con "--dx" por CSS). Si el
  // sprite viniera ya recortado, se ajusta al tamaño de su ranura.
  etapas.forEach((c) => {
    c.instalados.forEach((img, i) => {
      alCargar(img, () => {
        if (img.naturalWidth === LIENZO_ANCHO && img.naturalHeight === LIENZO_ALTO) return;
        const zona = c.presionables[i] || c.sockets[i];
        if (!zona) return;
        const fm = marco.getBoundingClientRect();
        const sr = zona.getBoundingClientRect();
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
  });

  /* ------------------------------------------------------------------------
     Estado de selección y pistas visuales.
     ------------------------------------------------------------------------ */

  let itemActual = null; // el botón de la barra que está seleccionado

  const CLASE_SUGERIDO = "barra-herramientas__item--sugerido";

  // La etapa en curso: la primera desbloqueada que todavía no se completó.
  function etapaActual() {
    return etapas.find((c) => c.desbloqueado && !c.completo) || null;
  }

  // Resalta en amarillo las herramientas que corresponde usar a continuación
  // (las que faltan colocar de la etapa en curso). Durante la fase de
  // presionar no se sugiere ninguna herramienta.
  function actualizarSugerenciaHerramienta() {
    itemsHerramientas.forEach((i) => i.classList.remove(CLASE_SUGERIDO));
    const c = etapaActual();
    if (!c || c.colocados >= c.total) return;
    c.items.forEach((i) => {
      if (i.dataset.agotado !== "true") i.classList.add(CLASE_SUGERIDO);
    });
  }

  // Con una herramienta seleccionada (click), las ranuras libres de su
  // componente se resaltan y aceptan click.
  function actualizarSocketsActivos() {
    etapas.forEach((c) => {
      const aplica = !!itemActual && itemActual.dataset.herramienta === c.id && c.desbloqueado;
      c.sockets.forEach((s) =>
        s.classList.toggle("socket--activo", aplica && s.dataset.ocupado !== "true")
      );
    });
  }

  function seleccionarHerramienta(item) {
    // Se compara el botón (no solo el nombre) porque hay varias iguales.
    if (itemActual === item) {
      deseleccionarHerramienta();
      return;
    }
    itemActual = item;
    itemsHerramientas.forEach((i) =>
      i.setAttribute("aria-pressed", i === item ? "true" : "false")
    );
    document.body.style.cursor = "grab";
    actualizarSocketsActivos();
  }

  function deseleccionarHerramienta() {
    itemActual = null;
    itemsHerramientas.forEach((i) => i.setAttribute("aria-pressed", "false"));
    document.body.style.cursor = "";
    actualizarSocketsActivos();
  }

  /* ------------------------------------------------------------------------
     Etapas: desbloqueo, colocar y presionar.
     ------------------------------------------------------------------------ */

  // Las guías (auras y flechas) de un componente se ven solo en las fases que
  // declaran en data-fases.
  function actualizarGuias(c) {
    c.guias.forEach((g) => {
      const fases = (g.dataset.fases || "").split(/\s+/);
      g.classList.toggle("guia--activa", fases.includes(c.fase));
    });
  }

  function cambiarFase(c, fase) {
    c.fase = fase;
    actualizarGuias(c);
  }

  function desbloquear(c) {
    c.desbloqueado = true;
    c.items.forEach((i) => delete i.dataset.bloqueado);
    c.sockets.forEach((s) => s.classList.add("socket--visible"));
    cambiarFase(c, "colocar");
    actualizarSugerenciaHerramienta();
  }

  function completarComponente(c) {
    c.completo = true;
    cambiarFase(c, "completo");
    emitir("componenteCompletado", { componente: c.id });

    const siguiente = etapas[etapas.indexOf(c) + 1];
    if (siguiente) {
      desbloquear(siguiente);
    } else {
      emitir("nivelCompletado", {});
    }
    actualizarSugerenciaHerramienta();
  }

  function colocarEn(socket, item) {
    if (!socket || !item) return false;
    if (!nivelIniciado()) return false;

    const c = etapaDe(item.dataset.herramienta);
    if (!c || !c.desbloqueado || socket.dataset.componente !== c.id) return false;
    if (socket.dataset.ocupado === "true") return false; // ranura ya usada
    if (item.dataset.agotado === "true") return false; // esta herramienta ya se colocó

    socket.dataset.ocupado = "true";
    item.dataset.agotado = "true";

    // Muestra el sprite dentro de ESA ranura.
    const instalado = c.instalados[c.sockets.indexOf(socket)];
    if (instalado) instalado.classList.add("instalado--visible");

    c.colocados += 1;
    deseleccionarHerramienta();
    actualizarSugerenciaHerramienta();
    emitir("componenteColocado", { componente: c.id, colocados: c.colocados, total: c.total });

    if (c.colocados >= c.total) {
      // Todo colocado: cambia el fondo de la etapa y se activan las zonas a presionar.
      marco.classList.add(`${c.id}-listo`);
      c.presionables.forEach((p) => p.classList.add("presionable--activo"));
      emitir("colocacionCompleta", { componente: c.id });
      if (c.presionables.length) {
        cambiarFase(c, "presionar");
      } else {
        terminarPresion(c); // nada que presionar: se pasa a la fase siguiente
      }
    }
    return true;
  }

  // Presionar algo de un componente ya colocado (en la GPU, la tarjeta
  // entera; en el disco, el disco). Cada zona se puede presionar una sola vez;
  // la fase termina cuando se presionaron todas (no alcanza con presionar
  // algunas).
  function presionar(zona) {
    if (!zona.classList.contains("presionable--activo")) return false;
    if (zona.dataset.presionado === "true") return false;

    const c = etapaDe(zona.dataset.componente);
    if (!c || c.completo) return false;

    zona.dataset.presionado = "true";
    c.presionados += 1;

    // El sprite de esa ranura queda "presionado" (el CSS define el efecto).
    const instalado = c.instalados[c.presionables.indexOf(zona)];
    if (instalado) instalado.classList.add("instalado--presionado");

    emitir("presionado", {
      componente: c.id,
      presionados: c.presionados,
      total: c.presionables.length,
    });

    if (c.presionados >= c.presionables.length) terminarPresion(c);
    return true;
  }

  // Terminó la fase de presionar: si el componente tiene algo para deslizar
  // se pasa a esa fase; si no, la etapa está completa.
  function terminarPresion(c) {
    emitir("presionCompleta", { componente: c.id });
    if (c.deslizables.length) {
      c.deslizables.forEach((d) => d.classList.add("deslizable--activo"));
      cambiarFase(c, "deslizar");
    } else {
      completarComponente(c);
    }
  }

  /* ------------------------------------------------------------------------
     Fase "deslizar": se arrastra la pieza hacia la derecha. Lo que se mueve
     es el sprite ya colocado y su zona de agarre, con la variable CSS
     "--slide" (en px del arte).
     ------------------------------------------------------------------------ */

  function maximoDeslizar(zona) {
    return Number(zona.dataset.deslizarMax) || 12;
  }

  function asignarDeslizamiento(c, zona, valor) {
    zona.style.setProperty("--slide", String(valor));
    const instalado = c.instalados[c.deslizables.indexOf(zona)];
    if (instalado) instalado.style.setProperty("--slide", String(valor));
  }

  function completarDeslizamiento(c, zona) {
    if (zona.dataset.deslizado === "true") return;
    zona.dataset.deslizado = "true";
    zona.classList.remove("deslizable--activo");
    const instalado = c.instalados[c.deslizables.indexOf(zona)];
    if (instalado) instalado.classList.remove("instalado--arrastrando");
    asignarDeslizamiento(c, zona, maximoDeslizar(zona)); // termina de entrar

    c.deslizados += 1;
    emitir("deslizado", {
      componente: c.id,
      deslizados: c.deslizados,
      total: c.deslizables.length,
    });

    if (c.deslizados >= c.deslizables.length) {
      // Todo deslizado: el rack ya estaba encima, así que la pieza queda "debajo".
      marco.classList.add(`${c.id}-deslizado`);
      emitir("deslizamientoCompleto", { componente: c.id });
      completarComponente(c);
    }
  }

  function iniciarDeslizar(c, zona, eventoInicial) {
    if (!zona.classList.contains("deslizable--activo")) return;
    if (zona.dataset.deslizado === "true" || dialogoAbierto()) return;

    eventoInicial.preventDefault();

    const instalado = c.instalados[c.deslizables.indexOf(zona)];
    const escala = marco.getBoundingClientRect().width / LIENZO_ANCHO; // px de pantalla por px del arte
    const maximo = maximoDeslizar(zona);
    const inicioX = eventoInicial.clientX;
    let valor = 0;

    // Mientras se arrastra, el sprite sigue al puntero sin animación.
    if (instalado) instalado.classList.add("instalado--arrastrando");

    function alMover(e) {
      valor = Math.min(maximo, Math.max(0, (e.clientX - inicioX) / escala));
      asignarDeslizamiento(c, zona, valor);
    }

    function terminar() {
      document.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", cancelar);
      cancelarDeslizamientoEnCurso = null;
    }

    function soltar() {
      terminar();
      if (valor >= maximo * UMBRAL_DESLIZAR) {
        completarDeslizamiento(c, zona);
      } else {
        // No llegó: vuelve a su lugar (con animación).
        if (instalado) instalado.classList.remove("instalado--arrastrando");
        asignarDeslizamiento(c, zona, 0);
      }
    }

    function cancelar() {
      terminar();
      if (instalado) instalado.classList.remove("instalado--arrastrando");
      asignarDeslizamiento(c, zona, 0);
    }

    cancelarDeslizamientoEnCurso = cancelar;
    document.addEventListener("pointermove", alMover);
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", cancelar);
  }

  /* ------------------------------------------------------------------------
     Modo 1: seleccionar herramienta (click) y después click en la ranura.
     ------------------------------------------------------------------------ */

  itemsHerramientas.forEach((item) => {
    item.setAttribute("aria-pressed", "false");
    item.addEventListener("click", () => {
      if (item.dataset.agotado === "true" || item.dataset.bloqueado === "true") return;
      if (!nivelIniciado()) return;
      // Evita que el click sintético que el navegador dispara justo
      // después de soltar un arrastre vuelva a "seleccionar" la
      // herramienta que se acaba de arrastrar.
      if (item.dataset.arrastrando === "true") return;
      seleccionarHerramienta(item);
    });
  });

  etapas.forEach((c) => {
    c.sockets.forEach((socket) => {
      socket.addEventListener("click", () => {
        if (!itemActual || itemActual.dataset.herramienta !== c.id) return;
        colocarEn(socket, itemActual);
      });
    });
    c.presionables.forEach((zona) => {
      zona.addEventListener("click", () => presionar(zona));
    });
    c.deslizables.forEach((zona) => {
      zona.addEventListener("pointerdown", (evento) => iniciarDeslizar(c, zona, evento));
      // Alternativa por teclado: con la zona enfocada, flecha derecha / Enter
      // / espacio la desliza hasta el final.
      zona.addEventListener("keydown", (evento) => {
        if (!zona.classList.contains("deslizable--activo")) return;
        if (evento.key === "ArrowRight" || evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          completarDeslizamiento(c, zona);
        }
      });
    });
  });

  // Si se abre el diálogo de "¿Estás seguro de salir?", soltamos la
  // herramienta seleccionada para no dejar el cursor "pegado", y si había
  // un arrastre en curso lo cancelamos.
  document.addEventListener("juego:pausar", () => {
    deseleccionarHerramienta();
    if (cancelarArrastreEnCurso) cancelarArrastreEnCurso();
    if (cancelarDeslizamientoEnCurso) cancelarDeslizamientoEnCurso();
  });

  /* ------------------------------------------------------------------------
     Modo 2: arrastrar (drag & drop) el ícono directo hasta la ranura.
     Usa Pointer Events, así que funciona igual con mouse, trackpad,
     lápiz óptico y pantallas táctiles.
     ------------------------------------------------------------------------ */

  let cancelarArrastreEnCurso = null;
  let cancelarDeslizamientoEnCurso = null;

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

  function socketLibreBajoCursor(c, x, y) {
    for (const socket of c.sockets) {
      if (socket.dataset.ocupado === "true") continue;
      if (puntoDentroDeRect(socket.getBoundingClientRect(), x, y, MARGEN_SOLTAR_PX)) {
        return socket;
      }
    }
    return null;
  }

  // Arma el "fantasma" que sigue al puntero. Usa el sprite que se ve al
  // colocar el componente (ej. "gpu arrastrando.png"), recortado a su dibujo y
  // escalado al mismo tamaño que tiene en pantalla la ranura, así que al
  // arrastrarlo se ve exactamente del tamaño al que va a quedar. Si el
  // componente no tiene sprite (o no carga) se usa el ícono de la barra.
  function crearFantasma(c, imgOrigen) {
    const sprite = c.instalados[0];
    const r = sprite ? medirSprite(sprite) : null;

    if (sprite && r) {
      const escala = marco.getBoundingClientRect().width / LIENZO_ANCHO;
      const el = document.createElement("div");
      el.className = "arrastre-fantasma arrastre-fantasma--sprite";
      el.style.width = `${r.ancho * escala}px`;
      el.style.height = `${r.alto * escala}px`;
      el.style.backgroundImage = `url("${sprite.src}")`;
      el.style.backgroundSize = `${sprite.naturalWidth * escala}px ${sprite.naturalHeight * escala}px`;
      el.style.backgroundPosition = `${-r.x * escala}px ${-r.y * escala}px`;
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
    if (dialogoAbierto() || !nivelIniciado()) return;

    const c = etapaDe(item.dataset.herramienta);
    const imgOrigen = item.querySelector("img");
    if (!c || !c.desbloqueado || !imgOrigen) return;

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
      c.sockets.forEach((s) => s.classList.remove("socket--resaltado"));
    }

    function resaltarDestino(x, y) {
      limpiarResaltados();
      const socket = socketLibreBajoCursor(c, x, y);
      if (socket) socket.classList.add("socket--resaltado");
    }

    function alMover(e) {
      if (!arrastrando) {
        // Hasta que no se mueva lo suficiente es un simple click: no se
        // crea el fantasma y la selección por click sigue funcionando.
        if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) < UMBRAL_ARRASTRE_PX) return;
        arrastrando = true;
        deseleccionarHerramienta();
        fantasma = crearFantasma(c, imgOrigen);
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

      const socket = socketLibreBajoCursor(c, x, y);
      if (socket) colocarEn(socket, item);

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

  itemsHerramientas.forEach((item) => {
    item.addEventListener("pointerdown", (evento) => iniciarArrastre(item, evento));
  });

  /* ------------------------------------------------------------------------
     Arranque: toda herramienta empieza bloqueada salvo las de la primera
     etapa; las demás se desbloquean al completar la etapa anterior.
     ------------------------------------------------------------------------ */

  etapas.forEach((c) => c.items.forEach((i) => (i.dataset.bloqueado = "true")));
  desbloquear(etapas[0]);
})();
