/* ================================================================= */
/* MODAL "INICIAR SESIÓN"                                            */
/* Usa abrirModal()/cerrarModal() ya definidas en SimulaciónBD.js     */
/* (son genéricas, reciben el id del modal) -> ese archivo no se      */
/* toca. Acá viven las cosas propias de este modal:                   */
/*   1) que el campo DNI solo acepte números mientras se escribe.     */
/*   2) el inicio de sesión real: se comprueba el DNI y la contraseña */
/*      en Supabase (función iniciar_sesion de Registros.sql).        */
/*   3) mostrar quién inició sesión en el botón del header, con la    */
/*      opción de cerrar sesión (pide confirmación en un modal).      */
/* Requiere SupabaseConfig.js cargado antes (define window.PicoDeskDB) */
/* ================================================================= */
(function () {
    'use strict';

    const CLAVE_SESION = 'picodesk_sesion';

    const inputDni = document.getElementById('inputDniIniciarSesion');
    const inputContraseña = document.getElementById('inputContraseñaIniciarSesion');
    const botonIniciar = document.getElementById('btn-iniciar-sesion');
    const botonHeader = document.getElementById('IniciarSesión');

    // Cliente de Supabase compartido (null si falta completar SupabaseConfig.js).
    const db = window.PicoDeskDB || null;

    // ---------- Sesión (solo para mostrar quién está conectado) ----------
    // Se guarda en sessionStorage: se borra al cerrar la pestaña. Nunca se
    // guarda la contraseña. Es un dato de interfaz, no una protección: si más
    // adelante hay datos privados, hay que validarlos del lado del servidor.
    function leerSesion() {
        try {
            const crudo = sessionStorage.getItem(CLAVE_SESION);
            return crudo ? JSON.parse(crudo) : null;
        } catch (e) {
            return null;
        }
    }

    function guardarSesion(sesion) {
        try { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); }
        catch (e) { /* sin almacenamiento disponible */ }
    }

    function borrarSesion() {
        try { sessionStorage.removeItem(CLAVE_SESION); }
        catch (e) { /* sin almacenamiento disponible */ }
    }

    // [NUEVO] Al tocar "Cerrar sesión (nombre)" ya no se cierra la sesión de
    // una: se abre un modal de confirmación ("¿Estás seguro?").
    function pedirConfirmacionCerrarSesion() {
        const sesion = leerSesion();
        const spanNombre = document.getElementById('nombreCerrarSesion');
        // textContent (nunca innerHTML) para que un nombre con código HTML no se ejecute.
        if (spanNombre) spanNombre.textContent = sesion && sesion.nombre ? sesion.nombre : '';
        abrirModal('modalCerrarSesion');
    }

    // [NUEVO] Se llama desde el botón "Sí" del modal de confirmación.
    window.confirmarCerrarSesion = function confirmarCerrarSesion() {
        borrarSesion();
        actualizarBotonHeader();
        cerrarModal('modalCerrarSesion');
        alert('Cerraste sesión.');
    };

    // El botón del header cambia según haya o no sesión iniciada.
    // Se usa textContent (nunca innerHTML) para que un nombre con código
    // HTML no se ejecute.
    function actualizarBotonHeader() {
        if (!botonHeader) return;
        const sesion = leerSesion();
        if (sesion && sesion.nombre) {
            botonHeader.textContent = 'Cerrar sesión (' + sesion.nombre + ')';
            botonHeader.onclick = pedirConfirmacionCerrarSesion;
        } else {
            botonHeader.textContent = 'Iniciar sesión';
            botonHeader.onclick = function () { abrirModal('modalIniciarSesion'); };
        }
    }

    // DNI: solo números. Cualquier otro carácter que se escriba o pegue
    // se descarta al vuelo (no bloquea la tecla, limpia el valor después).
    if (inputDni) {
        inputDni.addEventListener('input', function () {
            inputDni.value = inputDni.value.replace(/\D/g, '');
        });
    }

    // Enter en cualquiera de los dos campos equivale a apretar "INICIAR".
    [inputDni, inputContraseña].forEach(function (campo) {
        if (!campo) return;
        campo.addEventListener('keydown', function (evento) {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                window.enviarIniciarSesion();
            }
        });
    });

    // Se cuelga de "window" (no de un "const"/"let") porque se llama desde
    // el atributo onclick del botón en el HTML, mismo patrón que
    // enviarUnirse()/enviarCrear() en SimulaciónBD.js.
    window.enviarIniciarSesion = async function enviarIniciarSesion() {
        const dni = inputDni.value.trim();
        const contraseña = inputContraseña.value;

        if (dni === '' || contraseña === '') {
            alert('Completá el DNI y la contraseña para iniciar sesión.');
            return;
        }

        if (!/^\d{7,8}$/.test(dni)) {
            alert('El DNI debe tener 7 u 8 números.');
            return;
        }

        if (!db) {
            console.error('Supabase no está configurado: completá SUPABASE_URL y SUPABASE_ANON_KEY en SupabaseConfig.js.');
            alert('El inicio de sesión no está disponible por el momento.');
            return;
        }

        if (botonIniciar) botonIniciar.disabled = true;

        let respuesta;
        try {
            // La contraseña viaja por HTTPS y se compara con el hash dentro
            // de la base de datos; nunca se descarga el hash.
            respuesta = await db.rpc('iniciar_sesion', {
                p_dni: dni,
                p_password: contraseña,
            });
        } catch (e) {
            respuesta = { data: null, error: e };
        }

        if (botonIniciar) botonIniciar.disabled = false;

        const { data, error } = respuesta;

        if (error || !data) {
            // Sin detalles técnicos para el usuario y sin datos sensibles en consola.
            console.error('Error al iniciar sesión:', error ? error.message : 'respuesta vacía');
            alert('No se pudo iniciar sesión. Intentá de nuevo más tarde.');
            return;
        }

        if (!data.ok) {
            inputContraseña.value = '';
            if (data.motivo === 'bloqueado') {
                alert('Demasiados intentos fallidos. Esperá 15 minutos e intentá de nuevo.');
            } else {
                // Mismo mensaje si el DNI no existe o la contraseña es incorrecta.
                alert('DNI o contraseña incorrectos.');
            }
            return;
        }

        guardarSesion({ dni: dni, nombre: data.nombre, apellido: data.apellido });
        inputDni.value = '';
        inputContraseña.value = '';
        actualizarBotonHeader();

        alert('¡Bienvenido, ' + data.nombre + '!');
        cerrarModal('modalIniciarSesion');
    };

    // Al cargar la página, mostrar si ya había una sesión en esta pestaña.
    actualizarBotonHeader();
})();