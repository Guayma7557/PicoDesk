/* ==========================================================================
   nivel_5.js
   Lógica del Nivel 5: Fuente de poder y trazado de energía (Scary Maze).
   ========================================================================== */

(function () {
  // ==========================================
  // CONFIGURACIÓN Y ESTADO
  // ==========================================
  const RUTA_MENU = "../../MenúPrincipal.html";
  const RUTA_INTERMISION = "../../IntermisionesIndex.html";
  
  let etapaActual = 1; // 1: Intro, 2: Drag, 3: Maze
  let tiempoInicio = null;
  let puntaje = 100;
  let componentesCompletados = 0;
  const PUNTOS_POR_ERROR = 10;
  let timeoutFondo = null; // Para poder cancelarlo con el botón Skip

  // ==========================================
  // ELEMENTOS DEL DOM
  // ==========================================
  const introOverlay = document.getElementById("pantalla-intro");
  const juegoPrincipal = document.getElementById("juego-principal");
  const fondoMarco = document.getElementById("fondo-marco");
  const bgInclinado = document.getElementById("bg-inclinado");
  const bgSuperior = document.getElementById("bg-superior");
  const bgZoom = document.getElementById("bg-zoom");
  const btnSkip = document.getElementById("btn-skip");
  
  const zonaFuente = document.getElementById("zona-fuente");
  const herramientaFuente = document.getElementById("herramienta-fuente");
  const barraHerramientas = document.getElementById("barra-herramientas");
  
  const lienzo = document.getElementById("lienzo-carriles");
  const ctx = lienzo.getContext("2d");
  
  const barraProgresoRelleno = document.querySelector(".barra-progreso__relleno");
  const barraProgresoEl = document.querySelector(".barra-progreso");
  const misionFuente = document.querySelector('[data-mision="conectar-fuente"]');
  const misionComponentes = document.querySelector('[data-mision="conectar-componentes"]');
  const contadorComponentes = document.getElementById("componentes-completados");

  // Botones de salida
  const btnSalir = document.querySelector(".boton-salir");
  const overlayConfirmacion = document.querySelector(".overlay-confirmacion");
  const btnSi = document.querySelector(".dialogo-confirmacion__si");
  const btnNo = document.querySelector(".dialogo-confirmacion__no");

  // ==========================================
  // ETAPA 1: INTRODUCCIÓN Y TRANSICIÓN
  // ==========================================
  introOverlay.addEventListener("click", () => {
    introOverlay.classList.add("oculto");
    juegoPrincipal.classList.remove("oculto");
    tiempoInicio = Date.now();
    etapaActual = 2;

        // Iniciar el tutorial
    window.iniciarTutorial([
      {
        selector: '#lienzo-carriles',
        titulo: 'Sigue los caminos',
        texto: 'Mantén presionado el clic izquierdo y sigue las líneas negras desde el conector hacia los componentes. ¡No te salgas del carril!',
        accionEspecial: () => {
          // Hace que el lienzo brille para indicar dónde está el minijuego
          document.getElementById('lienzo-carriles').classList.add('carril-glow');
          // Quitar el brillo cuando el tutorial termine
          const btnTerminar = document.getElementById('tourSiguiente');
          if (btnTerminar.textContent === '¡Entendido!') {
             btnTerminar.addEventListener('click', () => {
               document.getElementById('lienzo-carriles').classList.remove('carril-glow');
             }, { once: true });
          }
        }
      }
    ], 'tutorial_nivel_5_visto');

    // Mostramos el botón de saltar
    btnSkip.classList.remove("oculto");

    // Animación de fondos
    timeoutFondo = setTimeout(() => {
      avanzarAFondoSuperior();
    }, 3000);
  });

  // Función separada para poder llamarla desde el setTimeout o desde el botón Skip
  function avanzarAFondoSuperior() {
    clearTimeout(timeoutFondo); // Prevenimos que se ejecute dos veces
    btnSkip.classList.add("oculto"); // Ocultamos el botón de saltar
    
    bgInclinado.classList.remove("bg-activo");
    bgSuperior.classList.add("bg-activo");
    
    zonaFuente.classList.add("activa");
    herramientaFuente.classList.add("sugerido");
  }

  // Botón para saltar animación
  btnSkip.addEventListener("click", () => {
    avanzarAFondoSuperior();
  });

  // ==========================================
  // ETAPA 2: DRAG AND DROP (FUENTE DE PODER)
  // ==========================================
  herramientaFuente.addEventListener("pointerdown", (e) => {
    if (!zonaFuente.classList.contains("activa")) return;
    
    e.preventDefault();
    herramientaFuente.classList.add("agarrando");
    herramientaFuente.classList.remove("sugerido");

    const fantasma = document.createElement("img");
    fantasma.src = herramientaFuente.querySelector("img").src;
    fantasma.className = "arrastre-fantasma";
    document.body.appendChild(fantasma);

    const moverFantasma = (clientX, clientY) => {
      fantasma.style.left = `${clientX}px`;
      fantasma.style.top = `${clientY}px`;
    };
    
    moverFantasma(e.clientX, e.clientY);

    const alMover = (event) => {
      moverFantasma(event.clientX, event.clientY);
      
      const rect = zonaFuente.getBoundingClientRect();
      if (event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        zonaFuente.classList.add("zona-hover");
      } else {
        zonaFuente.classList.remove("zona-hover");
      }
    };

    const alSoltar = (event) => {
      document.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerup", alSoltar);
      fantasma.remove();
      herramientaFuente.classList.remove("agarrando");

      const rect = zonaFuente.getBoundingClientRect();
      if (event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        completarConexionFuente();
      } else {
        zonaFuente.classList.remove("zona-hover");
        herramientaFuente.classList.add("sugerido");
      }
    };

    document.addEventListener("pointermove", alMover);
    document.addEventListener("pointerup", alSoltar);
  });

  function completarConexionFuente() {
    etapaActual = 3;
    zonaFuente.classList.add("completada");
    barraHerramientas.classList.add("oculto");
    misionFuente.classList.add("completada");
    misionComponentes.classList.remove("oculta");
    actualizarProgreso(25);

    bgSuperior.classList.remove("bg-activo");
    bgZoom.classList.add("bg-activo");
    zonaFuente.classList.remove("activa");

    setTimeout(() => {
      iniciarJuegoCarriles();
    }, 1000);
  }

  // ==========================================
  // ETAPA 3: LABERINTO (SCARY MAZE CON CANVAS)
  // ==========================================
  
  // DECISIÓN: Los caminos se separan más para que haya un "gap" (espacio) notorio.
  // Todos arrancan desde la misma coordenada de inicio.
  const puntoInicio = { x: 77, y: 63 }; 

  const caminos = [
    {
      id: "cpu",
      // Va hacia arriba y a la izquierda
      puntos: [{x: 77, y: 63}, {x: 77, y: 35}, {x: 60, y: 35}, {x: 60, y: 25}, {x: 35, y: 25}],
      completado: false,
      path2D: new Path2D()
    },
    {
      id: "ram",
      // Va hacia abajo y a la izquierda (por debajo de las otras)
      puntos: [{x: 77, y: 63}, {x: 77, y: 75}, {x: 25, y: 75}],
      completado: false,
      path2D: new Path2D()
    },
    {
      id: "sata",
      // Va hacia abajo, dobla a la izquierda y vuelve a bajar
      puntos: [{x: 77, y: 63}, {x: 77, y: 88}, {x: 55, y: 88}, {x: 55, y: 95}, {x: 35, y: 95}],
      completado: false,
      path2D: new Path2D()
    }
  ];

  let dibujando = false;
  let caminoActivo = null;
  let trail = []; // Guarda los puntos exactos que el usuario va trazando
  let animacionFrame; // Para el parpadeo del punto de inicio

  // Convierte porcentajes (0-100) a píxeles reales del canvas
  function pctAPx(pct, dimension) {
    return (pct / 100) * dimension;
  }

  function iniciarJuegoCarriles() {
    lienzo.classList.add("activo");
    
    // Ajustamos el tamaño real del canvas al del contenedor
    const rect = fondoMarco.getBoundingClientRect();
    lienzo.width = rect.width;
    lienzo.height = rect.height;

    // Generamos los objetos Path2D para cada camino
    caminos.forEach(c => {
      c.path2D = new Path2D();
      c.puntos.forEach((pt, i) => {
        const x = pctAPx(pt.x, lienzo.width);
        const y = pctAPx(pt.y, lienzo.height);
        if (i === 0) c.path2D.moveTo(x, y);
        else c.path2D.lineTo(x, y);
      });
    });

    // Iniciamos el bucle de dibujo (para el punto de inicio pulsante)
    dibujarLoop();
  }

  function dibujarLoop() {
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    
    // 1. Dibujar carriles base (los que no están completados)
    caminos.forEach(camino => {
      if (camino.completado) {
        // Si está completado, lo dibujamos verde permanente
        ctx.beginPath();
        camino.puntos.forEach((pt, i) => {
          const x = pctAPx(pt.x, lienzo.width);
          const y = pctAPx(pt.y, lienzo.height);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "#6fcf6f";
        ctx.lineWidth = 12;
        ctx.stroke();
      } else {
        // Si no, lo dibujamos negro con un borde gris para que se vea bien
        ctx.beginPath();
        camino.puntos.forEach((pt, i) => {
          const x = pctAPx(pt.x, lienzo.width);
          const y = pctAPx(pt.y, lienzo.height);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 12;
        ctx.stroke();
        // Borde sutil
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 25;
        ctx.globalCompositeOperation = "destination-over";
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
    });

    // 2. Dibujar Punto de Inicio Pulsante
    // DECISIÓN: Hacemos un círculo amarillo que late para que el usuario sepa dónde empezar a arrastrar
    const startX = pctAPx(puntoInicio.x, lienzo.width);
    const startY = pctAPx(puntoInicio.y, lienzo.height);
    const pulso = Math.sin(Date.now() / 200) * 4; // Oscila entre -4 y 4

    ctx.beginPath();
    ctx.arc(startX, startY, 15 + pulso, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(224, 178, 61, 0.7)"; // Amarillo
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Dibujar el trazo que está haciendo el usuario actualmente
    if (dibujando && trail.length > 0) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let pt of trail) {
        ctx.lineTo(pt.x, pt.y);
      }
      // Color verde neón brillante
      ctx.strokeStyle = "#00ff00"; 
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Efecto de resplandor
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 15;
      ctx.stroke();
      // Reseteamos la sombra para no afectar otros dibujos
      ctx.shadowBlur = 0;
    }

    animacionFrame = requestAnimationFrame(dibujarLoop);
  }

  // Verifica si el mouse está cerca del punto de inicio
  function estaCercaDelInicio(x, y) {
    const startX = pctAPx(puntoInicio.x, lienzo.width);
    const startY = pctAPx(puntoInicio.y, lienzo.height);
    return Math.hypot(x - startX, y - startY) < 40; // 40px de tolerancia
  }

  lienzo.addEventListener("pointerdown", (e) => {
    if (etapaActual !== 3) return;
    
    const rect = lienzo.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Solo podemos empezar si clickeamos cerca del conector
    if (estaCercaDelInicio(mouseX, mouseY)) {
      dibujando = true;
      trail = [{ x: mouseX, y: mouseY }];
    }
  });

  lienzo.addEventListener("pointermove", (e) => {
    if (!dibujando) return;
    
    const rect = lienzo.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // DECISIÓN: isPointInStroke nos permite saber si el mouse está sobre el "camino".
    // Hacemos que el trazo temporal sea grueso (35px) para que sea indulgente si el jugador se sale un poquito.
    ctx.lineWidth = 40; 
    
    let enAlgunCamino = null;
    
    // Recorremos todos los caminos para ver si el mouse toca alguno
    for (let c of caminos) {
      if (c.completado) continue;
      
      if (ctx.isPointInStroke(c.path2D, mouseX, mouseY)) {
        enAlgunCamino = c;
        break; // Ya lo encontramos, dejamos de buscar
      }
    }

    if (enAlgunCamino) {
      // ¡Está sobre un camino válido!
      
      // Prevenimos que el jugador haga "trampa" moviendo el mouse de golpe al final.
      // Verificamos que no se haya teletransportado lejos del último punto registrado.
      const ultimoPunto = trail[trail.length - 1];
      const distanciaAlUltimo = Math.hypot(mouseX - ultimoPunto.x, mouseY - ultimoPunto.y);
      
      if (distanciaAlUltimo < 60) {
        trail.push({ x: mouseX, y: mouseY });
        
        // ¿Llegó al final del camino?
        const fin = enAlgunCamino.puntos[enAlgunCamino.puntos.length - 1];
        const finX = pctAPx(fin.x, lienzo.width);
        const finY = pctAPx(fin.y, lienzo.height);
        
        if (Math.hypot(mouseX - finX, mouseY - finY) < 40) {
          // ¡COMPLETADO!
          completarCamino(enAlgunCamino);
        }
      }
    } else {
      // FALLÓ (se salió del carril)
      dibujando = false;
      trail = [];
      puntaje -= PUNTOS_POR_ERROR;
      
      // Efecto visual de error: flash rojo
      lienzo.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
      setTimeout(() => { lienzo.style.backgroundColor = "transparent"; }, 200);
    }
  });

  lienzo.addEventListener("pointerup", () => {
    // Si suelta el mouse antes de llegar al final, se reinicia el trazo
    if (dibujando) {
      dibujando = false;
      trail = [];
    }
  });

  function completarCamino(camino) {
    dibujando = false;
    camino.completado = true;
    trail = [];
    componentesCompletados++;
    
    contadorComponentes.textContent = componentesCompletados;
    actualizarProgreso(25 + (componentesCompletados * 25));

    if (componentesCompletados >= 3) {
      misionComponentes.classList.add("completada");
      finalizarJuego();
    }
  }

  // ==========================================
  // PROGRESO Y FINALIZACIÓN
  // ==========================================
  function actualizarProgreso(porcentaje) {
    barraProgresoRelleno.style.setProperty("--progreso", `${porcentaje}%`);
    barraProgresoEl.setAttribute("aria-valuenow", String(porcentaje));
  }

  function finalizarJuego() {
    const tiempoTotalMs = Date.now() - tiempoInicio;
    const minutos = Math.floor(tiempoTotalMs / 60000);
    const segundos = Math.floor((tiempoTotalMs % 60000) / 1000);
    const tiempoTexto = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    const puntajeFinal = Math.max(0, puntaje);

    const resultado = {
      nivel: 5,
      puntaje: puntajeFinal,
      tiempoMs: tiempoTotalMs,
      tiempoTexto: tiempoTexto,
    };

    sessionStorage.setItem("resultadoNivel", JSON.stringify(resultado));

    setTimeout(() => {
      window.location.href = RUTA_INTERMISION;
    }, 1500);
  }

  // ==========================================
  // EVENTOS DE SALIDA
  // ==========================================
  btnSalir.addEventListener("click", () => {
    overlayConfirmacion.classList.add("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "false");
  });

  btnNo.addEventListener("click", () => {
    overlayConfirmacion.classList.remove("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "true");
  });

  btnSi.addEventListener("click", () => {
    window.location.href = RUTA_MENU;
  });

  // Ajustar Canvas al redimensionar ventana
  window.addEventListener("resize", () => {
    if (etapaActual === 3) {
      const rect = fondoMarco.getBoundingClientRect();
      lienzo.width = rect.width;
      lienzo.height = rect.height;
      
      // Recreamos los Path2D con las nuevas dimensiones
      caminos.forEach(c => {
        c.path2D = new Path2D();
        c.puntos.forEach((pt, i) => {
          const x = pctAPx(pt.x, lienzo.width);
          const y = pctAPx(pt.y, lienzo.height);
          if (i === 0) c.path2D.moveTo(x, y);
          else c.path2D.lineTo(x, y);
        });
      });
    }
  });

})();