/* ==========================================================================
   cable_nivel_3.js
   Fase "conectar" del nivel 3: el cable (rojo) que sale de la parte del disco
   duro que asoma bajo el rack. El jugador mantiene apretado el botón del
   mouse sobre el extremo libre y lo arrastra hasta el punto de la placa madre
   donde conecta ("Fondo superior - Nivel 5"); si suelta ahí, se conecta. Si
   suelta en cualquier otro lado, el cable vuelve a su lugar.

   Todo se dibuja en un <canvas> de 521x260 (la misma resolución que el arte,
   escalado con "image-rendering: pixelated"), así cada punto del dibujo cae
   exactamente sobre un píxel del arte y el cable se ve como el resto del
   juego. La función dibujar() borra y vuelve a dibujar el lienzo en cada
   cuadro (requestAnimationFrame) con:
     1) el cable rojo, desde su ancla hasta donde está el extremo (que sigue
        al mouse);
     2) mientras se arrastra, un hilo de rayitas amarillas desde el extremo
        hasta el destino, que se alarga y se acorta según la distancia y
        "camina" hacia el destino;
     3) las auras amarillas (cuadros punteados que parpadean) que marcan qué
        agarrar y adónde llevarlo.

   Se conecta con herramientas_nivel_3.js solo por eventos:
     nivel3:faseConectar  { componente }   <- empieza la fase (la dispara el motor)
     nivel3:cableConectado { componente }  -> el cable llegó a destino
   Cada ".conexion" del HTML es un cable (el botón invisible que se agarra) y
   declara su geometría, en px del arte (521x260):
     data-ancla    "x,y"  donde nace el cable (pegado a lo que asoma del disco)
     data-reposo   "x,y"  donde queda el extremo libre antes de agarrarlo
     data-destino  "x,y"  centro del lugar donde hay que llevarlo
     data-radio    número a cuántos px del destino cuenta como conectado
   ========================================================================== */

