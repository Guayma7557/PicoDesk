/* ================================================================= */
/* RECORRIDO INTERACTIVO - Menú Principal de PicoDesk                */
/* Solo señala: Unirse a sala, Crear sala y Ajustes                  */
/* ================================================================= */
(function () {
    'use strict';

    // Clave para recordar que el recorrido ya se mostró (disparo único y persistente)
    const CLAVE_VISTO = 'picodesk_recorrido_menu_visto';

    // Pasos del recorrido
    const PASOS = [
        {
            selector: '#UnirseSala',
            titulo: 'Unirse a sala',
            texto: 'Ingresá el código que te pasaron y entrá a una partida que ya está creada.'
        },
        {
            selector: '#CrearSala',
            titulo: 'Crear sala',
            texto: 'Elegí el tamaño y un código, y compartilo con tus amigos para jugar juntos.'
        },
        {
            selector: '#Ajustes',
            titulo: 'Ajustes',
            texto: 'Acá podés cambiar las opciones del juego a tu gusto.'
        }
    ];

    const MARGEN_FOCO = 6;   // espacio entre el botón y el halo
    const SEPARACION = 18;   // espacio entre el halo y la tarjeta

    let indice = 0;
    let bloqueo, foco, tarjeta;

    // ---------- Persistencia (con protección por si localStorage falla) ----------
    function yaFueVisto() {
        try { return localStorage.getItem(CLAVE_VISTO) === '1'; }
        catch (e) { return false; }
    }
    function marcarVisto() {
        try { localStorage.setItem(CLAVE_VISTO, '1'); }
        catch (e) { /* sin persistencia disponible */ }
    }

    // ---------- Construcción de los elementos ----------
    function crearElementos() {
        bloqueo = document.createElement('div');
        bloqueo.className = 'tour-bloqueo';

        foco = document.createElement('div');
        foco.className = 'tour-foco';

        tarjeta = document.createElement('div');
        tarjeta.className = 'tour-tarjeta';
        tarjeta.setAttribute('role', 'dialog');
        tarjeta.setAttribute('aria-live', 'polite');
        tarjeta.innerHTML =
            '<h2 id="tourTitulo"></h2>' +
            '<p id="tourTexto"></p>' +
            '<div class="tour-puntos" id="tourPuntos" aria-hidden="true"></div>' +
            '<div class="tour-botones">' +
                '<button type="button" class="tour-omitir" id="tourOmitir">Omitir</button>' +
                '<button type="button" class="tour-siguiente" id="tourSiguiente">' +
                    '<span id="tourSiguienteTexto">Siguiente</span>' +
                    '<span class="tour-tecla">Enter</span>' +
                '</button>' +
            '</div>';

        document.body.appendChild(bloqueo);
        document.body.appendChild(foco);
        document.body.appendChild(tarjeta);

        document.getElementById('tourOmitir').addEventListener('click', terminar);
        document.getElementById('tourSiguiente').addEventListener('click', siguiente);
    }

    // ---------- Mostrar un paso ----------
    function mostrarPaso() {
        const paso = PASOS[indice];
        const objetivo = document.querySelector(paso.selector);

        // Si el botón no existe, salta al siguiente paso
        if (!objetivo) { siguiente(); return; }

        objetivo.scrollIntoView({ block: 'center', behavior: 'auto' });

        document.getElementById('tourTitulo').textContent = paso.titulo;
        document.getElementById('tourTexto').textContent = paso.texto;

        // Puntitos de progreso: ●●○
        const puntos = document.getElementById('tourPuntos');
        puntos.innerHTML = '';
        PASOS.forEach(function (_, i) {
            const p = document.createElement('span');
            p.className = 'tour-punto' + (i === indice ? ' activo' : '');
            p.textContent = i <= indice ? '●' : '○';
            puntos.appendChild(p);
        });

        // En el último paso el botón cambia de texto
        document.getElementById('tourSiguienteTexto').textContent =
            (indice === PASOS.length - 1) ? '¡Listo!' : 'Siguiente';

        posicionar(objetivo);
    }

    // ---------- Posicionar halo y tarjeta ----------
    function posicionar(objetivo) {
        const r = objetivo.getBoundingClientRect();

        // Halo sobre el botón
        foco.style.top = (r.top - MARGEN_FOCO) + 'px';
        foco.style.left = (r.left - MARGEN_FOCO) + 'px';
        foco.style.width = (r.width + MARGEN_FOCO * 2) + 'px';
        foco.style.height = (r.height + MARGEN_FOCO * 2) + 'px';

        // Medidas de la tarjeta
        const tw = tarjeta.offsetWidth;
        const th = tarjeta.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const espacio = SEPARACION + MARGEN_FOCO;

        const centroX = r.left + r.width / 2;
        const centroY = r.top + r.height / 2;

        // Orden de preferencia: derecha, izquierda, abajo, arriba
        let lado, x, y;
        if (r.right + espacio + tw <= vw - 8) {
            lado = 'derecha';
            x = r.right + espacio;
            y = centroY - 34;
        } else if (r.left - espacio - tw >= 8) {
            lado = 'izquierda';
            x = r.left - espacio - tw;
            y = centroY - 34;
        } else if (r.bottom + espacio + th <= vh - 8) {
            lado = 'abajo';
            x = centroX - tw / 2;
            y = r.bottom + espacio;
        } else {
            lado = 'arriba';
            x = centroX - tw / 2;
            y = r.top - espacio - th;
        }

        // Mantener la tarjeta dentro de la pantalla
        x = Math.max(8, Math.min(x, vw - tw - 8));
        y = Math.max(8, Math.min(y, vh - th - 8));

        tarjeta.style.left = x + 'px';
        tarjeta.style.top = y + 'px';
        tarjeta.setAttribute('data-lado', lado);

        // La flechita apunta al centro del botón
        const flecha = (lado === 'derecha' || lado === 'izquierda')
            ? centroY - y - 7
            : centroX - x - 7;
        const limite = (lado === 'derecha' || lado === 'izquierda') ? th : tw;
        tarjeta.style.setProperty('--TourFlecha',
            Math.max(14, Math.min(flecha, limite - 28)) + 'px');
    }

    // ---------- Navegación ----------
    function siguiente() {
        if (indice >= PASOS.length - 1) { terminar(); return; }
        indice++;
        mostrarPaso();
    }

    function terminar() {
        marcarVisto();
        document.removeEventListener('keydown', alTeclear, true);
        window.removeEventListener('resize', alRedimensionar);
        [bloqueo, foco, tarjeta].forEach(function (el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
    }

    function alTeclear(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            siguiente();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            terminar();
        }
    }

    function alRedimensionar() {
        const objetivo = document.querySelector(PASOS[indice].selector);
        if (objetivo) posicionar(objetivo);
    }

    // ---------- Inicio ----------
    function iniciar() {
        if (yaFueVisto()) return;   // disparo único: si ya se vio, no vuelve a aparecer
        indice = 0;
        crearElementos();
        document.addEventListener('keydown', alTeclear, true);
        window.addEventListener('resize', alRedimensionar);
        mostrarPaso();
        document.getElementById('tourSiguiente').focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    // Para probarlo de nuevo durante el desarrollo, ejecutá en la consola:
    //   localStorage.removeItem('picodesk_recorrido_menu_visto'); location.reload();
})();