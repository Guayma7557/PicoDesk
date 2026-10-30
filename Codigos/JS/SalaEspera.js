/* ==========================================================================
   sala_espera.js
   Lógica de la sala de espera (Simulada sin servidor).
   ========================================================================== */

(function () {
  
  // ==========================================
  // CONFIGURACIÓN DE SIMULACIÓN
  // ==========================================
  // DECISIÓN: Como no tenemos backend todavía, usamos esta variable para probar.
  // Cámbiala a 'false' para ver la pantalla como un usuario invitado (botón gris).
  const SIMULAR_HOST = true; 

  // Rutas de redirección
  const RUTA_MENU_PRINCIPAL = "../Menú_Principal/MenúPrincipal.html";
  // DECISIÓN: Comenten y ajusten esta ruta cuando tengan el HTML del nivel 1 listo.
  const RUTA_NIVEL_1 = "../Niveles/nivel_1/nivel_1.html"; 

  // ==========================================
  // ELEMENTOS DEL DOM
  // ==========================================
  const btnComenzar = document.getElementById("btn-comenzar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const overlayConfirmacion = document.getElementById("overlay-confirmacion");
  const btnSiSalir = document.getElementById("btn-si-salir");
  const btnNoSalir = document.getElementById("btn-no-salir");
  const pingBox = document.getElementById("ping-box");
  const codigoSalaSpan = document.getElementById("codigo-sala");

  // ==========================================
  // 1. LÓGICA DE HOST VS USUARIO
  // ==========================================
  function configurarRol() {
    if (!SIMULAR_HOST) {
      // Si es un invitado, deshabilitamos el botón de comenzar
      btnComenzar.classList.add("deshabilitado");
      btnComenzar.disabled = true;
    }
  }

  // ==========================================
  // 2. SIMULACIÓN DE JUGADORES ENTRANDO
  // ==========================================
  // DECISIÓN: Agarramos todos los slots vacíos y los llenamos de a uno 
  // cada 2 segundos para simular que la gente se va conectando.
  function simularConexionJugadores() {
    const slotsVacios = document.querySelectorAll(".slot-vacio");
    let index = 0;
    const nombresFicticios = ["Mateo", "Lucía", "Sofía", "Tomás", "Valentina"];

    const intervalo = setInterval(() => {
      if (index >= slotsVacios.length || index >= nombresFicticios.length) {
        clearInterval(intervalo);
        return;
      }

      const slot = slotsVacios[index];
      // Le quitamos la clase de "vacío" para que se haga visible
      slot.classList.remove("slot-vacio");
      
      // Le inyectamos el HTML de un jugador normal
      slot.innerHTML = `
        <div class="avatar"></div>
        <span class="nombre">${nombresFicticios[index]}</span>
      `;
      
      index++;
    }, 2000); // 2000ms = 2 segundos
  }

  // ==========================================
  // 3. SIMULACIÓN DE PING
  // ==========================================
  // DECISIÓN: Hacemos que el ping varíe aleatoriamente entre 40ms y 90ms cada 3 segundos
  function iniciarSimulacionPing() {
    setInterval(() => {
      // Math.random() genera un número entre 0 y 1. Lo multiplicamos por 50 y le sumamos 40.
      const pingAleatorio = Math.floor(Math.random() * 50) + 40;
      pingBox.textContent = `PING: ${pingAleatorio} ms`;
    }, 3000);
  }

  // ==========================================
  // 4. OBTENER CÓDIGO DE SALA (Futuro)
  // ==========================================
  function cargarCodigoSala() {
    // DECISIÓN: Cuando tengan el menú principal, este código podría pasarse por la URL.
    // Ejemplo futuro: sala_espera.html?codigo=XY99
    const urlParams = new URLSearchParams(window.location.search);
    const codigo = urlParams.get('codigo');
    
    if (codigo) {
      codigoSalaSpan.textContent = codigo;
    }
  }

  // ==========================================
  // EVENT LISTENERS (Botones y Modales)
  // ==========================================

  // Botón Comenzar: Redirige al Nivel 1
  btnComenzar.addEventListener("click", () => {
    // Solo dejamos avanzar si es el host (el botón ya está bloqueado si no lo es)
    window.location.href = RUTA_NIVEL_1;
  });

  // Botón Cancelar: Abre el modal
  btnCancelar.addEventListener("click", () => {
    overlayConfirmacion.classList.add("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "false");
  });

  // Botón "No" del modal: Cierra el modal
  btnNoSalir.addEventListener("click", () => {
    overlayConfirmacion.classList.remove("is-visible");
    overlayConfirmacion.setAttribute("aria-hidden", "true");
  });

  // Botón "Sí" del modal: Redirige al menú principal
  btnSiSalir.addEventListener("click", () => {
    window.location.href = RUTA_MENU_PRINCIPAL;
  });

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  configurarRol();
  simularConexionJugadores();
  iniciarSimulacionPing();
  cargarCodigoSala();

})();