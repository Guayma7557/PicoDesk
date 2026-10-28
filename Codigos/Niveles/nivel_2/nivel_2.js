/* confirmar-salida.js */

(function () {
  const botonSalir = document.querySelector(".boton-salir");
  const overlay = document.querySelector(".overlay-confirmacion");
  const botonNo = document.querySelector(".dialogo-confirmacion__no");
  const opcionSi = document.querySelector(".dialogo-confirmacion__si");

  if (!botonSalir || !overlay || !botonNo || !opcionSi) return;

  function abrirDialogo() {
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");

    // Mientras el diálogo está abierto, el nivel deja de ser interactuable:
    // se deshabilita el botón triangular para que no se pueda volver a
    // disparar el diálogo, y el overlay (a pantalla completa, por encima
    // de todo con z-index) absorbe cualquier click sobre el juego.
    botonSalir.disabled = true;

    // Avisamos al resto del nivel (herramientas, arrastres en curso, etc.)
    // que el juego quedó en pausa mientras el diálogo está abierto.
    document.dispatchEvent(new CustomEvent("juego:pausar"));

    // Enfocamos "No" por accesibilidad/teclado: es la opción segura por defecto.
    botonNo.focus();

    document.addEventListener("keydown", cerrarConEscape);
  }

  function cerrarDialogo() {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");

    botonSalir.disabled = false;
    botonSalir.focus();

    document.removeEventListener("keydown", cerrarConEscape);
  }

  function cerrarConEscape(evento) {
    if (evento.key === "Escape") {
      cerrarDialogo();
    }
  }
  const RUTA_MENU_PRINCIPAL = "../../Menú_Principal/index.html"; // Se busca por las carpetas el menú principal
  function irAlMenuPrincipal() {
    window.location.href = RUTA_MENU_PRINCIPAL;
  }

  botonSalir.addEventListener("click", abrirDialogo);
  botonNo.addEventListener("click", cerrarDialogo);
  opcionSi.addEventListener("click", irAlMenuPrincipal);
})();