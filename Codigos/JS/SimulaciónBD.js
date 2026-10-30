// [NUEVO] Variable global para el tamaño de la sala
        let tamanoSala = 6;
	const RUTA_SALA_ESPERA = "SalaEspera.html";
	const btn_Crear_Sala = document.getElementbyId("btn-crear");

        // [NUEVO] Función para abrir un modal y aplicar el blur
        function abrirModal(idModal) {
            const modal = document.getElementById(idModal);
            if (modal) {
                modal.classList.add('active');
                // [NUEVO] Añadir clase al body para desenfocar el fondo
                document.body.classList.add('modal-abierto');
            }
        }

        // [NUEVO] Función para cerrar un modal y quitar el blur
        function cerrarModal(idModal) {
            const modal = document.getElementById(idModal);
            if (modal) {
                modal.classList.remove('active');
                // [NUEVO] Quitar clase al body
                document.body.classList.remove('modal-abierto');
                // [NUEVO] Limpiar el input al cerrar
                const input = modal.querySelector('.modal-input');
                if (input) input.value = '';
            }
        }

        // [NUEVO] Función para cambiar el tamaño de la sala (Crear Sala)
        function cambiarTamano(cambio) {
            tamanoSala += cambio;
            // [NUEVO] Límites lógicos (mínimo 2, máximo 12)
            if (tamanoSala < 2) tamanoSala = 2;
            if (tamanoSala > 12) tamanoSala = 12;
            document.getElementById('valorTamano').textContent = tamanoSala;
        }

        // [NUEVO] Simulación de envío para "Unirse a Sala"
        function enviarUnirse() {
            const codigo = document.getElementById('inputCodigoUnirse').value.trim();
            
            if (codigo === '') {
                alert('Por favor, ingresa un código de sala.');
                return;
            }

            // [NUEVO] Simulación de consulta a base de datos ficticia
            console.log(`Buscando sala con código: ${codigo}...`);
            
            // [NUEVO] Simulamos que el código "PICO" existe en la base de datos
            if (codigo.toUpperCase() === 'PICO' || codigo === '1234') {
                alert(`¡Éxito! Te has unido a la sala: ${codigo.toUpperCase()}`);
                cerrarModal('modalUnirse');
            } else {
                alert('Error: El código de sala no existe o es incorrecto. Intenta de nuevo.');
            }
        }

        // [NUEVO] Simulación de envío para "Crear Sala"
        function enviarCrear() {
            const codigo = document.getElementById('inputCodigoCrear').value.trim();
            
            if (codigo === '') {
                alert('Por favor, ingresa un código para la nueva sala.');
                return;
            }

            // [NUEVO] Simulación de inserción en base de datos ficticia
            console.log(`Creando sala con código: ${codigo.toUpperCase()} y tamaño: ${tamanoSala}...`);
            
            alert(`¡Sala creada con éxito!\nCódigo: ${codigo.toUpperCase()}\nTamaño: ${tamanoSala} jugadores.`);
            cerrarModal('modalCrear');

			// [NUEVO] Redirigir a la Sala de Espera pasando código y tamaño por URL
    		window.location.href = RUTA_SALA_ESPERA + '?codigo=' + encodeURIComponent(codigo.toUpperCase()) + '&tamano=' + tamanoSala;

        }

        // [NUEVO] Cerrar modal si se hace clic fuera del contenido
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
                document.body.classList.remove('modal-abierto');
            }
        });

	btn_Crear_Sala.addEventListener('click', () =>{
		window.location.href = RUTA_SALA_ESPERA;
	});
