/* ==========================================================================
   Perfil.js
   Muestra los datos de la sesión iniciada. Lee la misma clave que
   Iniciarsesion.js (sessionStorage 'picodesk_sesion'), que guarda
   { dni, nombre, apellido, establecimiento, especialidad,
   curso, division }. Si no hay sesión, vuelve al Menú principal.
   ========================================================================== */

(function () {
    'use strict';

    const CLAVE_SESION = 'picodesk_sesion';
    const PAGINA_MENU = 'MenúPrincipal.html';

    function leerSesion() {
        try {
            const crudo = sessionStorage.getItem(CLAVE_SESION);
            return crudo ? JSON.parse(crudo) : null;
        } catch (e) {
            return null;
        }
    }

    const sesion = leerSesion();

    // Sin sesión no hay nada que mostrar: se vuelve al menú.
    if (!sesion || !sesion.nombre) {
        window.location.replace(PAGINA_MENU);
        return;
    }

    // textContent (nunca innerHTML) para que un nombre con código HTML no se ejecute.
    function poner(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto || '-';
    }

    poner('tituloPerfil', (sesion.nombre + ' ' + (sesion.apellido || '')).trim());
    poner('perfilNombre', sesion.nombre);
    poner('perfilApellido', sesion.apellido);
    poner('perfilDni', sesion.dni);
    poner('perfilEstablecimiento', sesion.establecimiento);
    poner('perfilEspecialidad', sesion.especialidad);
    poner('perfilCurso', sesion.curso);
    poner('perfilDivision', sesion.division);

    const botonVolver = document.getElementById('btnVolver');
    if (botonVolver) {
        botonVolver.addEventListener('click', function () {
            window.location.href = PAGINA_MENU;
        });
    }

    const botonCerrar = document.getElementById('btnCerrarSesion');
    if (botonCerrar) {
        botonCerrar.addEventListener('click', function () {
            if (!window.confirm('¿Estás seguro de que querés cerrar sesión?')) return;
            try { sessionStorage.removeItem(CLAVE_SESION); }
            catch (e) { /* sin almacenamiento disponible */ }
            window.location.href = PAGINA_MENU;
        });
    }
})();