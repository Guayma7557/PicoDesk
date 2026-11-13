/* ==========================================================================
   Tutorial.js
   Sistema de tutorial genérico reutilizable para todos los niveles.
   Basado en Recorrido.js.
   ========================================================================== */

window.iniciarTutorial = function (pasos, claveVisto) {
  // Si ya se vio en esta sesión, no volver a mostrarlo
  if (sessionStorage.getItem(claveVisto) === '1') return;

  const MARGEN_FOCO = 6;
  const SEPARACION = 18;
  let indice = 0;
  let bloqueo, foco, tarjeta;

  function marcarVisto() {
    sessionStorage.setItem(claveVisto, '1');
  }

  function crearElementos() {
    bloqueo = document.createElement('div');
    bloqueo.className = 'tour-bloqueo';

    foco = document.createElement('div');
    foco.className = 'tour-foco';

    tarjeta = document.createElement('div');
    tarjeta.className = 'tour-tarjeta';
    tarjeta.innerHTML = `
      <h2 id="tourTitulo"></h2>
      <p id="tourTexto"></p>
      <div class="tour-puntos" id="tourPuntos"></div>
      <div class="tour-botones">
        <button type="button" class="tour-omitir" id="tourOmitir">Omitir</button>
        <button type="button" class="tour-siguiente" id="tourSiguiente">
          <span id="tourSiguienteTexto">Siguiente</span>
        </button>
      </div>
    `;

    document.body.appendChild(bloqueo);
    document.body.appendChild(foco);
    document.body.appendChild(tarjeta);

    document.getElementById('tourOmitir').addEventListener('click', terminar);
    document.getElementById('tourSiguiente').addEventListener('click', siguiente);
  }

  function mostrarPaso() {
    const paso = pasos[indice];
    const objetivo = document.querySelector(paso.selector);

    if (!objetivo) { siguiente(); return; }

    document.getElementById('tourTitulo').textContent = paso.titulo;
    document.getElementById('tourTexto').textContent = paso.texto;

    const puntos = document.getElementById('tourPuntos');
    puntos.innerHTML = '';
    pasos.forEach((_, i) => {
      const p = document.createElement('span');
      p.className = 'tour-punto' + (i === indice ? ' activo' : '');
      p.textContent = i <= indice ? '●' : '○';
      puntos.appendChild(p);
    });

    document.getElementById('tourSiguienteTexto').textContent =
      (indice === pasos.length - 1) ? '¡Entendido!' : 'Siguiente';

    // Si el paso requiere un efecto especial (como en nivel 5)
    if (paso.accionEspecial) paso.accionEspecial();

    posicionar(objetivo);
  }

  function posicionar(objetivo) {
    const r = objetivo.getBoundingClientRect();
    
    foco.style.top = (r.top - MARGEN_FOCO) + 'px';
    foco.style.left = (r.left - MARGEN_FOCO) + 'px';
    foco.style.width = (r.width + MARGEN_FOCO * 2) + 'px';
    foco.style.height = (r.height + MARGEN_FOCO * 2) + 'px';

    const tw = tarjeta.offsetWidth;
    const th = tarjeta.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const espacio = SEPARACION + MARGEN_FOCO;

    const centroX = r.left + r.width / 2;
    const centroY = r.top + r.height / 2;

    let lado, x, y;
    if (r.right + espacio + tw <= vw - 8) {
      lado = 'derecha'; x = r.right + espacio; y = centroY - 34;
    } else if (r.left - espacio - tw >= 8) {
      lado = 'izquierda'; x = r.left - espacio - tw; y = centroY - 34;
    } else if (r.bottom + espacio + th <= vh - 8) {
      lado = 'abajo'; x = centroX - tw / 2; y = r.bottom + espacio;
    } else {
      lado = 'arriba'; x = centroX - tw / 2; y = r.top - espacio - th;
    }

    x = Math.max(8, Math.min(x, vw - tw - 8));
    y = Math.max(8, Math.min(y, vh - th - 8));

    tarjeta.style.left = x + 'px';
    tarjeta.style.top = y + 'px';
    tarjeta.setAttribute('data-lado', lado);

    const flecha = (lado === 'derecha' || lado === 'izquierda')
      ? centroY - y - 7 : centroX - x - 7;
    const limite = (lado === 'derecha' || lado === 'izquierda') ? th : tw;
    tarjeta.style.setProperty('--TourFlecha', Math.max(14, Math.min(flecha, limite - 28)) + 'px');
  }

  function siguiente() {
    if (indice >= pasos.length - 1) { terminar(); return; }
    indice++;
    mostrarPaso();
  }

  function terminar() {
    marcarVisto();
    window.removeEventListener('resize', alRedimensionar);
    [bloqueo, foco, tarjeta].forEach(el => el && el.remove());
  }

  function alRedimensionar() {
    const objetivo = document.querySelector(pasos[indice].selector);
    if (objetivo) posicionar(objetivo);
  }

  crearElementos();
  window.addEventListener('resize', alRedimensionar);
  mostrarPaso();
};