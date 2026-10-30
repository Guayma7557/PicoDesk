/* ==========================================================================
   nivel_2.js
   Lógica principal del Nivel 2.
   ========================================================================== */

// DECISIÓN: Usamos una función autoejecutable (IIFE) para que las variables 
// como "puntos" o "inputUsuario" no choquen con otros archivos de la página.
(function () {
  
  // ==========================================
  // CONFIGURACIÓN
  // ==========================================
  const TOTAL_RONDAS = 5;
  const LONGITUD_CODIGO = 8;
  const PUNTOS_INICIALES = 100;
  const PENALIZACION_POR_ERROR = 5;
  
  const RUTA_MENU_PRINCIPAL = "../../MenúPrincipal.html";
  const RUTA_INTERMISION = "../../IntermisionesIndex.html";

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  let rondaActual = 1;
  let codigoObjetivo = "";
  let inputUsuario = "";
  let puntos = PUNTOS_INICIALES;
  let tiempoInicio = null;
  let juegoTerminado = false;
  let bloqueoInput = false; // Evita que el jugador escriba mientras se muestran los colores

  // ==========================================
  // ELEMENTOS DEL DOM
  // ==========================================
  const pantallaIntro = document.getElementById("pantalla-intro");
  const juegoPrincipal = document.getElementById("juego-principal");
  const codigoObjetivoEl = document.getElementById("codigo-objetivo");
  const inputContainer = document.getElementById("input-container");
  const cages = document.querySelectorAll(".cage");
  const rondasEl = document.getElementById("ronda-actual");
  const barraProgresoEl = document.querySelector(".barra-progreso");
  const barraProgresoRelleno = document.querySelector(".barra-progreso__relleno");
  
  const botonSalir = document.querySelector(".boton-salir");
  const overlayConfirmacion = document.querySelector(".overlay-confirmacion");
  const botonNo = document.querySelector(".dialogo-confirmacion__no");
  const botonSi = document.querySelector(".dialogo-confirmacion__si");
  const teclasMoviles = document.querySelectorAll(".btn-tecla");

  // ==========================================
  // LÓGICA PRINCIPAL
  // ==========================================

  /**
   * Genera un string de 8 caracteres de "0" y "1" aleatoriamente.
   */
  function generarCodigoAleatorio() {
    let codigo = "";
    for (let i = 0; i < LONGITUD_CODIGO; i++) {
      codigo += Math.random() < 0.5 ? "0" : "1";
    }
    return codigo;
  }

  /**
   * Actualiza las cajas visualmente basándose en lo que el jugador escribió.
   */
  function actualizarCages() {
    cages.forEach((cage, index) => {
      if (inputUsuario[index]) {
        // Si hay un número en esta posición, lo mostramos y quitamos el cursor
        cage.textContent = inputUsuario[index];
        cage.classList.remove("vacio");
      } else {
        cage.textContent = "";
        // DECISIÓN: Solo agregamos la clase "vacio" a la caja actual (donde toca escribir)
        // para que el cursor parpadeante (::before en CSS) aparezca solo ahí.
        if (index === inputUsuario.length) {
          cage.classList.add("vacio");
        } else {
          cage.classList.remove("vacio");
        }
      }
    });
  }

  function iniciarRonda() {
    codigoObjetivo = generarCodigoAleatorio();
    codigoObjetivoEl.textContent = codigoObjetivo;
    inputUsuario = "";
    actualizarCages();
    
    // Limpiamos los bordes de error o éxito
    inputContainer.classList.remove("error", "success");
    bloqueoInput = false;
    rondasEl.textContent = rondaActual;
  }

  function evaluarInput() {
    if (bloqueoInput) return;
    bloqueoInput = true; // Bloqueamos para que no siga tipeando

    if (inputUsuario === codigoObjetivo) {
      // ACIERTO
      inputContainer.classList.add("success");
      
      // DECISIÓN: Usamos setTimeout para que el jugador vea el borde verde durante 
      // 0.8 segundos antes de que pasemos a la siguiente ronda o terminemos.
      setTimeout(() => {
        rondaActual++;
        if (rondaActual > TOTAL_RONDAS) {
          finalizarJuego();
        } else {
          actualizarBarraProgreso();
          iniciarRonda();
        }
      }, 800);
      
    } else {
      // ERROR
      inputContainer.classList.add("error");
      puntos -= PENALIZACION_POR_ERROR;
      
      // DECISIÓN: Si se equivoca, mostramos el borde rojo, restamos puntos, 
      // y después de 0.8s borramos lo que escribió para que lo intente de nuevo.
      setTimeout(() => {
        inputContainer.classList.remove("error");
        inputUsuario = "";
        actualizarCages();
        bloqueoInput = false;
      }, 800);
    }
  }

  function agregarCaracter(char) {
    if (bloqueoInput) return;
    if (inputUsuario.length < LONGITUD_CODIGO) {
      inputUsuario += char;
      actualizarCages();
      
      // DECISIÓN: Auto-envío. Si llega a 8 caracteres, evaluamos sin necesidad de apretar Enter.
      if (inputUsuario.length === LONGITUD_CODIGO) {
        evaluarInput();
      }
    }
  }

  function borrarCaracter() {
    if (bloqueoInput) return;
    if (inputUsuario.length > 0) {
      inputUsuario = inputUsuario.slice(0, -1);
      actualizarCages();
    }
  }

  function actualizarBarraProgreso() {
    // Calculamos el % basado en las rondas completadas
    const porcentaje = Math.round(((rondaActual - 1) / TOTAL_RONDAS) * 100);
    // Actualizamos la variable CSS que controla la altura del relleno
    barraProgresoRelleno.style.setProperty("--progreso", `${porcentaje}%`);
    barraProgresoEl.setAttribute("aria-valuenow", String(porcentaje));
  }

  function finalizarJuego() {
    juegoTerminado = true;
    actualizarBarraProgreso(); // Llega al 100%
    
    // Calculamos el tiempo total
    const tiempoTotalMs = Date.now() - tiempoInicio;
    const minutos = Math.floor(tiempoTotalMs / 60000);
    const segundos = Math.floor((tiempoTotalMs % 60000) / 1000);
    const tiempoTexto = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    
    // DECISIÓN: Math.max asegura que el puntaje nunca sea negativo.
    const puntajeFinal = Math.max(0, puntos);

    // Guardamos el resultado en sessionStorage para que Intermisiones lo lea
    const resultado = {
      nivel: 2,
      puntaje: puntajeFinal,
      tiempoMs: tiempoTotalMs,
      tiempoTexto: tiempoTexto,
    };

    try {
      sessionStorage.setItem("resultadoNivel", JSON.stringify(resultado));
    } catch (e) {
      console.error("No se pudo guardar el resultado:", e);
    }

    // Redirigimos a la Intermisión
    setTimeout(() => {
      window.location.href = RUTA_INTERMISION;
    }, 1000);
  }

  // ==========================================
  // EVENT LISTENERS (Escuchadores de eventos)
  // ==========================================

  // 1. Iniciar juego al hacer clic en la intro
  pantallaIntro.addEventListener("click", () => {
    pantallaIntro.classList.add("oculto");
    juegoPrincipal.classList.remove("oculto");
    
    tiempoInicio = Date.now(); // El cronómetro empieza acá
    iniciarRonda();
    actualizarBarraProgreso();
  });

  // 2. Teclado físico (PC)
  document.addEventListener("keydown", (evento) => {
    if (juegoTerminado || !pantallaIntro.classList.contains("oculto")) return;
    
    if (evento.key === "0" || evento.key === "1") {
      agregarCaracter(evento.key);
    } else if (evento.key === "Backspace") {
      borrarCaracter();
    }
  });

  // 3. Teclado virtual (Móvil)
  teclasMoviles.forEach((tecla) => {
    tecla.addEventListener("click", () => {
      const key = tecla.dataset.key;
      if (key === "Backspace") {
        borrarCaracter();
      } else {
        agregarCaracter(key);
      }
    });
  });

  // 4. Lógica del diálogo de salida
  botonSalir.addEventListener("click", () => {
    overlayConfirmacion.classList.add("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "false");
  });

  botonNo.addEventListener("click", () => {
    overlayConfirmacion.classList.remove("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "true");
  });

  botonSi.addEventListener("click", () => {
    window.location.href = RUTA_MENU_PRINCIPAL;
  });

})();