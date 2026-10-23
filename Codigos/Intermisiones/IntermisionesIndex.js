/* ==========================================================================
   IntermisionesIndex.js
   Botón "MENÚ" de la pantalla de intermisión: lleva de vuelta al menú
   principal.
   ========================================================================== */

(function () {
  // Ruta relativa a la ubicación de IntermisionesIndex.html.
  const RUTA_MENU_PRINCIPAL = "../Menú_Principal/MenúPrincipal.html";

  const botonMenu = document.getElementById("salir");
  if (!botonMenu) return;

  botonMenu.addEventListener("click", () => {
    window.location.href = RUTA_MENU_PRINCIPAL;
  });
})();