(function () {
  const marco = document.querySelector(".fondo-marco");
  const lienzo = document.querySelector(".cable-lienzo");
  const asas = Array.from(document.querySelectorAll(".conexion"));
  if (!marco || !lienzo || !asas.length) return;

  const ctx = lienzo.getContext("2d");
  const ANCHO = lienzo.width; // 521
  const ALTO = lienzo.height; // 260

  // Colores tomados del arte: el rojo del cable de "Fondo superior - Nivel 5" y
  // el amarillo de las auras del disco duro.
  const COLOR_CABLE = "#b00a0a";
  const COLOR_GUIA = "#fff700";

  // Forma del cable ya conectado, ajustada píxel a píxel al cable de
  // "Fondo superior - Nivel 5" (coincide con él en ~94%). Todo en px del arte
  // y RELATIVO al ancla, así si se mueve el ancla el cable se mueve con ella:
  //   fin: donde termina el cable cuando está conectado
  //   c1 / c2: puntos de control de la curva (Bézier cúbica)
  //   ancho: grosor; anchoPunta/largoPunta: cuánto se afina la punta (fracción
  //   del largo) al conectarse, como en el arte.
  const FORMA = {
    fin: [-11.23, -55.82],
    c1: [-7.38, 9.03],
    c2: [0.46, -33.82],
    ancho: 8.16,
    anchoPunta: 5.1,
    largoPunta: 0.302,
  };
  const LARGO_FINAL = Math.hypot(FORMA.fin[0], FORMA.fin[1]);
  const PUNTOS_CURVA = 600; // cuántos "sellos" cuadrados forman el cable

  // Largo (en px del arte) hasta el cual el cable se ve recto: un tramo corto
  // se ve como un cable estirado y recién al alargarse toma la curva final.
  const LARGO_RECTO = 14;

  // Hilo de rayitas amarillas: rayita de 3 px, hueco de 3 px, y camina hacia el
  // destino a VELOCIDAD_GUIA px por segundo.
  const RAYA = 3;
  const PERIODO_GUIA = 6;
  const VELOCIDAD_GUIA = 10;
  const GROSOR_GUIA = 1;

  // Auras: cuadro punteado que alterna entre dos posiciones de las rayas
  // (igual que los dos cuadros de "Disco aura") cada PARPADEO_MS.
  const LADO_AURA = 16;
  const PARPADEO_MS = 400;

  const TAM_ASA = 18; // lado (px del arte) de la zona donde se agarra el cable
  const DUR_SALIR = 280; // el cable "sale" del disco
  const DUR_VOLVER = 240; // vuelve a su lugar si se suelta mal
  const DUR_CONECTAR = 260; // se encaja en el destino

  /* ------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */

  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
  const suavizar = (t) => {
    const x = limitar(t, 0, 1);
    return x * x * (3 - 2 * x);
  };
  const salida = (t) => 1 - Math.pow(1 - limitar(t, 0, 1), 3); // ease-out
  const mezclar = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  function leerPar(texto, porDefecto) {
    const n = (texto || "").split(",").map((v) => Number(v.trim()));
    return n.length === 2 && n.every(Number.isFinite) ? n : porDefecto;
  }

  // Posición del puntero en px del arte (0..521, 0..260).
  function aArte(evento) {
    const r = marco.getBoundingClientRect();
    return [
      ((evento.clientX - r.left) / r.width) * ANCHO,
      ((evento.clientY - r.top) / r.height) * ALTO,
    ];
  }

  /* ------------------------------------------------------------------------
     Cables: uno por cada ".conexion" del HTML.
     ------------------------------------------------------------------------ */

  const cables = asas.map((asa) => {
    const ancla = leerPar(asa.dataset.ancla, [0, 0]);
    const reposo = leerPar(asa.dataset.reposo, [ancla[0] - 14, ancla[1]]);
    const destino = leerPar(asa.dataset.destino, [ancla[0] + FORMA.fin[0], ancla[1] + FORMA.fin[1]]);
    const cable = {
      id: asa.dataset.componente,
      asa,
      ancla,
      reposo,
      destino,
      radio: Number(asa.dataset.radio) || 10,
      fin: [ancla[0] + FORMA.fin[0], ancla[1] + FORMA.fin[1]], // dónde termina conectado
      // "inactivo" (la fase no empezó) | "saliendo" | "reposo" | "arrastrando"
      // | "volviendo" | "conectando" | "conectado"
      estado: "inactivo",
      extremo: [ancla[0], ancla[1]], // dónde está hoy el extremo libre del cable
      puntero: [0, 0], // último lugar del puntero (px del arte)
      agarre: [0, 0], // diferencia entre el extremo y el puntero al agarrarlo
      afilado: 0, // 0 = punta pareja (arrastrando), 1 = punta afinada (conectado)
      anim: null,
    };
    // La zona de agarre (invisible) queda centrada en el extremo en reposo.
    asa.style.setProperty("--x", String(reposo[0] - TAM_ASA / 2));
    asa.style.setProperty("--y", String(reposo[1] - TAM_ASA / 2));
    asa.style.setProperty("--w", String(TAM_ASA));
    asa.style.setProperty("--h", String(TAM_ASA));
    return cable;
  });

  const cableDe = (id) => cables.find((c) => c.id === id) || null;

  /* ------------------------------------------------------------------------
     Dibujo (todo en px del arte, con "sellos" cuadrados de 1 px de grilla para
     que quede pixelado y no suavizado).
     ------------------------------------------------------------------------ */

  // Cable desde el ancla A hasta el extremo Q. Su forma va de recta (cable
  // corto, estirado) a la curva final (cuando llega a destino), girando y
  // escalando la curva final según dónde esté Q: al llegar al destino queda
  // IDÉNTICA a la del arte.
  function trazarCable(A, Q, afilado) {
    const wx = Q[0] - A[0];
    const wy = Q[1] - A[1];
    const largo = Math.hypot(wx, wy);
    if (largo < 0.5) return;

    const escala = largo / LARGO_FINAL;
    const giro = Math.atan2(wy, wx) - Math.atan2(FORMA.fin[1], FORMA.fin[0]);
    const cos = Math.cos(giro);
    const sin = Math.sin(giro);
    const girar = (v) => [
      A[0] + escala * (v[0] * cos - v[1] * sin),
      A[1] + escala * (v[0] * sin + v[1] * cos),
    ];
    const recto1 = [A[0] + wx / 3, A[1] + wy / 3];
    const recto2 = [A[0] + (2 * wx) / 3, A[1] + (2 * wy) / 3];
    const k = suavizar((largo - LARGO_RECTO) / (0.9 * LARGO_FINAL - LARGO_RECTO));
    const P1 = mezclar(recto1, girar(FORMA.c1), k);
    const P2 = mezclar(recto2, girar(FORMA.c2), k);

    const anchoPunta = FORMA.ancho + (FORMA.anchoPunta - FORMA.ancho) * afilado;
    ctx.fillStyle = COLOR_CABLE;
    for (let i = 0; i <= PUNTOS_CURVA; i++) {
      const t = i / PUNTOS_CURVA;
      const u = 1 - t;
      const x = u * u * u * A[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * Q[0];
      const y = u * u * u * A[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * Q[1];
      const ancho =
        t <= 1 - FORMA.largoPunta
          ? FORMA.ancho
          : anchoPunta + (FORMA.ancho - anchoPunta) * ((1 - t) / FORMA.largoPunta);
      const lado = Math.max(1, Math.round(ancho));
      ctx.fillRect(Math.round(x - ancho / 2), Math.round(y - ancho / 2), lado, lado);
    }
  }

  // Hilo de rayitas desde el extremo E hasta el destino D. Las rayitas se
  // cuentan desde el destino, así no "tiemblan" cuando el puntero se mueve:
  // solo aparecen o desaparecen más al alejarse o acercarse.
  function trazarHilo(E, D, ahora) {
    const dx = E[0] - D[0];
    const dy = E[1] - D[1];
    const distancia = Math.hypot(dx, dy);
    if (distancia < 1) return;

    const avance = (ahora / 1000) * VELOCIDAD_GUIA; // las rayitas caminan hacia D
    ctx.fillStyle = COLOR_GUIA;
    for (let u = 0; u <= distancia; u += 1) {
      if ((u + avance) % PERIODO_GUIA < RAYA) {
        const f = u / distancia;
        ctx.fillRect(Math.round(D[0] + dx * f), Math.round(D[1] + dy * f), GROSOR_GUIA, GROSOR_GUIA);
      }
    }
  }

  // Aura: cuadro punteado de LADO_AURA centrado en C. "fija" = línea continua.
  function trazarAura(C, ahora, fija) {
    const x0 = Math.round(C[0] - LADO_AURA / 2);
    const y0 = Math.round(C[1] - LADO_AURA / 2);
    const x1 = x0 + LADO_AURA - 1;
    const y1 = y0 + LADO_AURA - 1;
    const desfase = (Math.floor(ahora / PARPADEO_MS) % 2) * RAYA; // los 2 cuadros del parpadeo

    // Recorre el perímetro dando la vuelta: arriba, derecha, abajo, izquierda.
    const perimetro = [];
    for (let x = x0; x <= x1; x++) perimetro.push([x, y0]);
    for (let y = y0 + 1; y <= y1; y++) perimetro.push([x1, y]);
    for (let x = x1 - 1; x >= x0; x--) perimetro.push([x, y1]);
    for (let y = y1 - 1; y > y0; y--) perimetro.push([x0, y]);

    ctx.fillStyle = COLOR_GUIA;
    perimetro.forEach(([x, y], i) => {
      if (fija || (i + desfase) % PERIODO_GUIA < RAYA) ctx.fillRect(x, y, 1, 1);
    });
  }

  let ultimoCuadro = 0;
  let animando = false;

  // Un cuadro: actualiza el estado de cada cable y lo vuelve a dibujar.
  function dibujar(ahora) {
    const dt = Math.min(64, ahora - ultimoCuadro || 16);
    ultimoCuadro = ahora;
    ctx.clearRect(0, 0, ANCHO, ALTO);

    let sigue = false;
    cables.forEach((cable) => {
      if (cable.estado === "inactivo") return;
      avanzar(cable, ahora, dt);

      const cerca = estaCerca(cable);
      // Si el extremo está en la zona de destino se muestra ya encajado.
      const extremo = cable.estado === "arrastrando" && cerca ? cable.fin : cable.extremo;
      trazarCable(cable.ancla, extremo, cable.afilado);

      if (cable.estado === "reposo" || cable.estado === "saliendo") {
        if (cable.estado === "reposo") {
          trazarAura(cable.reposo, ahora, false); // "agarrá esto"
          trazarAura(cable.destino, ahora, false); // "llevalo acá"
        }
      } else if (cable.estado === "arrastrando") {
        trazarAura(cable.destino, ahora, cerca);
        if (!cerca) trazarHilo(cable.extremo, cable.destino, ahora);
      }
      if (cable.estado !== "conectado") sigue = true;
    });

    animando = sigue;
    if (sigue) requestAnimationFrame(dibujar);
  }

  function arrancar() {
    if (animando) return;
    animando = true;
    ultimoCuadro = performance.now();
    requestAnimationFrame(dibujar);
  }

  function estaCerca(cable) {
    return Math.hypot(cable.extremo[0] - cable.destino[0], cable.extremo[1] - cable.destino[1]) <= cable.radio;
  }

  /* ------------------------------------------------------------------------
     Estados y animaciones
     ------------------------------------------------------------------------ */

  function animar(cable, tipo, ahora, duracion, hasta, afilado) {
    cable.anim = {
      tipo,
      t0: ahora,
      duracion,
      desde: cable.extremo.slice(),
      hasta,
      afiladoDesde: cable.afilado,
      afiladoHasta: afilado,
    };
  }

  // Actualiza la posición del extremo según el estado (se llama en cada cuadro).
  function avanzar(cable, ahora, dt) {
    if (cable.estado === "arrastrando") {
      // El extremo sigue al puntero; la diferencia con la que se lo agarró se
      // va apagando para que no pegue un salto al empezar a arrastrar.
      const apagado = Math.pow(0.82, dt / 16.67);
      cable.agarre[0] *= apagado;
      cable.agarre[1] *= apagado;
      cable.extremo = [
        limitar(cable.puntero[0] + cable.agarre[0], 0, ANCHO),
        limitar(cable.puntero[1] + cable.agarre[1], 0, ALTO),
      ];
      return;
    }

    const a = cable.anim;
    if (!a) return;
    if (a.t0 === null) a.t0 = ahora; // la animación se pidió fuera de un cuadro
    const p = limitar((ahora - a.t0) / a.duracion, 0, 1);
    const e = salida(p);
    cable.extremo = mezclar(a.desde, a.hasta, e);
    cable.afilado = a.afiladoDesde + (a.afiladoHasta - a.afiladoDesde) * e;
    if (p < 1) return;

    cable.anim = null;
    if (a.tipo === "saliendo" || a.tipo === "volviendo") {
      cable.estado = "reposo";
      cable.asa.classList.add("conexion--activo");
    } else if (a.tipo === "conectando") {
      cable.estado = "conectado";
      document.dispatchEvent(new CustomEvent("nivel3:cableConectado", { detail: { componente: cable.id } }));
    }
  }

  function soltarEnReposo(cable) {
    cable.estado = "volviendo";
    cable.asa.classList.remove("conexion--activo");
    animar(cable, "volviendo", null, DUR_VOLVER, cable.reposo.slice(), 0);
    document.body.style.cursor = "";
    arrancar();
  }

  function conectar(cable) {
    cable.estado = "conectando";
    cable.asa.classList.remove("conexion--activo");
    animar(cable, "conectando", null, DUR_CONECTAR, cable.fin.slice(), 1);
    document.body.style.cursor = "";
    arrancar();
  }

  /* ------------------------------------------------------------------------
     Eventos
     ------------------------------------------------------------------------ */

  // El motor avisa que empezó la fase del cable: el cable sale del disco.
  document.addEventListener("nivel3:faseConectar", (evento) => {
    const cable = cableDe(evento.detail.componente);
    if (!cable || cable.estado !== "inactivo") return;
    cable.estado = "saliendo";
    cable.extremo = cable.ancla.slice();
    animar(cable, "saliendo", null, DUR_SALIR, cable.reposo.slice(), 0);
    arrancar();
  });

  cables.forEach((cable) => {
    const asa = cable.asa;

    // Agarrar: hay que mantener apretado el botón principal del mouse (o el
    // dedo / lápiz) mientras se arrastra.
    asa.addEventListener("pointerdown", (evento) => {
      if (cable.estado !== "reposo" || evento.button !== 0) return;
      evento.preventDefault();
      cable.puntero = aArte(evento);
      cable.agarre = [cable.extremo[0] - cable.puntero[0], cable.extremo[1] - cable.puntero[1]];
      cable.estado = "arrastrando";
      cable.anim = null;
      // Con la captura, el cable sigue al puntero aunque salga de la zona
      // (o de la ventana) y se entera de cuándo se suelta el botón.
      if (asa.setPointerCapture) asa.setPointerCapture(evento.pointerId);
      document.body.style.cursor = "grabbing";
    });

    asa.addEventListener("pointermove", (evento) => {
      if (cable.estado === "arrastrando") cable.puntero = aArte(evento);
    });

    // Soltar: si el extremo está en la zona de destino se conecta; si no, el
    // cable vuelve a su lugar.
    asa.addEventListener("pointerup", (evento) => {
      if (cable.estado !== "arrastrando") return;
      cable.puntero = aArte(evento);
      cable.extremo = [
        limitar(cable.puntero[0] + cable.agarre[0], 0, ANCHO),
        limitar(cable.puntero[1] + cable.agarre[1], 0, ALTO),
      ];
      if (estaCerca(cable)) conectar(cable);
      else soltarEnReposo(cable);
    });

    // Si se interrumpe el arrastre (cambio de ventana, evento cancelado...), vuelve.
    const cancelar = () => {
      if (cable.estado === "arrastrando") soltarEnReposo(cable);
    };
    asa.addEventListener("pointercancel", cancelar);
    asa.addEventListener("lostpointercapture", cancelar);

    // Alternativa por teclado: con la zona enfocada, Enter o espacio conectan.
    asa.addEventListener("keydown", (evento) => {
      if (cable.estado !== "reposo") return;
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        conectar(cable);
      }
    });
  });

  // Si se abre el diálogo de "¿Estás seguro de salir?" en medio de un arrastre,
  // el cable vuelve a su lugar.
  document.addEventListener("juego:pausar", () => {
    cables.forEach((cable) => {
      if (cable.estado === "arrastrando") soltarEnReposo(cable);
    });
  });
})();
