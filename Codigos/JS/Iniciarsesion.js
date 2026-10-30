/* ================================================================= */
/* MODAL "INICIAR SESIÓN"                                            */
/* Usa abrirModal()/cerrarModal() ya definidas en SimulaciónBD.js     */
/* (son genéricas, reciben el id del modal) -> ese archivo no se      */
/* toca. Acá solo viven las dos cosas propias de este modal:          */
/*   1) que el campo DNI solo acepte números mientras se escribe.     */
/*   2) la simulación de "Iniciar" (mismo criterio que enviarUnirse   */
/*      y enviarCrear: valida, simula, y cierra el modal).            */
/* ================================================================= */
(function () {
    'use strict';

    const inputDni = document.getElementById('inputDniIniciarSesion');

    // DNI: solo números. Cualquier otro carácter que se escriba o pegue
    // se descarta al vuelo (no bloquea la tecla, limpia el valor después).
    if (inputDni) {
        inputDni.addEventListener('input', function () {
            inputDni.value = inputDni.value.replace(/\D/g, '');
        });
    }

    // Se cuelga de "window" (no de un "const"/"let") porque se llama desde
    // el atributo onclick del botón en el HTML, mismo patrón que
    // enviarUnirse()/enviarCrear() en SimulaciónBD.js.
    window.enviarIniciarSesion = function enviarIniciarSesion() {
        const dni = document.getElementById('inputDniIniciarSesion').value.trim();
        const contraseña = document.getElementById('inputContraseñaIniciarSesion').value;

        if (dni === '' || contraseña === '') {
            alert('Completá el DNI y la contraseña para iniciar sesión.');
            return;
        }

        // [NUEVO] Simulación de validación contra una base de datos ficticia
        // (todavía no hay backend real conectado).
        console.log(`Iniciando sesión con DNI: ${dni}...`);

        alert(`¡Bienvenido! Iniciaste sesión con el DNI ${dni}.`);
        cerrarModal('modalIniciarSesion');
    };
})();