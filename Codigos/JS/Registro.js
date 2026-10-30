/* ==========================================================================
   Registro.js
   Lógica del formulario de registro: DNI solo números, "Confirmar
   Contraseña" tiene que coincidir con "Contraseña", y el envío simula el
   alta (todavía no hay backend conectado, mismo criterio que
   enviarUnirse()/enviarCrear() del Menú principal).
   ========================================================================== */

(function () {
    'use strict';

    const formulario = document.getElementById('formRegistro');
    const inputDni = document.getElementById('dni');
    const inputContraseña = document.getElementById('contraseña');
    const inputConfirmar = document.getElementById('confirmarContraseña');
    const botonCancelar = document.getElementById('btnCancelarRegistro');

    if (!formulario) return;

    // DNI: solo números, igual que en el modal de "Iniciar sesión".
    if (inputDni) {
        inputDni.addEventListener('input', function () {
            inputDni.value = inputDni.value.replace(/\D/g, '');
        });
    }

    // Aviso en vivo si "Confirmar Contraseña" todavía no coincide, sin
    // esperar a que se intente enviar el formulario.
    function validarCoincidenciaContraseñas() {
        if (!inputConfirmar.value) {
            inputConfirmar.setCustomValidity('');
            return;
        }
        inputConfirmar.setCustomValidity(
            inputConfirmar.value === inputContraseña.value ? '' : 'Las contraseñas no coinciden.'
        );
    }

    if (inputContraseña && inputConfirmar) {
        inputContraseña.addEventListener('input', validarCoincidenciaContraseñas);
        inputConfirmar.addEventListener('input', validarCoincidenciaContraseñas);
    }

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        validarCoincidenciaContraseñas();

        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            dni: inputDni.value.trim(),
            establecimiento: document.getElementById('establecimiento').value.trim(),
            especialidad: document.getElementById('especialidad').value.trim(),
            estrato: document.getElementById('estrato').value.trim(),
            curso: document.getElementById('curso').value.trim(),
            division: document.getElementById('division').value.trim(),
        };

        // [NUEVO] Simulación de alta en una base de datos ficticia (no hay
        // backend real todavía).
        console.log('Registrando usuario:', datos);

        alert(`¡Registro exitoso! Bienvenido, ${datos.nombre}.`);
        window.location.href = 'MenúPrincipal.html';
    });

    if (botonCancelar) {
        botonCancelar.addEventListener('click', function () {
            window.location.href = 'MenúPrincipal.html';
        });
    }
})();