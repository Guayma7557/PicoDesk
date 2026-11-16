/* ==========================================================================
   nivel_5.js
   Lógica principal del Nivel 5 (Transferencia de datos).
   ========================================================================== */

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
  let bloqueoInput = false;

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
  function generarCodigoAleatorio() {
    let codigo = "";
    for (let i = 0; i < LONGITUD_CODIGO; i++) {
      codigo += Math.random() < 0.5 ? "0" : "1";
    }
    return codigo;
  }

  function actualizarCages() {
    cages.forEach((cage, index) => {
      if (inputUsuario[index]) {
        cage.textContent = inputUsuario[index];
        cage.classList.remove("vacio");
      } else {
        cage.textContent = "";
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
    
    inputContainer.classList.remove("error", "success");
    bloqueoInput = false;
    rondasEl.textContent = rondaActual;
  }

  function evaluarInput() {
    if (bloqueoInput) return;
    bloqueoInput = true;

    if (inputUsuario === codigoObjetivo) {
      inputContainer.classList.add("success");
      
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
      inputContainer.classList.add("error");
      puntos -= PENALIZACION_POR_ERROR;
      
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
    const porcentaje = Math.round(((rondaActual - 1) / TOTAL_RONDAS) * 100);
    barraProgresoRelleno.style.setProperty("--progreso", `${porcentaje}%`);
    barraProgresoEl.setAttribute("aria-valuenow", String(porcentaje));
  }

  function finalizarJuego() {
    juegoTerminado = true;
    actualizarBarraProgreso();
    
    const tiempoTotalMs = Date.now() - tiempoInicio;
    const minutos = Math.floor(tiempoTotalMs / 60000);
    const segundos = Math.floor((tiempoTotalMs % 60000) / 1000);
    const tiempoTexto = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    
    const puntajeFinal = Math.max(0, puntos);

    const resultado = {
      nivel: 5, // CORRECCIÓN: Ahora guarda correctamente el Nivel 5
      puntaje: puntajeFinal,
      tiempoMs: tiempoTotalMs,
      tiempoTexto: tiempoTexto,
    };

    try {
      sessionStorage.setItem("resultadoNivel", JSON.stringify(resultado));
    } catch (e) {
      console.error("No se pudo guardar el resultado:", e);
    }

    setTimeout(() => {
      window.location.href = RUTA_INTERMISION;
    }, 1000);
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  pantallaIntro.addEventListener("click", () => {
    window.iniciarTutorial([
      {
        selector: '.contenedor-superior',
        titulo: 'Copia el código',
        texto: 'El CPU envía datos. Lee el código binario de arriba y réplicalo abajo usando las teclas 0 y 1. ¡Cada error resta puntos!'
      }
    ], 'tutorial_nivel_5_visto');

    pantallaIntro.classList.add("oculto");
    juegoPrincipal.classList.remove("oculto");
    
    tiempoInicio = Date.now();
    iniciarRonda();
    actualizarBarraProgreso();
  });

  document.addEventListener("keydown", (evento) => {
    if (juegoTerminado || !pantallaIntro.classList.contains("oculto")) return;
    
    if (evento.key === "0" || evento.key === "1") {
      agregarCaracter(evento.key);
    } else if (evento.key === "Backspace") {
      borrarCaracter();
    }
  });

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