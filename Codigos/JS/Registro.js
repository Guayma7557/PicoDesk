/* ==========================================================================
   Registro.js
   Lógica del formulario de registro: DNI solo números, "Confirmar
   Contraseña" tiene que coincidir con "Contraseña", y el envío guarda
   nombre, apellido, DNI y contraseña en Supabase (tabla "Registros").
   Los datos escolares todavía no se envían a ninguna tabla.
   Requisito: haber ejecutado Registros.sql en el SQL Editor de Supabase.
   ========================================================================== */

(function () {
    'use strict';

    // --------------- Configuración de Supabase ---------------
    // Project Settings -> API. Usar SOLO la clave pública (anon / publishable).
    // Nunca pegar acá la clave "service_role".
    const SUPABASE_URL = 'https://cvlkzvuojsjdhtovnepm.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_pqirQp0JzvHi64Gjh-5WdQ_oS5hEM7p';

    const formulario = document.getElementById('formRegistro');
    const inputDni = document.getElementById('dni');
    const inputContraseña = document.getElementById('contraseña');
    const inputConfirmar = document.getElementById('confirmarContraseña');
    const botonCancelar = document.getElementById('btnCancelarRegistro');
    const botonRegistrar = formulario ? formulario.querySelector('.btn-registrar') : null;

    if (!formulario) return;

    // Cliente de Supabase (se crea una sola vez, solo si la librería cargó
    // y la configuración fue completada).
    let db = null;
    const configuracionCompleta =
        window.supabase &&
        !SUPABASE_URL.includes('TU-PROYECTO') &&
        !SUPABASE_ANON_KEY.includes('TU_CLAVE');

    if (configuracionCompleta) {
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // DNI: solo números, igual que en el modal de "Iniciar sesión".
    // Además se exige que tenga 7 u 8 dígitos.
    function validarDni() {
        if (!inputDni.value) {
            inputDni.setCustomValidity('');
            return;
        }
        inputDni.setCustomValidity(
            /^\d{7,8}$/.test(inputDni.value) ? '' : 'El DNI debe tener 7 u 8 números.'
        );
    }

    if (inputDni) {
        inputDni.addEventListener('input', function () {
            inputDni.value = inputDni.value.replace(/\D/g, '');
            validarDni();
        });
    }

    // Política mínima de contraseña: 8 a 72 caracteres, con una mayúscula
    // y un número (el servidor vuelve a validarlo).
    function validarFormatoContraseña() {
        const valor = inputContraseña.value;
        const valida =
            !valor ||
            (valor.length >= 8 && valor.length <= 72 && /[A-Z]/.test(valor) && /[0-9]/.test(valor));
        inputContraseña.setCustomValidity(
            valida ? '' : 'La contraseña debe tener entre 8 y 72 caracteres, con al menos una mayúscula y un número.'
        );
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
        inputContraseña.addEventListener('input', function () {
            validarFormatoContraseña();
            validarCoincidenciaContraseñas();
        });
        inputConfirmar.addEventListener('input', validarCoincidenciaContraseñas);
    }

    formulario.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        validarDni();
        validarFormatoContraseña();
        validarCoincidenciaContraseñas();

        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        if (!db) {
            console.error('Supabase no está configurado: completá SUPABASE_URL y SUPABASE_ANON_KEY en Registro.js.');
            alert('El registro no está disponible por el momento.');
            return;
        }

        // Solo datos personales. "Confirmar contraseña" no se envía.
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const dni = inputDni.value.trim();
        const contraseña = inputContraseña.value;

        if (botonRegistrar) botonRegistrar.disabled = true;

        // La contraseña viaja por HTTPS y se cifra (bcrypt) dentro de la base
        // de datos; nunca se guarda en texto plano.
        const { error } = await db.rpc('registrar_usuario', {
            p_dni: dni,
            p_nombre: nombre,
            p_apellido: apellido,
            p_password: contraseña,
        });

        if (botonRegistrar) botonRegistrar.disabled = false;

        if (error) {
            if (error.code === '23505') {
                alert('Ese DNI ya está registrado.');
            } else {
                // No se muestran detalles técnicos al usuario ni se registran datos sensibles.
                console.error('Error al registrar:', error.message);
                alert('No se pudo completar el registro. Intentá de nuevo más tarde.');
            }
            return;
        }

        alert(`¡Registro exitoso! Bienvenido, ${nombre}.`);
        window.location.href = 'MenúPrincipal.html';
    });

    if (botonCancelar) {
        botonCancelar.addEventListener('click', function () {
            window.location.href = 'MenúPrincipal.html';
        });
    }
})();